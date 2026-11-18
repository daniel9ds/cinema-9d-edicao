import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {StyleProfileSchema,phraseGroups,captionsHidden} from '../src/styles.ts';
import {JobSchema,BrandSchema,SceneSchema} from '../src/schema.ts';
import {ROOT,readJson,writeJson,hashFile} from '../scripts/core.ts';
import {applyStyle,loadStyle,listStyles} from '../scripts/styles.ts';
import {revision,assertCentral,learn} from '../scripts/projects.ts';

const profile=StyleProfileSchema.parse(await readJson(path.join(ROOT,'styles/exemplo/1.0.0/style.json')));
const scene=()=>SceneSchema.parse({id:'x',start:0,end:5,type:'headline',title:'Ideia'});
async function fixture(){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'cinema-style-'));
  for(const sub of ['marca','edicao','trabalho','entrada'])await fs.mkdir(path.join(dir,sub));
  await writeJson(path.join(dir,'job.json'),JobSchema.parse({version:1,name:'Teste'}),false);
  await writeJson(path.join(dir,'marca/identidade.json'),BrandSchema.parse({name:'Sua marca'}),false);
  return dir;
}
test('catálogo valida identidade/versão e mantém perfil sem mídia privada',async()=>{
  const styles=await listStyles();assert.ok(styles.some(s=>s.id==='exemplo'&&s.version==='1.0.0'));
  assert.equal(profile.reference.approvalScope,'reference-production-only');
  assert.equal('logo' in profile.brand,false);assert.equal('fontFile' in profile.brand,false);
});
test('base antiga continua sem referência de estilo e com defaults antigos',()=>{
  const job=JobSchema.parse({version:1,name:'Anterior'});
  assert.equal(job.style,undefined);assert.deepEqual(job.framing,{x:50,y:45});assert.equal(scene().captionMode,undefined);
});
test('perfil rejeita legendas fora da área segura e identificador inválido',()=>{
  assert.throws(()=>StyleProfileSchema.parse({...profile,id:'../fora'}));
  const bad=structuredClone(profile);bad.tokens.captions.top=1590;assert.throws(()=>StyleProfileSchema.parse(bad));
});
test('legendas respeitam supressão pontual e não ocultam a cena inteira',()=>{
  const s=SceneSchema.parse({...scene(),captionSuppression:[{start:1,end:2}]});
  assert.equal(captionsHidden(s,.9),false);assert.equal(captionsHidden(s,1),true);assert.equal(captionsHidden(s,2),false);
  assert.equal(captionsHidden({...s,captionMode:'hide'},3),true);
});
test('supressão de legenda exige intervalo dentro da própria cena',()=>{
  assert.throws(()=>SceneSchema.parse({...scene(),captionSuppression:[{start:4,end:6}]}));
});
test('legendas em frases mantêm um grupo estável e separam pontuação e pausas',()=>{
  const words=[{text:'Uma',start:.1,end:.3},{text:'ideia.',start:.35,end:.6},{text:'Outra',start:.7,end:1},{text:'parte',start:2,end:2.4}];
  const groups=phraseGroups(words,scene(),profile.tokens.captions);
  assert.deepEqual(groups.map(g=>g.words.map(w=>w.text)),[['Uma','ideia.'],['Outra'],['parte']]);
  assert.equal(groups.find(g=>.2>=g.start&&.2<g.end),groups.find(g=>.5>=g.start&&.5<g.end));
});
test('grupos de legenda respeitam limites e não vazam entre cenas',()=>{
  const words=Array.from({length:8},(_,i)=>({text:'palavra',start:i*.5,end:i*.5+.4}));
  const s=SceneSchema.parse({...scene(),start:1,end:3});
  const groups=phraseGroups(words,s,{...profile.tokens.captions,maxWords:2,maxCharacters:15});
  assert.ok(groups.every(g=>g.words.length<=2&&g.start>=1&&g.end<=3));assert.equal(groups[0].words[0].start,1);
});
test('conexões e keyframes rejeitam IDs ausentes e tempos fora da cena',()=>{
  const element={id:'a',kind:'card',title:'A',x:90,y:500,width:300,height:200};
  assert.throws(()=>SceneSchema.parse({...scene(),elements:[element],connections:[{from:'a',to:'b'}]}));
  assert.throws(()=>SceneSchema.parse({...scene(),elements:[{...element,keyframes:[{time:0,x:90,y:500},{time:6,x:100,y:500}]}]}));
  assert.throws(()=>SceneSchema.parse({...scene(),elements:[{...element,kind:'icon'}]}));
});
test('viewport e supressão do apresentador preservam configuração de áudio',()=>{
  assert.throws(()=>SceneSchema.parse({...scene(),viewport:{x:900,y:0,width:300,height:400}}));
  const hidden=SceneSchema.parse({...scene(),presenter:'hide'});assert.equal(hidden.presenter,'hide');assert.equal('mute' in hidden,false);
});
test('estilo é copiado e fixado por hash na produção; alteração é detectada',async()=>{
  const dir=await fixture();try{
    await applyStyle(dir,'exemplo','1.0.0');const job=JobSchema.parse(await readJson(path.join(dir,'job.json')));
    assert.equal(job.style?.sha256,await hashFile(path.join(dir,'marca/estilo.json')));
    assert.equal((await loadStyle(dir,job))?.id,'exemplo');
    const changed=await readJson(path.join(dir,'marca/estilo.json'));changed.tokens.motion.entrySeconds=.8;
    await writeJson(path.join(dir,'marca/estilo.json'),changed,false);await assert.rejects(loadStyle(dir,job));
  }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('não aplica o estilo sobre outra marca nem reabre prévia na mesma revisão',async()=>{
  const dir=await fixture();try{
    await writeJson(path.join(dir,'marca/identidade.json'),BrandSchema.parse({name:'Outra marca'}),false);
    await assert.rejects(applyStyle(dir,'exemplo'));assert.equal((await readJson(path.join(dir,'marca/identidade.json'))).name,'Outra marca');
    await writeJson(path.join(dir,'marca/identidade.json'),BrandSchema.parse({name:'Sua marca'}),false);
    await writeJson(path.join(dir,'trabalho/ultima-previa.json'),{revision:'r01'},false);
    await assert.rejects(applyStyle(dir,'exemplo'));
  }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('revisão preserva o snapshot do estilo e não move a mídia',async()=>{
  const dir=await fixture();try{
    await applyStyle(dir,'exemplo');await fs.writeFile(path.join(dir,'entrada/video.mp4'),'original-ficticio');
    const source=await hashFile(path.join(dir,'entrada/video.mp4'));
    await revision(dir,JobSchema.parse(await readJson(path.join(dir,'job.json'))),'r02','Teste');
    const saved=(await fs.readdir(path.join(dir,'revisoes'),{withFileTypes:true})).find(e=>e.isDirectory())!;
    assert.ok(await fs.stat(path.join(dir,'revisoes',saved.name,'marca/estilo.json')));
    assert.equal(await hashFile(path.join(dir,'entrada/video.mp4')),source);assert.equal((await readJson(path.join(dir,'job.json'))).revision,'r02');
  }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('montagem própria impede a base histórica e aprendizado não modifica o perfil',async()=>{
  const dir=await fixture();try{
    await fs.mkdir(path.join(dir,'edicao/remotion-propria'));await assert.rejects(assertCentral(dir,JobSchema.parse(await readJson(path.join(dir,'job.json')))));
    const source=path.join(ROOT,'styles/exemplo/1.0.0/style.json'),before=await hashFile(source);
    await learn(dir,{titulo:'Observação',observacao:'Leitura no celular',proposta:'Rever tamanho',evidencia:'Prévia, 2s'});
    const files=await fs.readdir(path.join(dir,'aprendizados'));assert.equal(files.length,1);assert.equal((await readJson(path.join(dir,'aprendizados',files[0]))).status,'proposto');assert.equal(await hashFile(source),before);
  }finally{await fs.rm(dir,{recursive:true,force:true});}
});
