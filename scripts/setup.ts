import fs from 'node:fs/promises';
import path from 'node:path';
import {createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {ensureBrowser} from '@remotion/renderer';
import {ROOT,exists,run,writeJson,hashFile} from './core.ts';

async function main(){
  for(const [command,args] of [['ffmpeg',['-version']],['ffprobe',['-version']],['whisper-cli',['--help']]] as [string,string[]][])await run(command,args,{quiet:true});
  const modelDir=path.join(ROOT,'.runtime/models');await fs.mkdir(modelDir,{recursive:true});
  const model=path.join(modelDir,'ggml-small.bin');
  const url='https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin';
  // O ETag LFS é o SHA-256 do modelo; valida o arquivo antes de colocá-lo em uso.
  if(!await exists(model)){
    console.log('Baixando modelo Whisper small multilíngue (~466 MiB); uso local, sem API paga.');
    const headers=await fetch(url,{method:'HEAD',redirect:'manual'});
    const expected=(headers.headers.get('x-linked-etag')??'').replaceAll('"','');
    const response=await fetch(url);if(!response.ok||!response.body)throw Error('Download do modelo falhou: '+response.status);
    const temp=model+'.part';
    let downloaded=0,last=0;const total=Number(response.headers.get('content-length'));
    const body=Readable.fromWeb(response.body as any);
    body.on('data',(chunk:Buffer)=>{downloaded+=chunk.length;if(downloaded-last>50*1024*1024){last=downloaded;console.log(`Modelo: ${Math.round(downloaded/1024/1024)} MiB${total?' / '+Math.round(total/1024/1024):''}`);}});
    await pipeline(body,createWriteStream(temp));
    if((await fs.stat(temp)).size<400_000_000)throw Error('Download do modelo incompleto.');
    const sha=await hashFile(temp);
    if(/^[a-f0-9]{64}$/.test(expected)&&sha!==expected){await fs.rm(temp);throw Error('SHA-256 do modelo não confere.');}
    await fs.rename(temp,model);await writeJson(model+'.json',{url,sha256:sha,verifiedAgainstLfs:/^[a-f0-9]{64}$/.test(expected)},false);
  }
  let browserPath='';
  let lastBrowserProgress=-1;
  const installed=await ensureBrowser({onBrowserDownload:()=>({version:null,onProgress:({percent})=>{const step=Math.floor(percent/25)*25;if(step>lastBrowserProgress){lastBrowserProgress=step;console.log('Navegador de render: '+step+'%');}}})});
  if(!('path' in installed))throw Error('Remotion não encontrou um navegador compatível.');
  const {openBrowser}=await import('@remotion/renderer');
  const browser=await openBrowser('chrome');
  browserPath=installed.path;
  await browser.close({silent:true});
  const whisper=(await run('which',['whisper-cli'],{quiet:true})).stdout.trim();
  const sounds=path.join(ROOT,'.runtime/sfx');await fs.mkdir(sounds,{recursive:true});
  for(const [name,source,filter] of [
    ['click','sine=frequency=1400:sample_rate=48000:duration=0.08','afade=t=out:d=0.08,volume=0.15'],
    ['whoosh','anoisesrc=color=pink:sample_rate=48000:duration=0.3','highpass=f=350,lowpass=f=2400,afade=t=in:d=0.08,afade=t=out:st=0.08:d=0.22,volume=0.08'],
    ['impact','sine=frequency=90:sample_rate=48000:duration=0.25','afade=t=out:d=0.25,volume=0.3'],
  ]){
    const file=path.join(sounds,name+'.wav');
    if(!await exists(file))await run('ffmpeg',['-hide_banner','-loglevel','error','-n','-f','lavfi','-i',source,'-af',filter,file],{quiet:true});
  }
  await writeJson(path.join(ROOT,'.runtime/machine.json'),{node:process.version,whisperBinary:whisper,whisperModel:model,browserExecutable:browserPath,setupAt:new Date().toISOString()},false);
  console.log('Dependências locais configuradas. Execute npm run doctor.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
