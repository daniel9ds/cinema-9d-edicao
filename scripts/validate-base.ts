import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {ROOT,run,readJson,writeJson,hashFile,probe,exists} from './core.ts';
import type {RenderProps} from '../src/schema.ts';

// Validação local com fixtures; não usa produções, serviços pagos ou aprovação humana real.
async function main(){
  const base=await fs.mkdtemp(path.join(os.tmpdir(),'cinema9d-base-'));
  const report:{version:string;at:string;result:string;scope:string;checks:Array<{name:string;status:string;seconds:number;details?:unknown}>;artifacts:Record<string,string>;error?:string}={version:(await readJson(path.join(ROOT,'package.json'))).version,at:new Date().toISOString(),result:'running',scope:'Mídia e decisões sintéticas; não certifica anúncios reais nem aprova o estilo criativamente.',checks:[],artifacts:{}};
  const logDir=path.join(base,'logs');await fs.mkdir(logDir);
  const cli=(command:string,folder:string,...args:string[])=>run(process.execPath,['--import',path.join(ROOT,'node_modules/tsx/dist/loader.mjs'),path.join(ROOT,'scripts/cli.ts'),command,folder,...args],{quiet:true});
  const step=async(name:string,task:()=>Promise<unknown>)=>{const start=Date.now();console.log('Validando: '+name);try{const details=await task();report.checks.push({name,status:'passed',seconds:(Date.now()-start)/1000,details});}catch(e){report.checks.push({name,status:'failed',seconds:(Date.now()-start)/1000});throw e;}};
  const rejects=async(task:()=>Promise<unknown>)=>{let rejected=false;try{await task();}catch{rejected=true;}assert.ok(rejected,'A operação deveria ter sido rejeitada.');};
  const waitFor=async(task:()=>Promise<boolean>,timeout=30000)=>{const until=Date.now()+timeout;while(Date.now()<until){if(await task().catch(()=>false))return;await new Promise(r=>setTimeout(r,150));}throw Error('Estado esperado não foi alcançado a tempo.');};
  const legacy=path.join(base,'legado'),styled=path.join(base,'estilo');
  try{
    await step('TypeScript',()=>run('npm',['run','check'],{quiet:true,logFile:path.join(logDir,'typescript.log')}));
    await step('Testes automatizados',async()=>{const result=await run('npm',['test'],{quiet:true,logFile:path.join(logDir,'tests.log')});return {tests:Number(result.stdout.match(/tests\s+(\d+)/)?.[1]??0)};});
    await step('Pré-requisitos locais',async()=>{const config=await readJson(path.join(ROOT,'.runtime/machine.json'));assert.ok(await exists(config.browserExecutable));assert.ok(await exists(config.whisperModel));await run('ffmpeg',['-version'],{quiet:true});return{browser:true,whisperModel:true};});
    await step('Criação de fixtures e proteção do estilo',async()=>{
      await cli('demo',legacy);await cli('demo-estilo',styled);
      const arg=process.argv.indexOf('--font'),font=arg>=0?process.argv[arg+1]:undefined;
      if(font){await fs.copyFile(font,path.join(styled,'marca/fonte.woff2'));const f=path.join(styled,'marca/identidade.json');await writeJson(f,{...await readJson(f),fontFile:'marca/fonte.woff2'},false);}
      const file=path.join(styled,'marca/estilo.json'),saved=await fs.readFile(file);
      try{const changed=JSON.parse(saved.toString());changed.tokens.cards.radius=20;await writeJson(file,changed,false);await rejects(()=>cli('validar',styled));}finally{await fs.writeFile(file,saved);}
      return{fontProvided:!!font,source:'synthetic'};
    });
    const sources={legacy:await hashFile(path.join(legacy,'entrada/video.mp4')),style:await hashFile(path.join(styled,'entrada/video.mp4'))};
    await step('Bloqueios sem prévia e aprovação',async()=>{await rejects(()=>cli('aprovar',styled,'--por','CHECK SINTÉTICO'));await rejects(()=>cli('final',styled));return{syntheticOnly:true};});
    await step('Render da base anterior e do estilo',async()=>{
      await cli('previa',legacy);await cli('previa',styled);
      for(const [label,dir] of [['legacy',legacy],['style',styled]]){
        const preview=await readJson(path.join(dir,'trabalho/ultima-previa.json')),file=path.join(dir,preview.output),media=await probe(file);
        assert.equal(media.video.width,540);assert.equal(media.video.height,960);assert.ok(media.audio);assert.equal(media.video.r_frame_rate,'30/1');
        assert.equal(await hashFile(file),preview.outputSha256);report.artifacts[label+'Preview']=path.relative(base,file);
        const metadata=await readJson(file+'.json');assert.ok(Number(metadata.loudness.input_i)<=-14&&Number(metadata.loudness.input_i)>=-18);assert.ok(Number(metadata.loudness.input_tp)<=-1);
      }
      return{previewDimensions:'540x960',fps:30,audio:true};
    });
    await step('Quadros de composição e supressão visual de legendas',async()=>{
      const {bundle}=await import('@remotion/bundler'),{selectComposition,renderStill}=await import('@remotion/renderer');
      const props:RenderProps=await readJson(path.join(styled,'trabalho/render-props.json'));
      const serveUrl=await bundle({entryPoint:path.join(ROOT,'src/index.ts'),publicDir:path.join(styled,'trabalho/remotion/public'),outDir:path.join(base,'stills-bundle'),enableCaching:false});
      const composition=await selectComposition({serveUrl,id:'Cinema9DEdicao',inputProps:props}),dir=path.join(base,'quadros');await fs.mkdir(dir);
      for(const frame of [30,150,240,300,420])await renderStill({composition,serveUrl,inputProps:props,frame,scale:.5,output:path.join(dir,`frame-${frame}.png`)});
      const hidden=structuredClone(props);hidden.scenes[0].captionMode='hide';
      const hiddenComposition=await selectComposition({serveUrl,id:'Cinema9DEdicao',inputProps:hidden});
      const hiddenFile=path.join(dir,'sem-legenda.png');await renderStill({composition:hiddenComposition,serveUrl,inputProps:hidden,frame:30,scale:.5,output:hiddenFile});
      async function luminance(file:string){const r=await run('ffmpeg',['-hide_banner','-i',file,'-vf','crop=425:80:40:675,signalstats,metadata=print','-f','null','-'],{quiet:true});const value=Number(r.stderr.match(/lavfi.signalstats.YAVG=([\d.]+)/)?.[1]);assert.ok(Number.isFinite(value));return value;}
      const visible=await luminance(path.join(dir,'frame-30.png')),suppressed=await luminance(hiddenFile);assert.ok(suppressed-visible>5,'Supressão não alterou a faixa de legenda como esperado.');
      report.artifacts.frames='quadros';return{frames:6,captionLuminance:{visible,suppressed}};
    });
    await step('Prévia adulterada e mudanças invalidam aprovação',async()=>{
      const file=path.join(styled,'edicao/cenas.json'),scenes=await readJson(file);scenes.status='reviewed';await writeJson(file,scenes,false);
      const preview=await readJson(path.join(styled,'trabalho/ultima-previa.json')),mp4=path.join(styled,preview.output);
      await fs.appendFile(mp4,Buffer.from('synthetic-tamper'));await rejects(()=>cli('aprovar',styled,'--por','CHECK SINTÉTICO'));
      const bytes=await fs.readFile(mp4);await fs.writeFile(mp4,bytes.subarray(0,bytes.length-'synthetic-tamper'.length));
      await cli('aprovar',styled,'--por','CHECK AUTOMATIZADO — APENAS MÍDIA SINTÉTICA');
      const original=await fs.readFile(file);try{const edited=JSON.parse(original.toString());edited.scenes[0].title+=' alterado';await writeJson(file,edited,false);await rejects(()=>cli('final',styled));}finally{await fs.writeFile(file,original);}
      return{approvalIsFixture:true,productionApproval:false};
    });
    await step('Render nativo sintético e preservação das entradas',async()=>{
      await cli('final',styled);const files=(await fs.readdir(path.join(styled,'saida/final'))).filter(s=>s.endsWith('.mp4'));assert.equal(files.length,1);
      const file=path.join(styled,'saida/final',files[0]),media=await probe(file);assert.equal(media.video.width,1080);assert.equal(media.video.height,1920);assert.ok(media.audio);assert.ok(Math.abs(media.duration-16)<.1);
      assert.equal(await hashFile(path.join(legacy,'entrada/video.mp4')),sources.legacy);assert.equal(await hashFile(path.join(styled,'entrada/video.mp4')),sources.style);
      report.artifacts.nativeRender=path.relative(base,file);return{dimensions:'1080x1920',seconds:media.duration,sourceHashesPreserved:true};
    });
    await step('Revisão, mapa de gestos e montagem própria',async()=>{
      await cli('gestos',styled);const file=path.join(styled,'edicao/gestos.json'),map=await readJson(file);map.gestures=[{start:.5,end:1.5,speech:'teste',gesture:'observação sintética',action:'apresentar elemento'}];await writeJson(file,map,false);await cli('planejar',styled);assert.ok(await exists(path.join(styled,'trabalho/mapa-gestos.md')));
      await cli('revisao',styled,'--nome','r02','--nota','Validação sintética');assert.equal((await readJson(path.join(styled,'job.json'))).revision,'r02');await rejects(()=>cli('final',styled));
      await fs.mkdir(path.join(legacy,'edicao/remotion-own'));try{await rejects(()=>cli('preparar',legacy));}finally{await fs.rmdir(path.join(legacy,'edicao/remotion-own'));}
      return{gestureTimebase:'original',revision:'r02',customRendererProtected:true};
    });
    await step('Render a 60 fps com cortes descontínuos',async()=>{
      const jobFile=path.join(legacy,'job.json'),cutsFile=path.join(legacy,'edicao/cortes.json'),sceneFile=path.join(legacy,'edicao/cenas.json');
      await writeJson(jobFile,{...await readJson(jobFile),fps:60},false);
      await writeJson(cutsFile,{version:1,sourceDuration:6,segments:[{start:0,end:2},{start:3,end:6}]},false);
      const scenes=await readJson(sceneFile);scenes.scenes[2].end=5;await writeJson(sceneFile,scenes,false);
      await cli('planejar',legacy);await cli('previa',legacy);
      const preview=await readJson(path.join(legacy,'trabalho/ultima-previa.json')),file=path.join(legacy,preview.output),media=await probe(file);
      assert.equal(media.video.r_frame_rate,'60/1');assert.ok(Math.abs(media.duration-5)<.05);assert.ok(media.audio);
      report.artifacts.cut60Preview=path.relative(base,file);return{fps:60,seconds:media.duration,segments:2,audio:true};
    });
    await step('Studio: sincronização, JSON inválido e travas curtas',async()=>{
      const socket=net.createServer();await new Promise<void>((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.1',resolve);});const port=(socket.address() as net.AddressInfo).port;await new Promise<void>(resolve=>socket.close(()=>resolve()));
      const log=await fs.open(path.join(logDir,'studio.log'),'w'),child=spawn(process.execPath,['--import',path.join(ROOT,'node_modules/tsx/dist/loader.mjs'),path.join(ROOT,'scripts/cli.ts'),'studio',styled,'--porta',String(port),'--no-open'],{cwd:ROOT,stdio:['ignore',log.fd,log.fd]});
      const exit=once(child,'exit'),stateFile=path.join(styled,'trabalho/studio-estado.json'),sceneFile=path.join(styled,'edicao/cenas.json'),original=await fs.readFile(sceneFile);
      try{
        await waitFor(async()=>(await readJson(stateFile)).status==='atual');await waitFor(async()=>{const s=net.createConnection({host:'127.0.0.1',port});return await new Promise<boolean>(resolve=>{s.once('connect',()=>{s.destroy();resolve(true);});s.once('error',()=>resolve(false));});});
        assert.equal(await exists(path.join(styled,'.cinema-edicao.lock')),false);await cli('validar',styled);
        const before=await fs.readFile(path.join(styled,'trabalho/render-props.json'));
        await fs.writeFile(sceneFile,'{');await waitFor(async()=>(await readJson(stateFile)).status==='desatualizado');assert.deepEqual(await fs.readFile(path.join(styled,'trabalho/render-props.json')),before);
        const edited=JSON.parse(original.toString());edited.scenes[0].title+=' sincronizado';await writeJson(sceneFile,edited,false);
        await waitFor(async()=>(await readJson(stateFile)).status==='atual'&&(await readJson(path.join(styled,'trabalho/render-props.json'))).scenes[0].title.endsWith('sincronizado'));
        await rejects(()=>cli('studio',styled,'--porta',String(port+1),'--no-open'));
      }finally{
        child.kill('SIGTERM');let timeout:ReturnType<typeof setTimeout>|undefined;
        try{await Promise.race([exit,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Studio não encerrou.')),15000);})]);}finally{if(timeout)clearTimeout(timeout);await log.close();await fs.writeFile(sceneFile,original);}
      }
      assert.equal(await exists(path.join(styled,'.cinema-studio.lock')),false);return{lastValidPropsPreserved:true,concurrentEditAllowed:true,duplicateStudioBlocked:true,serverStopped:true};
    });
    if(process.platform==='darwin')await step('Transcrição local de fala sintética em CPU',async()=>{
      const dir=path.join(base,'fala');await cli('iniciar',dir);
      const audio=path.join(dir,'trabalho/fala.aiff');await run('/usr/bin/say',['-v','Luciana','-o',audio,'Esta é uma demonstração. A fala continua organizada e os cortes preservam a mensagem.'],{quiet:true});
      await run('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=white:s=720x1280:r=30','-i',audio,'-c:v','libx264','-preset','ultrafast','-c:a','aac','-shortest',path.join(dir,'entrada/video.mp4')],{quiet:true});
      const before=await hashFile(path.join(dir,'entrada/video.mp4'));await cli('transcrever',dir,'--cpu');const t=await readJson(path.join(dir,'trabalho/transcricao-original.json'));assert.ok(t.words.length>=8);assert.equal(t.sourceSha256,before);assert.equal(await hashFile(path.join(dir,'entrada/video.mp4')),before);return{language:t.language,words:t.words.length,paidCalls:0};
    });
    report.result='passed';
  }catch(error){report.result='failed';report.error=error instanceof Error?error.message:String(error);process.exitCode=1;}
  await writeJson(path.join(base,'report.json'),report,false);console.log(JSON.stringify({result:report.result,checks:report.checks.length,report:path.join(base,'report.json'),error:report.error},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
