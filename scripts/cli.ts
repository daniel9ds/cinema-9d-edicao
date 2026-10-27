import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {JobSchema, BrandSchema, CutsSchema, ScenesSchema, TranscriptSchema, GestureMapSchema, type RenderProps} from '../src/schema.ts';
import {ROOT,readJson,writeJson,inside,exists,run,probe,hashFile,detectSilences,cutsFromSilences,remapWords,durationOf,draftScenes,whisperWords} from './core.ts';
import {assertCentral,customProjects,revision,learn} from './projects.ts';
import {openStudio} from './studio.ts';

const HELP=`Cinema 9D Edição — método central, trabalhos em qualquer pasta

cinema-edicao iniciar "/pasta/do/trabalho" [--nome "Nome"] [--tema "Tema"] [--video "/origem/take.mp4"]
cinema-edicao preparar "/pasta/do/trabalho"   # analisar + transcrever localmente + propor cortes/cenas
cinema-edicao analisar|transcrever|cortes|planejar "/pasta/do/trabalho"
cinema-edicao validar|previa|studio|aprovar|final|status "/pasta/do/trabalho"
cinema-edicao aprovar "/pasta/do/trabalho" --por "Nome de quem aprovou"
cinema-edicao gestos|sincronizar "/pasta/do/trabalho"
cinema-edicao revisao "/pasta/do/trabalho" --nome r02 [--nota "Motivo"]
cinema-edicao aprender "/pasta/do/trabalho" --titulo "Título" --observacao "Ocorrido" --proposta "Melhoria" [--evidencia "Arquivo/trecho"]
cinema-edicao demo "/pasta/nova"           # vídeo sintético de demonstração
cinema-edicao doctor

Opções: --inteiro em cortes mantém o take completo; --refazer em transcrever;
--cpu evita Metal em transcrever; --porta 3000 em studio; --quadros em previa gera só stills.
Os tempos em cortes.json são da gravação ORIGINAL; os de cenas.json são da edição.
O agente deve revisar o rascunho de cenas e receber seu OK antes de registrar aprovar/final.
`;
function parse(argv:string[]){
  const positional:string[]=[], flags:Record<string,string|boolean>={};
  for(let i=0;i<argv.length;i++){
    if(argv[i].startsWith('--')){const key=argv[i].slice(2);flags[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}
    else positional.push(argv[i]);
  }
  return {command:positional[0]??'help',folder:positional[1],flags};
}
async function load(folder:string){
  const dir=await fs.realpath(path.resolve(folder));
  return {dir,job:JobSchema.parse(await readJson(path.join(dir,'job.json')))};
}
async function source(dir:string,job:ReturnType<typeof JobSchema.parse>){return await inside(dir,job.video);}
async function acquire(dir:string,action:()=>Promise<void>){
  const file=path.join(dir,'.cinema-edicao.lock');
  const lock=await fs.open(file,'wx').catch(()=>{throw Error('Já existe uma operação neste trabalho. Confira o processo e o arquivo .cinema-edicao.lock.');});
  await lock.writeFile(JSON.stringify({pid:process.pid,at:new Date().toISOString()}));
  try{await action();}finally{await lock.close();await fs.rm(file,{force:true});}
}
async function init(folder:string,flags:Record<string,string|boolean>){
  const dir=path.resolve(folder);await fs.mkdir(dir,{recursive:true});
  const target=await inside(dir,'job.json');
  if(await exists(target))throw Error('O trabalho já existe; os arquivos foram preservados.');
  const folders=['entrada','marca','elementos','referencias/frames','interface','roteiro','edicao','trabalho','aprendizados','saida/previas','saida/final'];
  for(const f of folders)await fs.mkdir(await inside(dir,f),{recursive:true});
  if(await exists(path.join(ROOT,'.runtime/sfx'))){
    const soundDir=await inside(dir,'elementos/sons');await fs.mkdir(soundDir,{recursive:true});
    for(const name of ['click','whoosh','impact']){
      const file=await inside(dir,`elementos/sons/${name}.wav`);
      if(!await exists(file))await fs.copyFile(path.join(ROOT,'.runtime/sfx',name+'.wav'),file,constants.COPYFILE_EXCL);
    }
  }
  const job=JobSchema.parse({version:1,name:typeof flags.nome==='string'?flags.nome:path.basename(dir),theme:typeof flags.tema==='string'?flags.tema:undefined});
  if(typeof flags.video==='string'){
    const input=await fs.realpath(path.resolve(flags.video));
    const media=await probe(input);if(!media.video)throw Error('A origem precisa conter vídeo.');
    const relative=path.relative(await fs.realpath(dir),input);
    if(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative))job.video=relative;
    else{
      job.video='entrada/take'+(path.extname(input).toLowerCase()||'.mp4');
      await fs.copyFile(input,await inside(dir,job.video),constants.COPYFILE_EXCL|constants.COPYFILE_FICLONE);
    }
  }
  await writeJson(target,job,false);
  const brandFile=await inside(dir,'marca/identidade.json');
  if(!await exists(brandFile))await writeJson(brandFile,BrandSchema.parse({name:'Sua marca'}),false);
  const briefing=await inside(dir,'roteiro/briefing.md');
  if(!await exists(briefing))await fs.copyFile(path.join(ROOT,'docs/briefing-modelo.md'),briefing);
  const instructions=`# Trabalho ${job.name}\n\nUse o método em ${ROOT}. Leia primeiro ${ROOT}/AGENTS.md e ${ROOT}/skills/cinema-9d-edicao/SKILL.md.\n\nTema: ${job.theme??'definir em roteiro/briefing.md'}. Materiais em entrada/, marca/, interface/, elementos/, referencias/ e roteiro/. Não altere os originais. Não use APIs pagas sem aprovação explícita.\n\nLeia job.json e o documento de continuidade atual antes de editar. Se houver montagem própria em edicao/remotion-*, use os scripts dela; não execute a montagem histórica da raiz.\n\nComando da base: ${ROOT}/bin/cinema-edicao preparar "${dir}"\n\nRegistre observações de uso em aprendizados/; propostas locais não atualizam o método automaticamente. Leia ${ROOT}/docs/novos-projetos.md para iniciar e evoluir trabalhos.\n`;
  for(const file of ['AGENTS.md','CLAUDE.md'])if(!await exists(await inside(dir,file)))await fs.writeFile(await inside(dir,file),instructions);
  const learningFile=await inside(dir,'aprendizados/LEIA-ME.md');
  if(!await exists(learningFile))await fs.copyFile(path.join(ROOT,'docs/aprendizados-modelo.md'),learningFile);
  console.log(`Trabalho criado: ${dir}\nVídeo esperado: ${job.video}\nPreencha roteiro/briefing.md e marca/identidade.json.`);
}
async function analyze(dir:string,job:ReturnType<typeof JobSchema.parse>){
  const input=await source(dir,job),media=await probe(input);
  if(!media.video||!media.audio)throw Error('O take deve conter uma faixa de vídeo e uma de áudio.');
  const sha=await hashFile(input);
  await writeJson(await inside(dir,'trabalho/analise.json'),{...media,sourceSha256:sha,at:new Date().toISOString()});
  const frames=await inside(dir,'trabalho/frames');await fs.mkdir(frames,{recursive:true});
  // Arquivos com nome fixo são regenerados; nenhum arquivo da entrada é alterado.
  for(let i=0;i<6;i++){
    const time=Math.max(0,Math.min(media.duration-.05,media.duration*i/6));
    await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',time.toFixed(3),'-i',input,'-frames:v','1','-vf','scale=480:-2',path.join(frames,`take-${i+1}.jpg`)],{quiet:true});
  }
  console.log(`Analisado: ${media.duration.toFixed(2)}s, ${media.video.width}×${media.video.height}; 6 quadros em trabalho/frames/.`);
  return media;
}
async function transcribe(dir:string,job:ReturnType<typeof JobSchema.parse>,flags:Record<string,string|boolean>){
  const input=await source(dir,job),sha=await hashFile(input),file=await inside(dir,'trabalho/transcricao-original.json');
  const previous=await exists(file)?TranscriptSchema.parse(await readJson(file)):null;
  if(previous?.sourceSha256===sha&&!flags.refazer){console.log('Transcrição local existente reutilizada.');return;}
  const config=await readJson(path.join(ROOT,'.runtime/machine.json')).catch(()=>{throw Error('Execute npm run setup na pasta central.');});
  if(!await exists(config.whisperModel))throw Error('Modelo Whisper ausente; execute npm run setup.');
  const audio=await inside(dir,'trabalho/audio-16k.wav');
  const media=await probe(input),channels=Number(media.audio?.channels??1);
  const mono=channels===2?'pan=mono|c0=0.5*c0+0.5*c1,volume=-2dB':'volume=-2dB';
  await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',input,'-vn','-af',mono,'-ar','16000','-ac','1','-c:a','pcm_s16le',audio],{quiet:true});
  const output=await inside(dir,'trabalho/whisper');
  const prompt=await fs.readFile(await inside(dir,'roteiro/fala.txt'),'utf8').catch(()=>'');
  const args=['-m',config.whisperModel,'-f',audio,'-l',job.language,'-ojf','-of',output,'-ml','1','-sow','-t','4'];
  if(prompt.trim())args.push('--prompt',prompt.trim().slice(0,1800));
  if(flags.cpu)args.push('-ng');
  console.log('Transcrevendo localmente com Whisper.cpp; nenhum áudio é enviado para APIs.');
  await run(config.whisperBinary??'whisper-cli',args,{quiet:true,logFile:await inside(dir,'trabalho/whisper.log')});
  const words=whisperWords(await readJson(output+'.json'));
  const transcript=TranscriptSchema.parse({version:1,language:job.language,sourceSha256:sha,model:path.basename(config.whisperModel),words,timing:'whisper-word'});
  await writeJson(file,transcript);
  await fs.writeFile(await inside(dir,'trabalho/transcricao-original.txt'),words.map(w=>`[${w.start.toFixed(2)}–${w.end.toFixed(2)}] ${w.text}`).join('\n')+'\n');
  console.log(`${words.length} palavras transcritas. Revise nomes, números e sincronização.`);
}
async function proposeCuts(dir:string,job:ReturnType<typeof JobSchema.parse>,whole=false){
  const input=await source(dir,job),media=await probe(input),file=await inside(dir,'edicao/cortes.json');
  if(await exists(file))throw Error('cortes.json já existe. Edite-o; para refazer, mova o arquivo para uma revisão.');
  let cuts:ReturnType<typeof CutsSchema.parse>;
  if(whole)cuts={version:1,sourceDuration:media.duration,segments:[{start:0,end:media.duration}],note:'Take completo.'};
  else{
    const {stderr}=await run('ffmpeg',['-hide_banner','-i',input,'-vn','-af',`silencedetect=noise=${job.silence.thresholdDb}dB:d=${job.silence.minimumSeconds}`,'-f','null','-'],{quiet:true});
    cuts=cutsFromSilences(media.duration,detectSilences(stderr,media.duration),job.silence.paddingSeconds);
  }
  await writeJson(file,CutsSchema.parse(cuts));
  await writeJson(await inside(dir,'trabalho/cortes-origem.json'),{sourceSha256:await hashFile(input)});
  console.log(`Proposta: ${cuts.segments.length} trechos; ${media.duration.toFixed(1)}s → ${durationOf(cuts).toFixed(1)}s. Revise os cortes antes de aprovar.`);
}
async function mapped(dir:string){
  const cuts=CutsSchema.parse(await readJson(await inside(dir,'edicao/cortes.json')));
  const transcript=TranscriptSchema.parse(await readJson(await inside(dir,'trabalho/transcricao-original.json')));
  const words=remapWords(transcript.words,cuts);
  if(!words.length)throw Error('Nenhuma palavra permaneceu nos cortes.');
  await writeJson(await inside(dir,'trabalho/transcricao-editada.json'),{...transcript,words},false);
  return {cuts,transcript,words,duration:durationOf(cuts)};
}
async function plan(dir:string){
  const {words,duration}=await mapped(dir),file=await inside(dir,'edicao/cenas.json');
  if(!await exists(file))await writeJson(file,draftScenes(words,duration));
  const scenes=ScenesSchema.parse(await readJson(file));
  const rows=scenes.scenes.map(s=>{
    const speech=words.filter(w=>w.start>=s.start&&w.start<s.end).map(w=>w.text).join(' ');
    return `| ${s.start.toFixed(2)}–${s.end.toFixed(2)} | ${speech.replaceAll('|','/')} | ${s.type}: ${s.title.replaceAll('|','/')} | ${s.layout} |`;
  });
  await fs.writeFile(await inside(dir,'trabalho/plano-cenas.md'),`# Plano de cenas — ${scenes.status}\n\nRascunho automático por blocos de fala. O agente deve ler o briefing, olhar os frames e criar visuais que expliquem cada ideia.\n\nTempos abaixo são da edição, após os cortes.\n\n| Tempo | Fala | Visual | Rosto |\n|---|---|---|---|\n${rows.join('\n')}\n`);
  const gestureFile=await inside(dir,'edicao/gestos.json');
  if(await exists(gestureFile)){
    const map=GestureMapSchema.parse(await readJson(gestureFile)),{cuts,transcript}=await mapped(dir);
    if(map.sourceSha256!==transcript.sourceSha256)throw Error('Mapa de gestos pertence a outra gravação. Revise antes de remapear.');
    const rows:string[]=[];let offset=0;
    const cell=(s:string)=>s.replaceAll('|','/').replaceAll('\n',' ');
    for(const cut of cuts.segments){for(const g of map.gestures){const a=Math.max(cut.start,g.start),b=Math.min(cut.end,g.end);if(b>a)rows.push(`| ${a.toFixed(2)}–${b.toFixed(2)} | ${(offset+a-cut.start).toFixed(2)}–${(offset+b-cut.start).toFixed(2)} | ${cell(g.speech)} | ${cell(g.gesture)} | ${cell(g.action)} |`);}offset+=cut.end-cut.start;}
    await fs.writeFile(await inside(dir,'trabalho/mapa-gestos.md'),`# Gestos observados\n\nNão gera rastreamento. Se um gesto atravessar um corte, confira a continuidade.\n\n| Original | Edição | Fala | Gesto | Ação visual |\n|---|---|---|---|---|\n${rows.join('\n')}\n`);
  }
  console.log('Plano em trabalho/plano-cenas.md; cenas editáveis em edicao/cenas.json.');
}
async function validate(dir:string,job:ReturnType<typeof JobSchema.parse>){
  const {cuts,transcript,words,duration}=await mapped(dir);
  const brand=BrandSchema.parse(await readJson(await inside(dir,'marca/identidade.json')));
  const scenes=ScenesSchema.parse(await readJson(await inside(dir,'edicao/cenas.json')));
  const input=await source(dir,job),sha=await hashFile(input),media=await probe(input);
  if(sha!==transcript.sourceSha256)throw Error('Vídeo mudou desde a transcrição. Execute analisar/transcrever novamente.');
  const origin=await readJson(await inside(dir,'trabalho/cortes-origem.json'));
  if(origin.sourceSha256!==sha)throw Error('Vídeo mudou desde a proposta de cortes. Revise e refaça os cortes.');
  if(Math.abs(media.duration-cuts.sourceDuration)>.08)throw Error('Duração dos cortes não corresponde ao vídeo.');
  for(const w of transcript.words)if(w.end>media.duration+.1)throw Error('Palavra fora da duração do vídeo original.');
  for(const s of scenes.scenes)if(s.end>duration+1/job.fps)throw Error(`Cena ${s.id} ultrapassa o fim da edição.`);
  if(scenes.scenes[0].start>.04||scenes.scenes.at(-1)!.end<duration-.15)throw Error('As cenas devem cobrir o início e o fim do vídeo.');
  for(let i=1;i<scenes.scenes.length;i++)if(scenes.scenes[i].start-scenes.scenes[i-1].end>1/job.fps)throw Error('Existe um intervalo sem cena.');
  const assets=[job.video,job.music,brand.logo,brand.fontFile,...scenes.scenes.flatMap(s=>[s.image,s.sound,...(s.elements??[]).map(e=>e.image)])].filter((x):x is string=>!!x);
  const files:Record<string,string>={};
  for(const asset of new Set(assets)){const file=await inside(dir,asset);files[asset]=await hashFile(file);}
  let gestures=null;const gestureFile=await inside(dir,'edicao/gestos.json');
  if(await exists(gestureFile)){
    gestures=GestureMapSchema.parse(await readJson(gestureFile));
    if(gestures.sourceSha256!==sha||gestures.gestures.some(g=>g.end>media.duration))throw Error('Mapa de gestos incompatível com a gravação.');
  }
  const props:RenderProps={job,brand,cuts,scenes:scenes.scenes,words,assetHashes:files};
  const method:Record<string,string>={};
  for(const file of ['src/index.ts','src/Root.tsx','src/Video.tsx','src/MotionElements.tsx','src/assets.ts','src/schema.ts','scripts/cli.ts','scripts/core.ts','scripts/projects.ts','scripts/studio.ts','package-lock.json'])method[file]=await hashFile(path.join(ROOT,file));
  const fingerprint=createHash('sha256').update(JSON.stringify({props,files,method,gestures})).digest('hex');
  return {props,scenes,duration,files,fingerprint};
}
async function staged(dir:string,job:ReturnType<typeof JobSchema.parse>){
  const checked=await validate(dir,job), publicDir=await inside(dir,'trabalho/remotion/public');
  await fs.mkdir(publicDir,{recursive:true});
  const index=await inside(dir,'trabalho/remotion/assets.json');
  for(const [asset,sha] of Object.entries(checked.files)){
    const destination=await inside(publicDir,`versions/${sha}/${asset}`);await fs.mkdir(path.dirname(destination),{recursive:true});
    if(!await exists(destination)){
      const temporary=destination+`.${process.pid}.tmp`;
      await fs.copyFile(await inside(dir,asset),temporary,constants.COPYFILE_FICLONE);
      if(await hashFile(temporary)!==sha){await fs.rm(temporary,{force:true});throw Error('Asset mudou durante a cópia; tente sincronizar novamente: '+asset);}
      await fs.rename(temporary,destination);
    }
  }
  // Versões anteriores ficam no cache para manter a última prévia válida durante a atualização.
  await writeJson(index,checked.files,false);
  await writeJson(await inside(dir,'trabalho/render-props.json'),checked.props,false);
  return {...checked,publicDir};
}
async function render(dir:string,job:ReturnType<typeof JobSchema.parse>,final:boolean,stillsOnly=false){
  const state=await staged(dir,job);
  if(final){
    const approval=await readJson(await inside(dir,'edicao/aprovacao.json')).catch(()=>null);
    if(state.scenes.status!=='reviewed'||approval?.fingerprint!==state.fingerprint)throw Error('Edição sem aprovação atual. Revise a prévia e registre aprovar --por "Nome" após o OK do usuário.');
  }
  const {bundle}=await import('@remotion/bundler');
  const {selectComposition,renderMedia,renderStill}=await import('@remotion/renderer');
  const serveUrl=await bundle({entryPoint:path.join(ROOT,'src/index.ts'),publicDir:state.publicDir,outDir:await inside(dir,'trabalho/remotion/bundle'),enableCaching:true});
  const composition=await selectComposition({serveUrl,id:'Cinema9DEdicao',inputProps:state.props});
  const stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
  const outputDir=await inside(dir,final?'saida/final':'saida/previas');
  for(const ratio of [0,.35,.7]){
    const frame=Math.min(composition.durationInFrames-1,Math.round(composition.durationInFrames*ratio));
    await renderStill({composition,serveUrl,inputProps:state.props,output:path.join(outputDir,`${stamp}-quadro-${frame}.png`),frame,scale:.5});
  }
  if(stillsOnly){console.log('Quadros de revisão gerados em '+outputDir);return;}
  const raw=await inside(dir,`trabalho/remotion/${stamp}-raw.mp4`);
  let last=-1;
  await renderMedia({composition,serveUrl,inputProps:state.props,codec:'h264',audioCodec:'aac',pixelFormat:'yuv420p',outputLocation:raw,scale:final?1:.5,crf:final?18:26,concurrency:2,onProgress:({progress})=>{const pct=Math.floor(progress*10)*10;if(pct>last){last=pct;console.log(`Render: ${pct}%`);}}});
  const output=path.join(outputDir,`${stamp}-${final?'final':'previa'}.mp4`);
  const expected=Math.round(state.duration*job.fps)/job.fps;
  await run('ffmpeg',['-hide_banner','-loglevel','error','-n','-i',raw,'-t',String(expected),'-map_metadata','-1','-c:v','copy','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-c:a','aac','-b:a','192k','-movflags','+faststart',output],{quiet:true});
  const qc=await probe(output);
  if(Math.abs(qc.duration-expected)>.15||!qc.audio||qc.video.width!==(final?1080:540))throw Error('A exportação não passou na checagem de duração/áudio/dimensões.');
  const stats=await run('ffmpeg',['-hide_banner','-i',output,'-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','-'],{quiet:true});
  const meter=stats.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0];
  await writeJson(output+'.json',{fingerprint:state.fingerprint,at:new Date().toISOString(),final,expectedSeconds:expected,media:qc,loudness:meter?JSON.parse(meter):null},false);
  if(!final)await writeJson(await inside(dir,'trabalho/ultima-previa.json'),{fingerprint:state.fingerprint,revision:job.revision,output:path.relative(dir,output),at:new Date().toISOString()},false);
  await fs.rm(raw,{force:true});
  console.log(`Exportado e verificado: ${output}`);
}
async function doctor(){
  const results:Record<string,unknown>={node:process.version,root:ROOT};let fail=false;
  for(const [name,args] of [['ffmpeg',['-version']],['ffprobe',['-version']],['whisper-cli',['--help']],['git',['--version']]] as [string,string[]][]){
    try{await run(name,args,{quiet:true});results[name]='ok';}catch{results[name]='ausente';fail=true;}
  }
  const machine=await readJson(path.join(ROOT,'.runtime/machine.json')).catch(()=>null);
  results.whisperModel=machine&&await exists(machine.whisperModel)?machine.whisperModel:'ausente';
  if(results.whisperModel==='ausente')fail=true;
  for(const module of ['remotion','@remotion/bundler','@remotion/renderer'])try{await import(module);results[module]='ok';}catch{results[module]='ausente';fail=true;}
  if(machine?.browserExecutable&&await exists(machine.browserExecutable))results.browser='ok';else{results.browser='execute setup';fail=true;}
  console.log(JSON.stringify(results,null,2));if(fail)process.exitCode=1;
}
async function demo(folder:string){
  const dir=path.resolve(folder);
  if(await exists(dir)&&(await fs.readdir(dir)).length)throw Error('A demonstração precisa de uma pasta nova ou vazia.');
  await init(dir,{nome:'Demonstração sintética 9D'});
  const input=await inside(dir,'entrada/video.mp4');
  await run('ffmpeg',['-hide_banner','-loglevel','error','-n','-f','lavfi','-i','testsrc2=size=720x1280:rate=30:duration=6','-f','lavfi','-i','sine=frequency=220:sample_rate=48000:duration=6','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-shortest',input],{quiet:true});
  const sha=await hashFile(input);
  await writeJson(await inside(dir,'trabalho/transcricao-original.json'),{version:1,language:'pt',model:'DEMO-synthetic',sourceSha256:sha,timing:'estimated',words:['Sua','fala','vira','uma','história','visual'].map((text,i)=>({text,start:i,end:i+.8}))});
  const {job}=await load(dir);await analyze(dir,job);await proposeCuts(dir,job,true);await plan(dir);
  await writeJson(await inside(dir,'edicao/cenas.json'),{version:1,status:'draft',scenes:[
    {id:'demo-1',start:0,end:2,type:'headline',title:'Da sua fala ao motion',subtitle:'Demonstração técnica • mídia sintética',layout:'card',emphasis:['fala'],zoom:1,illustration:true},
    {id:'demo-2',start:2,end:4,type:'bullets',title:'Um método reutilizável',items:['Sua gravação','Sua marca','Seu ritmo'],layout:'card',zoom:1.04,illustration:true},
    {id:'demo-3',start:4,end:6,type:'comparison',title:'Você conduz a edição',items:['Grave a fala','Revise a prévia'],layout:'full',illustration:true},
  ]});
  console.log('Demonstração criada. O vídeo e as legendas são sintéticos; não validam a qualidade da transcrição.');
}
async function main(){
  const {command,folder,flags}=parse(process.argv.slice(2));
  if(['help','ajuda','--help'].includes(command)){console.log(HELP);return;}
  if(command==='doctor'){await doctor();return;}
  if(!folder)throw Error('Informe a pasta do trabalho. Use ajuda para ver exemplos.');
  if(command==='iniciar'){await init(folder,flags);return;}
  if(command==='demo'){await demo(folder);return;}
  const {dir,job}=await load(folder);
  if(command==='studio'){
    await assertCentral(dir,job);
    await openStudio(dir,String(flags.porta??3000),action=>acquire(dir,action),async()=>{const current=await load(dir);await assertCentral(dir,current.job);return staged(dir,current.job);});return;
  }
  await acquire(dir,async()=>{
    if(!['status','aprender'].includes(command))await assertCentral(dir,job);
    if(command==='analisar')await analyze(dir,job);
    else if(command==='aprender')await learn(dir,flags);
    else if(command==='revisao')await revision(dir,job,flags.nome,flags.nota);
    else if(command==='sincronizar'){const state=await staged(dir,job);console.log(`Dados sincronizados: ${job.name} / ${job.revision} / ${state.fingerprint.slice(0,12)}`);}
    else if(command==='gestos'){
      const file=await inside(dir,'edicao/gestos.json');if(await exists(file))throw Error('Mapa já existe; edite-o após observar a gravação.');
      await writeJson(file,{version:1,sourceSha256:await hashFile(await source(dir,job)),timebase:'original',gestures:[]},false);
      console.log('Mapa criado em edicao/gestos.json. Preencha com gestos observados; planejar gera trabalho/mapa-gestos.md.');
    }
    else if(command==='transcrever')await transcribe(dir,job,flags);
    else if(command==='cortes')await proposeCuts(dir,job,!!flags.inteiro);
    else if(command==='planejar')await plan(dir);
    else if(command==='preparar'){
      await analyze(dir,job);await transcribe(dir,job,flags);
      if(!await exists(await inside(dir,'edicao/cortes.json')))await proposeCuts(dir,job);
      await plan(dir);
    }
    else if(command==='validar'){const state=await validate(dir,job);console.log(`Estrutura válida: ${state.duration.toFixed(2)}s; ${state.props.words.length} palavras; ${state.props.scenes.length} cenas; ${state.fingerprint.slice(0,12)}.`);}
    else if(command==='previa'||command==='final')await render(dir,job,command==='final',!!flags.quadros);
    else if(command==='aprovar'){
      if(typeof flags.por!=='string')throw Error('Use --por "Nome" após o usuário aprovar a prévia.');
      const state=await validate(dir,job);
      if(state.scenes.status!=='reviewed')throw Error('O agente precisa revisar o plano e mudar cenas.json status para reviewed antes da aprovação.');
      const preview=await readJson(await inside(dir,'trabalho/ultima-previa.json')).catch(()=>null);
      if(preview?.fingerprint!==state.fingerprint||!await exists(await inside(dir,preview.output)))throw Error('Gere e revise uma prévia MP4 da revisão atual antes de registrar aprovação.');
      await writeJson(await inside(dir,'edicao/aprovacao.json'),{fingerprint:state.fingerprint,by:flags.por,at:new Date().toISOString()});
      console.log('Aprovação registrada para esta revisão. Alterações invalidam a aprovação.');
    }
    else if(command==='status'){
      console.log(`Trabalho: ${job.name}\nTema: ${job.theme??'briefing'}\nRevisão da base: ${job.revision}`);
      const custom=await customProjects(dir);
      if(job.rendering||custom.length){console.log(`Montagem própria: ${job.rendering?.project??custom.join(', ')}. Leia AGENTS.md e o documento atual; o status da raiz pode ser histórico.`);return;}
      const names=['trabalho/analise.json','trabalho/transcricao-original.json','edicao/cortes.json','edicao/cenas.json','edicao/aprovacao.json'];
      for(const name of names)console.log(`${await exists(await inside(dir,name))?'✓':'○'} ${name}`);
      if(await exists(await inside(dir,'edicao/cenas.json'))){const state=await validate(dir,job);const approval=await readJson(await inside(dir,'edicao/aprovacao.json')).catch(()=>null);console.log(`Aprovação atual: ${approval?.fingerprint===state.fingerprint?'sim':'não'}`);}
    }
    else throw Error('Comando desconhecido: '+command+'\n'+HELP);
  });
}
if(import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error('\nErro:',error.message);process.exitCode=1;});
