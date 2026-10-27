import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {cutsFromSilences,remapWords,whisperWords,detectSilences,inside,frameSegments,durationOf} from '../scripts/core.ts';
import {CutsSchema,ScenesSchema,JobSchema} from '../src/schema.ts';

test('remover pausas preserva margens e mantém tempos rastreáveis',()=>{
  const silences=detectSilences('silence_start: 0\nsilence_end: 1.5\nsilence_start: 3\nsilence_end: 5\nsilence_start: 7',8);
  const cuts=cutsFromSilences(8,silences,.2);
  assert.deepEqual(cuts.segments,[{start:1.3,end:3.2},{start:4.8,end:7.2}]);
  assert.ok(durationOf(cuts)<8);
});
test('tempos das palavras seguem os cortes e excluem o trecho removido',()=>{
  const cuts=CutsSchema.parse({version:1,sourceDuration:10,segments:[{start:1,end:3},{start:6,end:8}]});
  const words=remapWords([{text:'A',start:1.5,end:1.8},{text:'fora',start:4,end:4.3},{text:'B',start:6.2,end:6.8}],cuts);
  assert.equal(words.length,2);assert.ok(Math.abs(words[0].start-.5)<1e-9);assert.ok(Math.abs(words[1].start-2.2)<1e-9);
});
test('quantização cumulativa evita deriva entre muitos cortes',()=>{
  const cuts=CutsSchema.parse({version:1,sourceDuration:100,segments:Array.from({length:80},(_,i)=>({start:i,end:i+.317}))});
  const segments=frameSegments(cuts,30);
  for(let i=1;i<segments.length;i++)assert.equal(segments[i].from,segments[i-1].from+segments[i-1].duration);
  assert.equal(segments.at(-1)!.from+segments.at(-1)!.duration,Math.round(durationOf(cuts)*30));
});
test('tokens parciais do Whisper se juntam em palavras, sem inventar tempos',()=>{
  const words=whisperWords({transcription:[{tokens:[
    {text:'[_BEG_]',offsets:{from:0,to:0}},{text:' Ol',offsets:{from:0,to:100},p:.9},
    {text:'á',offsets:{from:100,to:200},p:.9},{text:' mundo',offsets:{from:250,to:500},p:.9},
    {text:'!',offsets:{from:500,to:550},p:1},
  ]}]});assert.deepEqual(words.map(w=>w.text),['Olá','mundo!']);assert.equal(words[1].end,.55);
});
test('rejeita cortes sobrepostos, cenas inválidas e caminhos externos',()=>{
  assert.throws(()=>CutsSchema.parse({version:1,sourceDuration:10,segments:[{start:1,end:4},{start:3,end:5}]}));
  assert.throws(()=>ScenesSchema.parse({version:1,scenes:[{id:'x',start:0,end:2,type:'metric',title:'Número sem fonte'}]}));
  assert.throws(()=>JobSchema.parse({version:1,name:'Teste',video:'../../segredo.mp4'}));
});
test('tempo do segmento preserva palavra curta com token de duração zero',()=>{
  const words=whisperWords({transcription:[{text:' a',offsets:{from:7350,to:7470},tokens:[{text:' a',offsets:{from:7350,to:7350}}]}]});
  assert.deepEqual(words,[{text:'a',start:7.35,end:7.47}]);
});
test('arquivos e links fora da pasta não entram no trabalho',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'cinema-path-'));
  try{
    await fs.symlink(os.tmpdir(),path.join(root,'fora'));
    await assert.rejects(inside(root,'fora/arquivo.mp4'));
    await assert.rejects(inside(root,'../arquivo.mp4'));
    assert.equal(await inside(root,'entrada/video.mp4'),path.join(await fs.realpath(root),'entrada/video.mp4'));
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
