import fs from 'node:fs/promises';
import path from 'node:path';
import {JobSchema,ScenesSchema} from '../src/schema.ts';
import {ROOT,inside,exists,readJson,writeJson,hashFile} from './core.ts';

export async function customProjects(dir:string){
  const entries=await fs.readdir(await inside(dir,'edicao'),{withFileTypes:true}).catch(()=>[]);
  return entries.filter(e=>e.isDirectory()&&/^remotion-/.test(e.name)).map(e=>'edicao/'+e.name).sort();
}
export async function assertCentral(dir:string,job:ReturnType<typeof JobSchema.parse>){
  const custom=await customProjects(dir);
  if(job.rendering||custom.length)throw Error(`Montagem própria detectada: ${job.rendering?.project??custom.join(', ')}. Leia AGENTS.md e o documento de continuidade atual. Os comandos centrais não devem sobrescrever cortes/aprovação históricos. Use os scripts da composição própria; aprender e status continuam disponíveis.`);
}
export async function revision(dir:string,job:ReturnType<typeof JobSchema.parse>,name:unknown,note:unknown){
  if(typeof name!=='string'||!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(name)||name===job.revision)throw Error('Use revisao --nome r02 (nome novo, diferente da revisão atual).');
  const at=new Date().toISOString(),destination=`revisoes/${job.revision}-${at.replaceAll(':','-')}`;
  await fs.mkdir(await inside(dir,'revisoes'),{recursive:true});
  await fs.mkdir(await inside(dir,destination),{recursive:false});
  const decisions=['job.json','marca/identidade.json','roteiro/briefing.md','roteiro/fala.txt','edicao/cortes.json','edicao/cenas.json','edicao/gestos.json','edicao/aprovacao.json','trabalho/cortes-origem.json','trabalho/transcricao-original.json','trabalho/ultima-previa.json'];
  const hashes:Record<string,string>={};
  for(const file of decisions){
    const input=await inside(dir,file);if(!await exists(input))continue;
    const output=await inside(dir,`${destination}/${file}`);await fs.mkdir(path.dirname(output),{recursive:true});
    await fs.copyFile(input,output);hashes[file]=await hashFile(output);
  }
  await writeJson(await inside(dir,`${destination}/manifest.json`),{version:1,revision:job.revision,nextRevision:name,at,note:typeof note==='string'?note:'',files:hashes,scope:'Decisões e transcrição. Mídias e código não são copiados; preserve os assets existentes.'},false);
  await writeJson(await inside(dir,'job.json'),{...job,revision:name});
  const scenesFile=await inside(dir,'edicao/cenas.json');
  if(await exists(scenesFile)){const scenes=ScenesSchema.parse(await readJson(scenesFile));await writeJson(scenesFile,{...scenes,status:'draft'});}
  console.log(`Decisões da ${job.revision} preservadas em ${destination}. Revisão ativa: ${name}. Prévia/aprovação anteriores não valem para a nova revisão. Preserve mídia e código antes de alterá-los.`);
}
export async function learn(dir:string,flags:Record<string,string|boolean>){
  for(const key of ['titulo','observacao','proposta'])if(typeof flags[key]!=='string'||!String(flags[key]).trim())throw Error('Use aprender --titulo "Título" --observacao "O que ocorreu" --proposta "Melhoria sugerida" [--evidencia "arquivo/trecho"].');
  const at=new Date().toISOString(),id=at.replaceAll(':','-')+'-'+Math.random().toString(16).slice(2,8);
  const file=await inside(dir,`aprendizados/${id}.json`);
  await writeJson(file,{version:1,id,at,status:'proposto',title:flags.titulo,observation:flags.observacao,proposal:flags.proposta,evidence:flags.evidencia??null,methodVersion:(await readJson(path.join(ROOT,'package.json'))).version},false);
  console.log(`Aprendizado registrado localmente: ${file}\nNão foi incorporado ao método. Revise a evidência, retire dados privados e peça uma atualização reutilizável na pasta central.`);
}
