/**
 * Registro local de mídia gerada por serviços externos (por exemplo, os servidores MCP genmedia-* do Google).
 * Este script NÃO chama nenhum provedor, API ou agente: só valida, calcula hashes e copia arquivos já baixados.
 * Fica fora da lista de arquivos do fingerprint de render (scripts/cli.ts), então não invalida aprovações existentes.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {constants} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {z} from 'zod';
import {readJson,writeJson,inside,exists,hashFile} from './core.ts';

export const MANIFEST='geracao/manifesto.json';
export const RAW_DIR='geracao/brutos';
export const USE_DIR='elementos/gerados';

const sha=z.string().regex(/^[a-f0-9]{64}$/);
const relativeFile=z.string().min(1).refine(s=>!s.includes('\\')&&!s.startsWith('/')&&!s.split('/').includes('..')&&!/^[a-z]+:/i.test(s),'Use caminho relativo dentro da pasta do trabalho.');
const fileRow=z.object({caminho:relativeFile,sha256:sha,bytes:z.number().int().positive()}).strict();
const id=z.string().regex(/^g\d{3,}$/,'Use ids g001, g002...');

const GenerationBase=z.object({
  id:id.optional(),                      // opcional: reserva o id usado em geracao/pedidos/ e brutos/
  tipo:z.enum(['video','imagem','musica','narracao','transcricao','montagem']),
  servidor:z.string().min(1),            // ex.: genmedia-veo
  ferramenta:z.string().min(1),          // ex.: veo_t2v
  modelo:z.string().min(1).optional(),   // ex.: veo-3.1-fast-generate-001 (montagem local pode não ter)
  finalidade:z.string().min(5),          // por que existe: cena/ideia da fala que apoia
  prompt:z.string().optional(),
  promptNegativo:z.string().optional(),
  entradas:z.array(z.string().min(1)).default([]), // arquivos/URIs enviados como referência (upload)
  proporcao:z.string().regex(/^\d+:\d+$/).optional(),
  duracaoSegundos:z.number().positive().optional(),
  quantidade:z.number().int().min(1).default(1),
  parametros:z.record(z.string(),z.unknown()).default({}),
  custoEstimado:z.object({valor:z.number().min(0),moeda:z.enum(['USD','BRL']),base:z.string().min(5)}).strict(),
  aprovacao:z.object({por:z.string().min(1),em:z.string().min(1),registro:z.string().min(3)}).strict().optional(),
  intermediario:z.string().optional(),   // URI gs:// temporária, se houver; o bucket é só passagem
  arquivos:z.array(relativeFile).min(1),
  ilustracao:z.boolean().default(true),
  notas:z.string().optional(),
}).strict();
export const GenerationInputSchema=GenerationBase.superRefine((e,ctx)=>{
  if(e.tipo!=='montagem'&&!e.aprovacao)ctx.addIssue({code:'custom',message:'Geração paga precisa de aprovacao {por, em, registro} com o OK explícito do usuário para esta geração.',path:['aprovacao']});
  if(e.tipo!=='montagem'&&!e.modelo)ctx.addIssue({code:'custom',message:'Informe o modelo usado.',path:['modelo']});
  if(['video','imagem'].includes(e.tipo)&&!e.proporcao)ctx.addIssue({code:'custom',message:'Vídeo e imagem precisam da proporção combinada com o usuário.',path:['proporcao']});
  if(e.tipo==='montagem'&&e.custoEstimado.valor>0&&!e.aprovacao)ctx.addIssue({code:'custom',message:'Montagem com custo precisa de aprovação.',path:['aprovacao']});
});
const EntrySchema=GenerationBase.omit({arquivos:true}).extend({
  id,criadoEm:z.string(),status:z.enum(['gerado','escolhido','descartado']).default('gerado'),
  arquivos:z.array(fileRow).min(1),
  usos:z.array(z.object({origem:relativeFile,destino:relativeFile,sha256:sha,em:z.string()}).strict()).default([]),
}).strict();
export const GenerationManifestSchema=z.object({version:z.literal(1),entradas:z.array(EntrySchema)}).strict().superRefine((m,ctx)=>{
  const ids=new Set<string>();
  m.entradas.forEach((e,i)=>{if(ids.has(e.id))ctx.addIssue({code:'custom',message:'ID repetido: '+e.id,path:['entradas',i]});ids.add(e.id);});
});
export type GenerationManifest=z.infer<typeof GenerationManifestSchema>;

async function production(folder:string){
  const dir=await fs.realpath(path.resolve(folder));
  if(!await exists(path.join(dir,'job.json')))throw Error('Pasta sem job.json: informe a pasta da produção.');
  return dir;
}
export async function loadManifest(dir:string):Promise<GenerationManifest>{
  const file=await inside(dir,MANIFEST);
  if(!await exists(file))return {version:1,entradas:[]};
  return GenerationManifestSchema.parse(await readJson(file));
}
async function withLock(dir:string,action:()=>Promise<void>){
  const file=path.join(dir,'.cinema-edicao.lock');
  const lock=await fs.open(file,'wx').catch(()=>{throw Error('Já existe uma operação neste trabalho. Confira o processo e o arquivo .cinema-edicao.lock.');});
  await lock.writeFile(JSON.stringify({pid:process.pid,at:new Date().toISOString(),acao:'geracao'}));
  try{await action();}finally{await lock.close();await fs.rm(file,{force:true});}
}
const under=(rel:string,prefix:string)=>rel===prefix||rel.startsWith(prefix+'/');

/** Registra arquivos já baixados em geracao/brutos/, com hash e tamanho. Não gera nem baixa nada. */
export async function registerGeneration(folder:string,input:unknown){
  const dir=await production(folder),data=GenerationInputSchema.parse(input);
  let created='';
  await withLock(dir,async()=>{
    const manifest=await loadManifest(dir);
    const rows=[];
    for(const rel of data.arquivos){
      if(!under(rel,RAW_DIR))throw Error(`Baixe a geração em ${RAW_DIR}/ (output_directory) e registre de lá: ${rel}`);
      const file=await inside(dir,rel),stat=await fs.lstat(file).catch(()=>null);
      if(!stat?.isFile())throw Error('Arquivo baixado não encontrado: '+rel);
      if(manifest.entradas.some(e=>e.arquivos.some(a=>a.caminho===rel)))throw Error('Arquivo já registrado: '+rel);
      rows.push({caminho:rel,sha256:await hashFile(file),bytes:stat.size});
    }
    const next=1+Math.max(0,...manifest.entradas.map(e=>Number(e.id.slice(1))));
    created=data.id??'g'+String(next).padStart(3,'0');
    if(manifest.entradas.some(e=>e.id===created))throw Error('ID já registrado: '+created);
    manifest.entradas.push(EntrySchema.parse({...data,id:created,criadoEm:new Date().toISOString(),status:'gerado',arquivos:rows,usos:[]}));
    await writeJson(await inside(dir,MANIFEST),GenerationManifestSchema.parse(manifest));
  });
  return created;
}

