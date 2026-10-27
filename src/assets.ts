import {createContext,useContext} from 'react';
import {staticFile} from 'remotion';
export const AssetHashes=createContext<Record<string,string>>({});
export function useAssets(){
  const hashes=useContext(AssetHashes);
  return (file:string)=>staticFile(hashes[file]?`versions/${hashes[file]}/${file}`:file);
}
