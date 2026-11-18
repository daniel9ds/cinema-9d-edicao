import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {registerGeneration,useGeneration,discardGeneration,generationStatus,GenerationInputSchema,MANIFEST} from '../scripts/generation.ts';
import {readJson} from '../scripts/core.ts';

// Arquivos sintéticos; nenhum provedor é chamado.
async function production(){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'cinema-geracao-'));
  await fs.writeFile(path.join(dir,'job.json'),JSON.stringify({version:1,name:'SINTÉTICO'}));
  await fs.mkdir(path.join(dir,'geracao/brutos/a'),{recursive:true});
  await fs.writeFile(path.join(dir,'geracao/brutos/a/clip.mp4'),'video-sintetico');
  return dir;
}
const entry=(extra:Record<string,unknown>={})=>({tipo:'video',servidor:'genmedia-veo',ferramenta:'veo_t2v',modelo:'veo-3.1-fast-generate-001',
  finalidade:'B-roll sintético para teste',prompt:'teste',proporcao:'9:16',duracaoSegundos:4,
  custoEstimado:{valor:0,moeda:'USD',base:'teste sem chamada'},aprovacao:{por:'TESTE',em:'2026-11-18',registro:'teste sintético'},
  arquivos:['geracao/brutos/a/clip.mp4'],...extra});

test('geração paga exige aprovação, modelo e proporção',()=>{
  assert.throws(()=>GenerationInputSchema.parse(entry({aprovacao:undefined})));
  assert.throws(()=>GenerationInputSchema.parse(entry({proporcao:undefined})));
  assert.throws(()=>GenerationInputSchema.parse(entry({modelo:undefined})));
  assert.doesNotThrow(()=>GenerationInputSchema.parse(entry({tipo:'montagem',aprovacao:undefined,modelo:undefined})));
});
test('registro exige arquivo baixado em geracao/brutos e guarda hash',async()=>{
  const dir=await production();
  await assert.rejects(registerGeneration(dir,entry({arquivos:['elementos/x.mp4']})));
  await assert.rejects(registerGeneration(dir,entry({arquivos:['geracao/brutos/a/falta.mp4']})));
  assert.equal(await registerGeneration(dir,entry()),'g001');
  await assert.rejects(registerGeneration(dir,entry()),/já registrado/);
  await fs.writeFile(path.join(dir,'geracao/brutos/a/outro.mp4'),'outro');
  await assert.rejects(registerGeneration(dir,entry({id:'g001',arquivos:['geracao/brutos/a/outro.mp4']})),/ID já registrado/);
  const manifest=await readJson(path.join(dir,MANIFEST));
  assert.equal(manifest.entradas[0].arquivos[0].sha256.length,64);
});
test('usar copia sem sobrescrever e status detecta alteração',async()=>{
  const dir=await production();await registerGeneration(dir,entry());
  const target=await useGeneration(dir,'g001');
  assert.equal(target,'elementos/gerados/g001-clip.mp4');
  await assert.rejects(useGeneration(dir,'g001'),/não sobrescrevo/);
  await assert.rejects(discardGeneration(dir,'g001'));
  assert.deepEqual((await generationStatus(dir)).problems,[]);
  await fs.writeFile(path.join(dir,target),'alterado');
  assert.equal((await generationStatus(dir)).problems.length,1);
});
