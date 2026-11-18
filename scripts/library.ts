import fs from 'node:fs/promises';
import path from 'node:path';
import {constants} from 'node:fs';
import {z} from 'zod';
import {StyleProfileSchema,StyleRefSchema} from '../src/styles.ts';
import {JobSchema,BrandSchema} from '../src/schema.ts';
import {ROOT,inside,exists,readJson,writeJson,hashFile} from './core.ts';
import {applyProfile,loadStyle,libraryRoot,listStyles} from './styles.ts';

type Flags=Record<string,string|boolean>;
const slug=StyleRefSchema.shape.id;
const relative=z.string().min(1).refine(s=>!s.startsWith('/')&&!s.includes('\\')&&!s.split('/').includes('..')&&!/^[a-z]+:/i.test(s));
export const KitInput=z.object({version:z.literal(1),id:slug,description:z.string().min(1),assets:z.array(z.object({source:relative,target:relative.refine(s=>/^(marca|interface|elementos)\//.test(s))})).min(1),brand:BrandSchema,notes:z.array(z.string()).default([])}).strict();
const Kit=z.object({version:z.literal(1),id:slug,description:z.string(),style:StyleRefSchema,brand:BrandSchema,assets:z.array(z.object({file:relative,sha256:z.string().regex(/^[a-f0-9]{64}$/)})),notes:z.array(z.string()),createdAt:z.string()}).strict();
export async function copyVerified(source:string,target:string,sha?:string){
  const expected=sha??await hashFile(source);await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.copyFile(source,target,constants.COPYFILE_EXCL|constants.COPYFILE_FICLONE);
  if(await hashFile(target)!==expected){await fs.rm(target,{force:true});throw Error('Asset mudou durante a cópia: '+source);}
}
export async function createStyle(folder:string,flags:Flags){
  const dir=path.resolve(folder);if(await exists(dir))throw Error('Use uma pasta nova para o rascunho.');
  const id=slug.parse(flags.id),name=z.string().min(1).parse(flags.nome),brand=z.string().min(1).parse(flags.marca??name);
  const base=typeof flags.base==='string'?(await listStyles(flags.biblioteca)).find(s=>s.id===flags.base):undefined;
  if(flags.base&&!base)throw Error('Estilo base ausente.');
  const profile=StyleProfileSchema.parse(await readJson(base?.file??path.join(ROOT,'styles/exemplo/1.0.0/style.json')));
  profile.id=id;profile.version=typeof flags.versao==='string'?flags.versao:'1.0.0';profile.name=name;
  profile.reference={label:'Rascunho: definir referências e evidências no briefing',revision:'draft',approvalScope:'draft-style'};
  profile.brand={...profile.brand,name:brand};
  if(!base){
    profile.brand={name:brand,primary:'#a4ff63',background:'#101419',foreground:'#f5f6f1',muted:'#aab1ba',fontFamily:'Arial'};
    profile.tokens.background='grid';profile.tokens.logo.sceneControlled=false;
    profile.tokens.cards={radius:18,surface:'#1d242c',border:'#36434f',shadow:'#000000',padding:24};
    profile.tokens.captions={...profile.tokens.captions,background:'#080b10',foreground:'#f5f6f1',activeMark:'color'};
    profile.rules=[{id:'direcao-propria',scope:'style',instruction:'Definir ritmo, composição e identidade a partir das referências próprias antes de registrar.'},{id:'adaptar-fala',scope:'per-production',instruction:'Recalcular cortes e cenas para cada fala; preservar gestos e áudio original.'}];
    profile.recipes=[{id:'ideia-visual',purpose:'Explicar uma ideia da fala com composição própria',parameters:['fala','tempo','layout','assets','gestos']}];
  }
  if(typeof flags.primaria==='string')profile.brand.primary=flags.primaria;
  StyleProfileSchema.parse(profile);await fs.mkdir(dir,{recursive:true});
  await writeJson(path.join(dir,'style.json'),profile,false);
  await fs.writeFile(path.join(dir,'briefing.md'),'# Direção do estilo\n\nMarca/público/objetivo:\nReferências e o que aproveitar:\nCores e fontes (licenças):\nRitmo e cortes:\nRosto/gestos/crops:\nLettering/legendas/ícones/telas:\nSons e transições:\nO que evitar:\nRegras reutilizáveis com evidência:\n\nEdite style.json. Use demo-estilo --perfil para estudar. Um estudo sintético verifica o render; valide também em uma fala real antes de escalar.\n');
  console.log('Rascunho criado em '+dir+'; ainda sem aprovação.');return profile;
}
export async function registerStyle(folder:string,flags:Flags){
  if(typeof flags.por!=='string'||!flags.por.trim()||typeof flags.estudo!=='string')throw Error('Após aprovação do estudo, informe --estudo "/produção" --por "Nome".');
  const dir=await fs.realpath(folder),profile=StyleProfileSchema.parse(await readJson(await inside(dir,'style.json')));
  if(profile.reference.approvalScope!=='draft-style')throw Error('Registre um rascunho próprio; não herde a aprovação de outro estilo.');
  const study=await fs.realpath(flags.estudo),job=JobSchema.parse(await readJson(await inside(study,'job.json')));
  const snapshot=await loadStyle(study,job);
  if(JSON.stringify(snapshot)!==JSON.stringify(profile))throw Error('Estudo não corresponde ao rascunho atual. Reaplique e gere outra prévia.');
  const {validate}=await import('./cli.ts');const checked=await validate(study,job);
  const preview=await readJson(await inside(study,'trabalho/ultima-previa.json'));
  if(preview.fingerprint!==checked.fingerprint||await hashFile(await inside(study,preview.output))!==preview.outputSha256)throw Error('Prévia do estudo ausente, alterada ou desatualizada.');
  const root=libraryRoot(flags.biblioteca);await fs.mkdir(root,{recursive:true});
  if((await listStyles(root)).some(s=>s.id===profile.id&&s.version===profile.version))throw Error('Versão já existe. Crie outra versão, sem sobrescrever.');
  const target=await inside(root,`styles/${profile.id}/${profile.version}`);await fs.mkdir(path.dirname(target),{recursive:true});await fs.mkdir(target);
  profile.reference={...profile.reference,approvalScope:'reviewed-style',revision:'reviewed'};
  await writeJson(path.join(target,'style.json'),profile,false);
  await writeJson(path.join(target,'registro.json'),{by:flags.por,at:new Date().toISOString(),studyFingerprint:checked.fingerprint,previewSha256:preview.outputSha256,scope:'Estilo; não aprova futuras produções.'},false);
  console.log('Estilo registrado em '+target);return target;
}
export async function registerKit(sourceDir:string,manifest:string,library?:unknown){
  const source=await fs.realpath(sourceDir),input=KitInput.parse(await readJson(manifest));
  const job=JobSchema.parse(await readJson(await inside(source,'job.json'))),style=await loadStyle(source,job);
  if(!style||style.reference.approvalScope==='draft-style')throw Error('Kit precisa de estilo consolidado.');
  for(const [key,value] of Object.entries(style.brand))if(input.brand[key as keyof typeof input.brand]!==value)throw Error('Marca do kit diverge do perfil: '+key);
  const names=input.assets.map(a=>a.target);if(new Set(names).size!==names.length)throw Error('Destino duplicado no kit.');
  for(const file of [input.brand.logo,input.brand.fontFile].filter((s):s is string=>!!s))if(!names.includes(file))throw Error('Logo/fonte não incluída na lista de assets.');
  const checked=await Promise.all(input.assets.map(async a=>({...a,file:await inside(source,a.source),sha256:await hashFile(await inside(source,a.source))})));
  const root=libraryRoot(library);await fs.mkdir(root,{recursive:true});const target=await inside(root,`kits/${input.id}`);
  await fs.mkdir(path.dirname(target),{recursive:true});await fs.mkdir(target); // exclusivo: não altera kit existente
  try{
    for(const a of checked)await copyVerified(a.file,await inside(target,a.target),a.sha256);
    await writeJson(path.join(target,'style.json'),style,false);
    await writeJson(path.join(target,'kit.json'),Kit.parse({version:1,id:input.id,description:input.description,style:{id:style.id,version:style.version,sha256:await hashFile(path.join(target,'style.json'))},brand:input.brand,assets:checked.map(a=>({file:a.target,sha256:a.sha256})),notes:input.notes,createdAt:new Date().toISOString()}),false);
  }catch(error){await fs.rm(target,{recursive:true,force:true});throw error;}
  console.log('Kit local registrado: '+target);return target;
}
export async function applyKit(dir:string,id:unknown,library?:unknown){
  const root=libraryRoot(library),kitDir=await inside(root,`kits/${slug.parse(id)}`),kit=Kit.parse(await readJson(await inside(kitDir,'kit.json')));
  const profile=StyleProfileSchema.parse(await readJson(await inside(kitDir,'style.json')));
  if(await hashFile(await inside(kitDir,'style.json'))!==kit.style.sha256||profile.id!==kit.style.id||profile.version!==kit.style.version)throw Error('Perfil do kit foi alterado.');
  for(const a of kit.assets){
    if(await hashFile(await inside(kitDir,a.file))!==a.sha256)throw Error('Asset do kit alterado: '+a.file);
    const target=await inside(dir,a.file);
    if(await exists(target)&&await hashFile(target)!==a.sha256)throw Error('Kit conflita com material da produção: '+a.file);
  }
  const job=JobSchema.parse(await readJson(await inside(dir,'job.json'))),brand=BrandSchema.parse(await readJson(await inside(dir,'marca/identidade.json')));
  if(brand.name!=='Sua marca'&&JSON.stringify(brand)!==JSON.stringify(kit.brand))throw Error('Kit conflita com identidade existente.');
  if(job.style&&job.style.sha256!==kit.style.sha256)throw Error('A produção já usa outro perfil.');
  if(!job.style)await applyProfile(dir,path.join(kitDir,'style.json'));
  for(const a of kit.assets)if(!await exists(await inside(dir,a.file)))await copyVerified(await inside(kitDir,a.file),await inside(dir,a.file),a.sha256);
  await writeJson(await inside(dir,'marca/identidade.json'),kit.brand);
  await writeJson(await inside(dir,'marca/kit.json'),{id:kit.id,style:kit.style,assets:kit.assets,notes:kit.notes},false);
  console.log('Kit aplicado: '+kit.id+'. Telas e regras disponíveis; adapte as cenas à nova fala.');
}
