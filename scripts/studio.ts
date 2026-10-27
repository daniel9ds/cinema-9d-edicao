import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {ROOT,inside,readJson,writeJson} from './core.ts';
import {JobSchema,ScenesSchema,BrandSchema} from '../src/schema.ts';

// O Studio tem uma trava própria. A trava de edição só dura a sincronização.
export async function openStudio(dir:string,port:string,acquire:(action:()=>Promise<void>)=>Promise<void>,stage:()=>Promise<{fingerprint:string;publicDir:string}>){
  if(!/^\d{4,5}$/.test(port)||Number(port)>65535)throw Error('Porta inválida.');
  const lockFile=await inside(dir,'.cinema-studio.lock');
  const lock=await fs.open(lockFile,'wx').catch(()=>{throw Error('Já existe um Studio deste trabalho. Confira .cinema-studio.lock e seu PID antes de remover uma trava abandonada.');});
  let timer:ReturnType<typeof setInterval>|undefined,pending:Promise<void>|undefined,stopped=false;
  const stateFile=await inside(dir,'trabalho/studio-estado.json');
  async function signature(){
    const job=JobSchema.parse(await readJson(await inside(dir,'job.json')));
    const scenes=ScenesSchema.parse(await readJson(await inside(dir,'edicao/cenas.json')));
    const brand=BrandSchema.parse(await readJson(await inside(dir,'marca/identidade.json')));
    const files=['job.json','edicao/cenas.json','edicao/cortes.json','edicao/gestos.json','marca/identidade.json','trabalho/transcricao-original.json',job.video,job.music,brand.logo,brand.fontFile,...scenes.scenes.flatMap(s=>[s.image,s.sound,...(s.elements??[]).map(e=>e.image)])].filter((s):s is string=>!!s);
    const stats=[];for(const file of new Set(files)){const s=await fs.stat(await inside(dir,file)).catch(()=>null);stats.push([file,s?.mtimeMs,s?.size]);}
    return JSON.stringify(stats);
  }
  try{
    await lock.writeFile(JSON.stringify({pid:process.pid,port,at:new Date().toISOString()}));
    let state!:Awaited<ReturnType<typeof stage>>,last='';
    await acquire(async()=>{state=await stage();last=await signature();});
    await writeJson(stateFile,{status:'atual',fingerprint:state.fingerprint,at:new Date().toISOString(),port},false);
    let lastError='';
    const sync=async()=>{
      try{
        const next=await signature();if(next===last)return;
        await acquire(async()=>{
          const before=await signature();const nextState=await stage();const after=await signature();
          if(before!==after)throw Error('Arquivos mudaram durante a sincronização; aguardando estabilizar.');
          state=nextState;last=after;
          await writeJson(stateFile,{status:'atual',fingerprint:state.fingerprint,at:new Date().toISOString(),port},false);
          console.log(`Studio atualizado: ${state.fingerprint.slice(0,12)}`);
        });lastError='';
      }catch(error){
        const message=error instanceof Error?error.message:String(error);
        if(message!==lastError){console.error('Studio mantém a última versão válida: '+message);lastError=message;}
        await writeJson(stateFile,{status:'desatualizado',reason:message,at:new Date().toISOString(),port},false);
      }
    };
    timer=setInterval(()=>{if(!stopped&&!pending)pending=sync().finally(()=>{pending=undefined;});},1500);
    console.log(`Studio: http://localhost:${port}/Cinema9DEdicao — sincronização de dados a cada 1,5s. Confira trabalho/studio-estado.json.`);
    await new Promise<void>((resolve,reject)=>{
      const child=spawn(process.execPath,[path.join(ROOT,'node_modules/@remotion/cli/remotion-cli.js'),'studio',path.join(ROOT,'src/index.ts'),'--public-dir',state.publicDir,'--props',path.join(dir,'trabalho/render-props.json'),'--port',port],{cwd:ROOT,stdio:'inherit'});
      const stop=()=>{stopped=true;child.kill('SIGTERM');};
      const cleanup=()=>{process.off('SIGINT',stop);process.off('SIGTERM',stop);};
      process.on('SIGINT',stop);process.on('SIGTERM',stop);
      child.on('error',e=>{cleanup();reject(e);});child.on('exit',code=>{cleanup();code===0||stopped?resolve():reject(Error(`Studio encerrou com código ${code}.`));});
    });
  }finally{
    stopped=true;if(timer)clearInterval(timer);await pending;await lock.close();await fs.rm(lockFile,{force:true});
  }
}
