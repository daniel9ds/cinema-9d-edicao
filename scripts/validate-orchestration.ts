/** Apenas mídia sintética; não é aprovação de trabalho de cliente. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {init,render,validate} from './cli.ts';
import {ROOT,writeJson,readJson,hashFile,run,probe} from './core.ts';
import {orchestration} from './orchestration.ts';
import {createStyle,registerStyle} from './library.ts';
import {applyStyle,listStyles} from './styles.ts';
import {JobSchema} from '../src/schema.ts';

const root=await fs.mkdtemp('/private/tmp/cinema04-validation-'),jobDir=path.join(root,'producao'),library=path.join(root,'biblioteca');
const results:Array<{check:string;passed:true}>=[];
const pass=(check:string)=>{results.push({check,passed:true});console.log('PASS: '+check);};
const syntheticOperator='CHECK AUTOMATIZADO — APENAS MÍDIA SINTÉTICA';
async function fixture(dir:string,flags:Record<string,string|boolean>){
  await init(dir,{nome:'SINTÉTICO — validação 0.4.0',...flags});
  const file=path.join(dir,'entrada/video.mp4');
  await run('ffmpeg',['-v','error','-n','-f','lavfi','-i','testsrc2=size=360x640:rate=30:duration=3','-f','lavfi','-i','sine=frequency=220:sample_rate=48000:duration=3','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-shortest',file],{quiet:true});
  const sourceSha256=await hashFile(file);
  await writeJson(path.join(dir,'trabalho/transcricao-original.json'),{version:1,language:'pt',model:'synthetic-validation',timing:'estimated',sourceSha256,words:['Fala','sintética','para','validar','versões.'].map((text,i)=>({text,start:i*.5,end:i*.5+.45}))},false);
  await writeJson(path.join(dir,'edicao/cortes.json'),{version:1,sourceDuration:3,segments:[{start:0,end:3}]},false);
  await writeJson(path.join(dir,'trabalho/cortes-origem.json'),{sourceSha256},false);
  await writeJson(path.join(dir,'edicao/cenas.json'),{version:1,status:'reviewed',scenes:[{id:'exemplo',start:0,end:3,title:'Validação sintética',subtitle:'Quadros e tom de teste.',branding:'show'}]},false);
}
async function active(){const p=await readJson(path.join(jobDir,'orquestracao/ativo.json'));const folder=path.join(jobDir,'orquestracao/lotes',p.batch);return {folder,state:await readJson(path.join(folder,'estado.json'))};}
try{
  await fixture(jobDir,{estilo:'exemplo'});const source=path.join(jobDir,'entrada/video.mp4'),original=await hashFile(source);
  await orchestration('produzir',jobDir,{versoes:'2',cpu:true});let {folder,state}=await active();assert.equal(state.phase,'aguardando-direcao');assert.equal(state.variants.length,0);pass('preparação local cria contrato, sem simular direção criativa');
  const cuts=await readJson(path.join(jobDir,'edicao/cortes.json')),scenes=await readJson(path.join(jobDir,'edicao/cenas.json'));
  const plan={version:1,inputFingerprint:state.inputFingerprint,requestedVariants:2,variants:[{id:'v001',label:'Composição A',strategy:'Texto com apresentador na base, voz original.',cuts,scenes},{id:'v002',label:'Composição B',strategy:'Enquadramento fechado e lettering; mesma voz original.',cuts,scenes:{...scenes,scenes:[{id:'b',start:0,end:3,title:'OUTRA COMPOSIÇÃO',lettering:{text:'VERSÃO B',top:280,size:100},viewport:{x:150,y:600,width:650,height:650},zoomTo:1.13,branding:'show'}]}}]};
  await writeJson(path.join(folder,'plano.json'),{...plan,requestedVariants:3},false);await assert.rejects(()=>orchestration('produzir',jobDir,{}));pass('quantidade incompatível bloqueada antes de materializar');
  await writeJson(path.join(folder,'plano.json'),plan,false);await orchestration('produzir',jobDir,{});({folder,state}=await active());assert.equal(state.phase,'aguardando-revisao');assert.equal(state.variants.length,2);
  for(const v of state.variants){const media=await probe(path.join(jobDir,v.preview));assert.equal(media.video.width,540);assert.equal(media.video.height,960);assert.ok(media.audio);assert.equal(await hashFile(path.join(jobDir,v.folder,'entrada/video.mp4')),original);}
  pass('duas versões independentes renderizadas, com áudio e dimensões corretas');
  const previewHashes=state.variants.map((v:any)=>v.previewSha256);await orchestration('produzir',jobDir,{});assert.deepEqual((await active()).state.variants.map((v:any)=>v.previewSha256),previewHashes);pass('retomada reutiliza prévias sem duplicar render');
  await assert.rejects(()=>orchestration('aprovar-lote',jobDir,{por:syntheticOperator}));pass('aprovação bloqueada sem revisão criativa atual');
  await writeJson(path.join(folder,'revisao-criativa.json'),{version:1,planSha256:state.planSha256,reviewer:syntheticOperator,variants:state.variants.map((v:any)=>({id:v.id,previewSha256:v.previewSha256,fingerprint:v.fingerprint,result:'pass',observations:['[0–3s] fixture sintética; registro usado apenas para exercitar os gates, não para julgar mídia real.'],checks:{speech:true,cuts:true,framing:true,legibility:true,sync:true,brand:true}}))},false);
  await orchestration('produzir',jobDir,{});assert.equal((await active()).state.phase,'previas-revisadas');
  await orchestration('aprovar-lote',jobDir,{por:syntheticOperator});await orchestration('finalizar-lote',jobDir,{});state=(await active()).state;assert.equal(state.phase,'finalizado');
  for(const v of state.variants){const media=await probe(path.join(jobDir,v.final));assert.equal(media.video.width,1080);assert.equal(media.video.height,1920);assert.ok(media.audio);}
  await orchestration('finalizar-lote',jobDir,{});assert.deepEqual((await active()).state.variants.map((v:any)=>v.finalSha256),state.variants.map((v:any)=>v.finalSha256));
  const savedState=structuredClone(state);for(const row of state.variants){delete row.final;delete row.finalSha256;}await writeJson(path.join(folder,'estado.json'),state,false);await orchestration('finalizar-lote',jobDir,{});state=(await active()).state;assert.deepEqual(state.variants.map((v:any)=>v.finalSha256),savedState.variants.map((v:any)=>v.finalSha256));
  pass('gates completos e finais nativos; retomada recupera final concluído antes do registro');
  const v=state.variants[0],preview=path.join(jobDir,v.preview),bytes=await fs.readFile(preview);await fs.appendFile(preview,'tamper');await assert.rejects(()=>orchestration('aprovar-lote',jobDir,{por:syntheticOperator}));await assert.rejects(()=>orchestration('lote-status',jobDir,{}));await fs.writeFile(preview,bytes);pass('alteração de MP4 detectada na aprovação e no status');
  await assert.rejects(()=>orchestration('produzir',jobDir,{versoes:'3'}));
  const frozen=await fs.readFile(path.join(folder,'plano.json'));await fs.appendFile(path.join(folder,'plano.json'),' ');await assert.rejects(()=>orchestration('produzir',jobDir,{}));await fs.writeFile(path.join(folder,'plano.json'),frozen);pass('direção e quantidade congeladas após montagem');
  await fs.appendFile(path.join(jobDir,'roteiro/briefing.md'),'Mudança de briefing');await assert.rejects(()=>orchestration('lote-status',jobDir,{}));await orchestration('produzir',jobDir,{novo:true,versoes:'3'});assert.equal((await active()).state.requestedVariants,3);assert.equal(await hashFile(source),original);assert.ok(await fs.stat(path.join(folder,'estado.json')));pass('novo lote preserva anteriores e originais; briefing invalida lote');
  const draft=path.join(root,'meu-estilo'),study=path.join(root,'estudo');await createStyle(draft,{id:'meu-estilo',nome:'Meu estilo',marca:'Minha marca',primaria:'#496cf5'});const draftProfile=await readJson(path.join(draft,'style.json'));draftProfile.tokens.captions.grouping='progressive';await writeJson(path.join(draft,'style.json'),draftProfile,false);await fixture(study,{perfil:path.join(draft,'style.json')});
  const studyJob=JobSchema.parse(await readJson(path.join(study,'job.json')));await render(study,studyJob,false);
  await assert.rejects(()=>render(study,studyJob,true));pass('rascunho permite estudo mas bloqueia final');
  const draftBytes=await fs.readFile(path.join(draft,'style.json'));const changed=JSON.parse(draftBytes.toString());changed.brand.primary='#aa3344';await writeJson(path.join(draft,'style.json'),changed,false);await assert.rejects(()=>registerStyle(draft,{estudo:study,por:syntheticOperator,biblioteca:library}));await fs.writeFile(path.join(draft,'style.json'),draftBytes);
  await registerStyle(draft,{estudo:study,por:syntheticOperator,biblioteca:library});assert.ok((await listStyles(library)).some(s=>s.id==='meu-estilo'&&s.scope==='reviewed-style'));await assert.rejects(()=>registerStyle(draft,{estudo:study,por:syntheticOperator,biblioteca:library}));
  const fresh=path.join(root,'outro-trabalho');await init(fresh,{nome:'Outro'});await applyStyle(fresh,'meu-estilo','1.0.0',library);assert.equal((await readJson(path.join(fresh,'marca/identidade.json'))).primary,'#496cf5');pass('outro usuário cria, estuda, registra e reutiliza estilo próprio imutável');
  const report={version:'0.4.0',at:new Date().toISOString(),root,results,syntheticOnly:true,providerCalls:0,clientMediaModified:false,firstBatch:folder,firstBatchState:state};
  await writeJson(path.join(ROOT,'docs/validacao-orquestracao-0.4.0.json'),report,false);console.log('RESULTADO: '+JSON.stringify({root,passed:results.length,report:path.join(ROOT,'docs/validacao-orquestracao-0.4.0.json')}));
}catch(error){console.error('Fixture preservada: '+root);throw error;}
