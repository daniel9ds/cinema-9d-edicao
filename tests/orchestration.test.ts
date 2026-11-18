import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {DirectionSchema,CreativeReviewSchema,variantCount,orchestration} from '../scripts/orchestration.ts';
import {createStyle,registerStyle,registerKit,applyKit} from '../scripts/library.ts';
import {applyStyle,applyProfile,listStyles,loadStyle} from '../scripts/styles.ts';
import {JobSchema,BrandSchema} from '../src/schema.ts';
import {ROOT,writeJson,readJson,hashFile} from '../scripts/core.ts';
import {init,validate} from '../scripts/cli.ts';
const hash='a'.repeat(64);
const variant=(id='v001',title='Ideia visual')=>({id,label:id,strategy:'Variação visual com composição própria',cuts:{version:1,sourceDuration:3,segments:[{start:0,end:3}]},scenes:{version:1,status:'reviewed',scenes:[{id:'a',start:0,end:3,title}]}});
const plan=()=>({version:1,inputFingerprint:hash,requestedVariants:2,variants:[variant(),variant('v002','Outra ideia')]});
async function tmp(){return fs.mkdtemp(path.join(os.tmpdir(),'cinema-orq-'));}
async function base(dir:string){await init(dir,{nome:'Teste'});await applyStyle(dir,'exemplo');}
test('quantidade exata, inteira e limitada; planos duplicados não viram versões',()=>{
  assert.equal(variantCount('3'),3);for(const n of [0,-1,2.5,101,'abc'])assert.throws(()=>variantCount(n));
  assert.equal(DirectionSchema.parse(plan()).variants.length,2);
  assert.throws(()=>DirectionSchema.parse({...plan(),requestedVariants:3}));
  assert.throws(()=>DirectionSchema.parse({...plan(),variants:[variant(),variant('v002')]}));
  assert.throws(()=>DirectionSchema.parse({...plan(),variants:[variant(),variant()]}));
  const p=plan();p.variants[0].scenes.scenes[0].end=2;assert.throws(()=>DirectionSchema.parse(p));
  const q=plan();q.variants[0].scenes.status='draft';assert.throws(()=>DirectionSchema.parse(q));
});
test('revisão exige checagens e evidência, sem campo de aprovação humana',()=>{
  const r={version:1,planSha256:hash,reviewer:'Agente',variants:[{id:'v001',previewSha256:hash,fingerprint:hash,result:'pass',observations:['[0–3s] leitura e foco conferidos.'],checks:{speech:true,cuts:true,framing:true,legibility:true,sync:true,brand:true}}]};
  assert.equal(CreativeReviewSchema.parse(r).reviewer,'Agente');assert.throws(()=>CreativeReviewSchema.parse({...r,by:'Pessoa'}));
  assert.throws(()=>CreativeReviewSchema.parse({...r,variants:[{...r.variants[0],checks:{...r.variants[0].checks,sync:false}}]}));
});
test('estilo próprio nasce rascunho neutro e não herda aprovação do exemplo',async()=>{
  const root=await tmp();try{
    const p=await createStyle(path.join(root,'draft'),{id:'minha-marca',nome:'Minha',marca:'Minha marca'});
    assert.equal(p.reference.approvalScope,'draft-style');assert.equal(p.brand.name,'Minha marca');assert.equal(p.brand.fontFamily,'Arial');
    await assert.rejects(()=>createStyle(path.join(root,'draft'),{id:'outra',nome:'Outra'}));
    await assert.rejects(()=>registerStyle(path.join(root,'draft'),{por:'Operador',estudo:path.join(root,'missing'),biblioteca:path.join(root,'lib')}));
    await base(path.join(root,'job'));await writeJson(path.join(root,'job/marca/identidade.json'),BrandSchema.parse({name:'Sua marca'}));
    await applyProfile(path.join(root,'job'),path.join(root,'draft/style.json'));
    const job=JobSchema.parse(await readJson(path.join(root,'job/job.json')));assert.equal((await loadStyle(path.join(root,'job'),job))?.id,'minha-marca');
    await fs.appendFile(path.join(root,'job/marca/estilo.json'),' ');await assert.rejects(()=>loadStyle(path.join(root,'job'),job));
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('kit usa lista explícita, verifica hash e não copia gravações ou sobrescreve marca',async()=>{
  const root=await tmp();try{
    const source=path.join(root,'source'),lib=path.join(root,'lib');await base(source);
    await fs.writeFile(path.join(source,'marca/logo.svg'),'<svg/>');await fs.writeFile(path.join(source,'entrada/privado.mov'),'não copiar');
    const brand={...await readJson(path.join(source,'marca/identidade.json')),logo:'marca/logo.svg'};
    const manifest=path.join(root,'manifest.json');await writeJson(manifest,{version:1,id:'kit-teste',description:'Kit teste',assets:[{source:'marca/logo.svg',target:'marca/logo.svg'}],brand,notes:['Regra consolidada com evidência']});
    const kit=await registerKit(source,manifest,lib);assert.deepEqual((await fs.readdir(kit)).sort(),['kit.json','marca','style.json']);
    assert.equal(await hashFile(path.join(kit,'marca/logo.svg')),await hashFile(path.join(source,'marca/logo.svg')));
    await assert.rejects(()=>registerKit(source,manifest,lib));
    const dest=path.join(root,'dest');await init(dest,{nome:'Novo'});await applyKit(dest,'kit-teste',lib);
    assert.equal((await readJson(path.join(dest,'marca/kit.json'))).notes.length,1);await applyKit(dest,'kit-teste',lib);
    await fs.writeFile(path.join(kit,'marca/logo.svg'),'<svg>changed</svg>');await assert.rejects(()=>applyKit(dest,'kit-teste',lib));
    assert.equal(await fs.readFile(path.join(source,'entrada/privado.mov'),'utf8'),'não copiar');
    const bad={...await readJson(manifest),id:'bad',assets:[{source:'../outside',target:'marca/logo.svg'}]};await writeJson(manifest,bad);await assert.rejects(()=>registerKit(source,manifest,lib));
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('catálogo não aceita sombra sobre id/versão central',async()=>{
  const root=await tmp();try{
    const target=path.join(root,'styles/exemplo/1.0.0');await fs.mkdir(target,{recursive:true});
    await fs.copyFile(path.join(ROOT,'styles/exemplo/1.0.0/style.json'),path.join(target,'style.json'));
    await assert.rejects(()=>listStyles(root),/duplicado/);
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('orquestrador bloqueia trava duplicada e não aceita estado malformado',async()=>{
  const root=await tmp();try{
    await fs.writeFile(path.join(root,'.cinema-orquestracao.lock'),'{}');await assert.rejects(()=>orchestration('lote-status',root,{}),/execução/);
    await fs.rm(path.join(root,'.cinema-orquestracao.lock'));await writeJson(path.join(root,'orquestracao/ativo.json'),{batch:'../../fora'});await assert.rejects(()=>orchestration('lote-status',root,{}));
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