/** Copia um arquivo registrado para elementos/gerados/ e marca a entrada como escolhida. */
export async function useGeneration(folder:string,entryId:string,options:{arquivo?:string;destino?:string}={}){
  const dir=await production(folder);let target='';
  await withLock(dir,async()=>{
    const manifest=await loadManifest(dir),entry=manifest.entradas.find(e=>e.id===entryId);
    if(!entry)throw Error('Geração não registrada: '+entryId);
    if(entry.status==='descartado')throw Error('Geração descartada; registre outra ou altere o status conscientemente.');
    const row=options.arquivo?entry.arquivos.find(a=>a.caminho===options.arquivo):entry.arquivos.length===1?entry.arquivos[0]:undefined;
    if(!row)throw Error('Informe --arquivo com um dos caminhos registrados em '+entryId+'.');
    const source=await inside(dir,row.caminho);
    if(await hashFile(source)!==row.sha256)throw Error('O arquivo bruto mudou depois do registro: '+row.caminho);
    target=options.destino??`${USE_DIR}/${entry.id}-${path.basename(row.caminho)}`;
    relativeFile.parse(target);
    if(!under(target,'elementos')&&!under(target,'marca')&&!under(target,'interface'))throw Error('Destino deve ficar em elementos/, marca/ ou interface/.');
    const file=await inside(dir,target);
    await fs.mkdir(path.dirname(file),{recursive:true});
    await fs.copyFile(source,file,constants.COPYFILE_EXCL).catch(error=>{if(error.code==='EEXIST')throw Error('Destino já existe; não sobrescrevo: '+target);throw error;});
    entry.status='escolhido';entry.usos.push({origem:row.caminho,destino:target,sha256:row.sha256,em:new Date().toISOString()});
    await writeJson(await inside(dir,MANIFEST),GenerationManifestSchema.parse(manifest));
  });
  return target;
}

