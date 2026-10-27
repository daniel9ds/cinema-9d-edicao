import React from 'react';
import {Img,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import type {Brand,Scene} from './schema';
import {useAssets} from './assets';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
type Element=NonNullable<Scene['elements']>[number];
function position(e:Element,t:number){
  if(!e.keyframes)return{x:e.x,y:e.y};
  return{x:interpolate(t,e.keyframes.map(k=>k.time),e.keyframes.map(k=>k.x),clamp),y:interpolate(t,e.keyframes.map(k=>k.time),e.keyframes.map(k=>k.y),clamp)};
}
// Coordenadas e keyframes são explícitos: não há rastreamento automático de mãos.
export const MotionElements:React.FC<{scene:Scene;brand:Brand;layer?:'back'|'front'}>=({scene,brand,layer='front'})=>{
  const t=useCurrentFrame()/useVideoConfig().fps,elements=scene.elements??[];
  const asset=useAssets();
  const visible=(e:Element)=>interpolate(t,[e.enter,e.enter+.35],[0,1],clamp);
  return <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
    <svg width={1080} height={1920} style={{position:'absolute',inset:0}}>
      {scene.connections?.map((c,i)=>{
        const a=elements.find(e=>e.id===c.from)!,b=elements.find(e=>e.id===c.to)!;
        if((a.depth<0&&b.depth<0)!==(layer==='back'))return null;
        const ap=position(a,t),bp=position(b,t),p=interpolate(t,[c.enter,c.enter+.5],[0,1],clamp);
        return <line key={i} x1={ap.x+a.width/2} y1={ap.y+a.height/2} x2={bp.x+b.width/2} y2={bp.y+b.height/2}
          pathLength={1} strokeDasharray={1} strokeDashoffset={1-p} stroke={brand.primary} strokeWidth={4} opacity={Math.min(visible(a),visible(b),p)}/>;
      })}
    </svg>
    {elements.filter(e=>(e.depth<0)===(layer==='back')).sort((a,b)=>a.depth-b.depth).map(e=>{
      const p=visible(e),pos=position(e,t),screen=e.kind==='screen',label=e.kind==='label';
      return <div key={e.id} style={{position:'absolute',left:pos.x,top:pos.y+(1-p)*24,width:e.width,height:e.height,opacity:p,
        transform:`perspective(1400px) rotateY(${e.rotateY}deg) scale(${.96+.04*p})`,transformOrigin:'center',
        borderRadius:label?12:screen?30:22,overflow:'hidden',boxSizing:'border-box',
        padding:screen?8:label?10:20,background:label?'transparent':brand.background,border:label?'none':`1px solid ${brand.muted}66`,
        boxShadow:label?'none':`${8+e.depth}px 18px 40px #00000028`,display:'flex',flexDirection:'column',gap:12}}>
        {e.image&&<Img src={asset(e.image)} style={{width:'100%',flex:1,minHeight:0,objectFit:'contain',borderRadius:screen?22:12}}/>}
        {e.title&&<div style={{fontSize:label?38:30,lineHeight:1.12,fontWeight:800,color:brand.foreground,overflowWrap:'anywhere'}}>{e.title}</div>}
        {e.subtitle&&<div style={{fontSize:23,color:brand.muted,lineHeight:1.2}}>{e.subtitle}</div>}
      </div>;
    })}
  </div>;
};
