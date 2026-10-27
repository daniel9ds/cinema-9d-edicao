import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {ROOT} from './core.ts';

async function main(){
  const source=await fs.realpath(path.join(ROOT,'skills/cinema-9d-edicao'));
  for(const agent of ['.codex','.claude']){
    const folder=path.join(os.homedir(),agent,'skills');await fs.mkdir(folder,{recursive:true});
    const destination=path.join(folder,'cinema-9d-edicao');
    const existing=await fs.lstat(destination).catch(()=>null);
    if(existing){
      const actual=await fs.realpath(destination).catch(()=>null);
      if(actual===source){console.log('Skill já vinculada: '+destination);continue;}
      throw Error(`Já existe outra skill em ${destination}. Nenhum arquivo será substituído. Escolha a instalação que deseja manter e ajuste o vínculo manualmente.`);
    }
    await fs.symlink(source,destination,process.platform==='win32'?'junction':'dir');
    console.log(`Skill instalada: ${destination} → ${source}`);
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