export async function discardGeneration(folder:string,entryId:string,reason?:string){
  const dir=await production(folder);
  await withLock(dir,async()=>{
    const manifest=await loadManifest(dir),entry=manifest.entradas.find(e=>e.id===entryId);
    if(!entry)throw Error('Geração não registrada: '+entryId);
    if(entry.usos.length)throw Error('Geração já copiada para a produção; remova a referência nas cenas antes de descartar.');
    entry.status='descartado';if(reason)entry.notas=[entry.notas,`Descartada: ${reason}`].filter(Boolean).join('\n');
    await writeJson(await inside(dir,MANIFEST),GenerationManifestSchema.parse(manifest));
  });
}

/** Confere hashes de brutos e cópias e soma o custo estimado. */
export async function generationStatus(folder:string){
  const dir=await production(folder),manifest=await loadManifest(dir),problems:string[]=[],totals:Record<string,number>={};
  for(const e of manifest.entradas){
    totals[e.custoEstimado.moeda]=(totals[e.custoEstimado.moeda]??0)+e.custoEstimado.valor;
    for(const a of e.arquivos){const file=await inside(dir,a.caminho);if(!await exists(file))problems.push(`${e.id}: bruto ausente ${a.caminho}`);else if(await hashFile(file)!==a.sha256)problems.push(`${e.id}: bruto alterado ${a.caminho}`);}
    for(const u of e.usos){const file=await inside(dir,u.destino);if(!await exists(file))problems.push(`${e.id}: cópia ausente ${u.destino}`);else if(await hashFile(file)!==u.sha256)problems.push(`${e.id}: cópia alterada ${u.destino}`);}
  }
  return {manifest,problems,totals};
}

const HELP=`Registro de mídia gerada (não chama provedores; só registra arquivos já baixados)

cinema-geracao status "/produção"
cinema-geracao registrar "/produção" --dados "/caminho/entrada.json"
cinema-geracao usar "/produção" --id g001 [--arquivo geracao/brutos/g001/x.mp4] [--destino elementos/gerados/x.mp4]
cinema-geracao descartar "/produção" --id g001 [--motivo "Texto"]

Leia docs/GERACAO-GOOGLE.md. Nenhuma geração paga sem o OK explícito do usuário para aquela geração.
`;
function parse(argv:string[]){
  const positional:string[]=[],flags:Record<string,string|boolean>={};
  for(let i=0;i<argv.length;i++){if(argv[i].startsWith('--')){const key=argv[i].slice(2);flags[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}else positional.push(argv[i]);}
  return {command:positional[0]??'ajuda',folder:positional[1],flags};
}
const str=(v:unknown)=>typeof v==='string'?v:undefined;
async function main(){
  const {command,folder,flags}=parse(process.argv.slice(2));
  if(['ajuda','help','--help'].includes(command)||!folder){console.log(HELP);return;}
  if(command==='status'){
    const {manifest,problems,totals}=await generationStatus(folder);
    for(const e of manifest.entradas)console.log(`${e.id} ${e.status.padEnd(10)} ${e.tipo.padEnd(10)} ${(e.modelo??e.ferramenta).padEnd(28)} ${e.proporcao??'-'} ${e.duracaoSegundos?e.duracaoSegundos+'s':''} ${e.custoEstimado.valor} ${e.custoEstimado.moeda} → ${e.usos.map(u=>u.destino).join(', ')||e.arquivos.map(a=>a.caminho).join(', ')}`);
    console.log(`Entradas: ${manifest.entradas.length}. Custo estimado: ${Object.entries(totals).map(([m,v])=>`${v.toFixed(2)} ${m}`).join(' + ')||'0'}.`);
    if(problems.length){console.log(problems.join('\n'));process.exitCode=1;}
    return;
  }
  if(command==='registrar'){const file=str(flags.dados);if(!file)throw Error('Informe --dados com o JSON da geração.');console.log('Registrada: '+await registerGeneration(folder,await readJson(path.resolve(file))));return;}
  if(command==='usar'){const id=str(flags.id);if(!id)throw Error('Informe --id.');const target=await useGeneration(folder,id,{arquivo:str(flags.arquivo),destino:str(flags.destino)});console.log(`Copiado para ${target}. Referencie esse caminho em cenas.json/job.json. Materiais mudaram: um lote em andamento precisa de produzir --novo.`);return;}
  if(command==='descartar'){const id=str(flags.id);if(!id)throw Error('Informe --id.');await discardGeneration(folder,id,str(flags.motivo));console.log('Marcada como descartada; o bruto é preservado.');return;}
  throw Error('Comando desconhecido: '+command+'\n'+HELP);
}
if(import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error('\nErro:',error.message);process.exitCode=1;});
