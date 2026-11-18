import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {BrandSchema,JobSchema} from '../src/schema.ts';
import {StyleProfileSchema,StyleRefSchema,type StyleProfile} from '../src/styles.ts';
import {ROOT,inside,exists,readJson,writeJson,hashFile} from './core.ts';

export const libraryRoot=(value?:unknown)=>path.resolve(typeof value==='string'&&value.trim()?value:path.join(os.homedir(),'projetos/cinema-9d-biblioteca'));
export async function listStyles(library?:unknown){
  const result:Array<{id:string;version:string;name:string;file:string;scope:string}>=[];
  for(const root of [path.join(ROOT,'styles'),path.join(libraryRoot(library),'styles')]){
    if(!await exists(root))continue;
    for(const entry of await fs.readdir(root,{withFileTypes:true})){
      if(!entry.isDirectory())continue;
      for(const version of await fs.readdir(await inside(root,entry.name))){
        if(!/^\d+\.\d+\.\d+$/.test(version))continue;
        const file=await inside(root,`${entry.name}/${version}/style.json`);
        const profile=StyleProfileSchema.parse(await readJson(file));
        if(profile.id!==entry.name||profile.version!==version)throw Error('Catálogo de estilos inconsistente.');
        if(result.some(s=>s.id===profile.id&&s.version===version))throw Error('Estilo duplicado entre catálogo central e biblioteca. Use outro id/versão.');
        result.push({id:profile.id,version:profile.version,name:profile.name,file,scope:profile.reference.approvalScope});
      }
    }
  }
  return result;
}
export async function applyStyle(dir:string,id:unknown,version?:unknown,library?:unknown){
  if(typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id))throw Error('Informe um identificador de estilo válido.');
  const available=(await listStyles(library)).filter(s=>s.id===id).sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}));
  const selected=typeof version==='string'?available.find(s=>s.version===version):available[0];
  if(!selected)throw Error('Estilo/versão não encontrado no catálogo. Use estilos.');
  return applyProfile(dir,selected.file);
}
export async function applyProfile(dir:string,fileName:string){
  const profile=StyleProfileSchema.parse(await readJson(fileName));
  const job=JobSchema.parse(await readJson(await inside(dir,'job.json'))),brandFile=await inside(dir,'marca/identidade.json');
  const oldBrand=BrandSchema.parse(await readJson(brandFile));
  if(oldBrand.name!=='Sua marca'&&oldBrand.name!==profile.brand.name)throw Error('A produção tem outra marca. Preserve sua identidade e crie um perfil próprio antes de aplicar este estilo.');
  const previous=await readJson(await inside(dir,'trabalho/ultima-previa.json')).catch(()=>null);
  if(previous?.revision===job.revision)throw Error('A revisão atual já tem prévia. Preserve-a com revisao --nome r02 antes de trocar o estilo.');
  const file=await inside(dir,'marca/estilo.json');
  await writeJson(file,profile);
  const reference=StyleRefSchema.parse({id:profile.id,version:profile.version,sha256:await hashFile(file)});
  await writeJson(brandFile,BrandSchema.parse({...oldBrand,...profile.brand}));
  await writeJson(await inside(dir,'job.json'),{...job,style:reference});
  console.log(`Estilo aplicado: ${profile.name} ${profile.version}. Snapshot em marca/estilo.json. Forneça logo/fontes/telas na produção; cenas e gestos precisam de nova decupagem.`);
  return profile;
}
export async function loadStyle(dir:string,job:ReturnType<typeof JobSchema.parse>):Promise<StyleProfile|undefined>{
  if(!job.style)return undefined;
  const file=await inside(dir,'marca/estilo.json');
  if(!await exists(file)||await hashFile(file)!==job.style.sha256)throw Error('Snapshot de estilo mudou ou está ausente. Use estilo para aplicar uma versão de catálogo; não edite o hash para contornar a verificação.');
  const profile=StyleProfileSchema.parse(await readJson(file));
  if(profile.id!==job.style.id||profile.version!==job.style.version)throw Error('Identificação do estilo diverge do snapshot.');
  return profile;
}
