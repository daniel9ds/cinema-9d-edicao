import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import type {Cuts,Word} from '../src/schema.ts';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const readJson = async (file:string) => JSON.parse(await fs.readFile(file,'utf8'));
export const exists = async(file:string) => !!await fs.stat(file).catch(()=>null);
export async function hashFile(file:string) {
  const hash=createHash('sha256'); for await(const part of createReadStream(file)) hash.update(part);
  return hash.digest('hex');
}
export async function inside(root:string, file:string) {
  const realRoot = await fs.realpath(root);
  const resolved = path.resolve(realRoot,file);
  if(resolved !== realRoot && !resolved.startsWith(realRoot+path.sep))throw Error('Arquivo fora da pasta do trabalho: '+file);
  // Verifica também links simbólicos nos pais de arquivos que ainda serão criados.
  let current=resolved;
  while(!await exists(current))current=path.dirname(current);
  const real=await fs.realpath(current);
  if(real!==realRoot&&!real.startsWith(realRoot+path.sep))throw Error('Link aponta para fora do trabalho: '+file);
  return resolved;
}
export async function writeJson(file:string, value:unknown, backup=true) {
  await fs.mkdir(path.dirname(file),{recursive:true});
  if(backup && await exists(file)) {
    const archive=path.join(path.dirname(file),'revisoes'); await fs.mkdir(archive,{recursive:true});
    await fs.copyFile(file,path.join(archive,`${path.basename(file)}.${Date.now()}-${Math.random().toString(16).slice(2,8)}.json`));
  }
  const tmp=file+`.${process.pid}.tmp`; await fs.writeFile(tmp,JSON.stringify(value,null,2)+'\n'); await fs.rename(tmp,file);
}
export async function run(command:string,args:string[],options:{cwd?:string;quiet?:boolean;logFile?:string}={}) {
  return await new Promise<{stdout:string;stderr:string}>((resolve,reject)=>{
    const p=spawn(command,args,{cwd:options.cwd??ROOT,stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    p.stdout.on('data',(b)=>{stdout+=b; if(!options.quiet)process.stdout.write(b);});
    p.stderr.on('data',(b)=>{stderr+=b; if(!options.quiet)process.stderr.write(b);});
    p.on('error',reject);
    p.on('close',async code=>{
      if(options.logFile)await fs.writeFile(options.logFile,stdout+'\n'+stderr);
      code===0?resolve({stdout,stderr}):reject(Error(`${command} terminou com código ${code}.\n${stderr.slice(-2500)}`));
    });
  });
}
export async function probe(file:string) {
  const {stdout}=await run('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file],{quiet:true});
  const d=JSON.parse(stdout); const video=d.streams.find((s:any)=>s.codec_type==='video'&&!s.disposition?.attached_pic);
  const audio=d.streams.find((s:any)=>s.codec_type==='audio');
  const duration=Number(d.format.duration);
  if(!Number.isFinite(duration)||duration<=0)throw Error('Duração de mídia inválida.');
  return {duration,video,audio,raw:d};
}
export function detectSilences(stderr:string, duration:number) {
  const silences:{start:number;end:number}[]=[]; let start:number|undefined;
  for(const line of stderr.split('\n')) {
    const a=line.match(/silence_start: ([\d.]+)/), b=line.match(/silence_end: ([\d.]+)/);
    if(a)start=Number(a[1]);
    if(b&&start!==undefined){silences.push({start,end:Number(b[1])});start=undefined;}
  }
  if(start!==undefined)silences.push({start,end:duration});
  return silences;
}
export function cutsFromSilences(duration:number,silences:{start:number;end:number}[],padding=.18):Cuts {
  const segments:{start:number;end:number}[]=[]; let cursor=0;
  for(const s of silences){
    const end=s.start<=.02?cursor:Math.max(cursor,Math.min(duration,s.start+padding));
    const next=s.end>=duration-.02?duration:Math.max(cursor,Math.min(duration,s.end-padding));
    if(next<=end)continue;
    if(end-cursor>.06)segments.push({start:cursor,end});
    cursor=next;
  }
  if(duration-cursor>.06)segments.push({start:cursor,end:duration});
  if(!segments.length)throw Error('Nenhuma fala detectada. Reveja o limiar de silêncio.');
  return {version:1,sourceDuration:duration,segments,note:'Proposta por silêncio; revisar respirações, palavras e intenção. Repetições e erros são decisões do agente.'};
}
export function durationOf(cuts:Cuts){return cuts.segments.reduce((sum,s)=>sum+s.end-s.start,0);}
export function remapWords(words:Word[],cuts:Cuts):Word[]{
  let offset=0;const result:Word[]=[];
  for(const segment of cuts.segments){
    for(const word of words){
      const midpoint=(word.start+word.end)/2;
      if(midpoint>=segment.start&&midpoint<segment.end){
        const start=offset+Math.max(word.start,segment.start)-segment.start;
        const end=offset+Math.min(word.end,segment.end)-segment.start;
        if(end>start)result.push({...word,start,end});
      }
    }
    offset+=segment.end-segment.start;
  }
  return result;
}
export function whisperWords(data:any):Word[]{
  const words:Word[]=[];
  for(const segment of data.transcription??[]){
    const fullText=String(segment.text??'').trim();
    const segmentStart=Number(segment.offsets?.from)/1000, segmentEnd=Number(segment.offsets?.to)/1000;
    // Com -ml 1 -sow, o Whisper emite segmentos de uma palavra. O tempo do
    // segmento preserva palavras curtas e pontuação cujos tokens têm duração zero.
    if(fullText&&!/\s/.test(fullText)&&!/^\[.*\]$/.test(fullText)&&Number.isFinite(segmentStart)&&Number.isFinite(segmentEnd)&&segmentStart>=0&&segmentEnd>segmentStart){
      words.push({text:fullText,start:segmentStart,end:segmentEnd});continue;
    }
    for(const token of segment.tokens??[]){
      const text=String(token.text??'');
      if(!text.trim()||text.includes('[_')||text.includes('[BEG]')||text.includes('[SOT]')||text.includes('[EOT]')||/^\[.*\]$/.test(text.trim()))continue;
      const start=Number(token.offsets?.from)/1000,end=Number(token.offsets?.to)/1000;
      if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start)continue;
      if(/^\s/.test(text)||!words.length)words.push({text:text.trim(),start,end,confidence:Number.isFinite(token.p)?Math.min(1,Math.max(0,token.p)):undefined});
      else {const previous=words.at(-1)!;previous.text+=text;previous.end=end;}
    }
  }
  if(!words.length)throw Error('Whisper não retornou palavras com tempo. Confira trabalho/whisper.json e o áudio.');
  return words;
}
export function frameSegments(cuts:Cuts,fps:number) {
  let offset=0;
  return cuts.segments.map(s=>{const from=Math.round(offset*fps);offset+=s.end-s.start;return {from,duration:Math.round(offset*fps)-from,sourceStart:Math.round(s.start*fps)};}).filter(s=>s.duration>0);
}
export function draftScenes(words:Word[],duration:number){
  const scenes:any[]=[];let start=0,index=0;
  while(start<duration-.05){
    const end=Math.min(duration,start+3.8);
    const part=words.filter(w=>w.start>=start&&w.start<end);
    const title=part.map(w=>w.text).join(' ').slice(0,90)||'Defina o visual desta fala';
    scenes.push({id:`cena-${++index}`,start,end,type:'headline',title,layout:index%3===0?'full':'card',emphasis:[],zoom:index%2===0?1.04:1,illustration:false,soundVolume:.1});
    start=end;
  }
  return {version:1,status:'draft',scenes};
}
