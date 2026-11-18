import React from 'react';
import {AbsoluteFill,Audio,Easing,Img,interpolate,OffthreadVideo,Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import type {Brand,RenderProps,Scene,Word} from './schema';
import {MotionElements} from './MotionElements';
import {AssetHashes,useAssets} from './assets';
import {StyleContext,useStyle} from './style-context';
import {captionsHidden,phraseGroups} from './styles';

function timing(cuts:RenderProps['cuts'],fps:number){let offset=0;return cuts.segments.map(s=>{const from=Math.round(offset*fps);offset+=s.end-s.start;return{from,duration:Math.round(offset*fps)-from,trim:Math.round(s.start*fps)};}).filter(s=>s.duration>0);}
const safe=(text:string)=>text.length>75?text.slice(0,72)+'…':text;
const ease=Easing.bezier(.16,1,.3,1);
function enter(frame:number,delay=0){return interpolate(frame-delay,[0,17],[0,1],{easing:ease,extrapolateLeft:'clamp',extrapolateRight:'clamp'});}

const Backdrop:React.FC<{brand:Brand}>=({brand})=>{
  const f=useCurrentFrame();
  const style=useStyle();
  if(style?.tokens.background==='soft-arcs')return <AbsoluteFill style={{background:brand.background,overflow:'hidden'}}>
    <div style={{position:'absolute',width:1300,height:1300,left:480,top:-780,border:`1px solid ${brand.primary}25`,borderRadius:'50%',transform:`translateY(${Math.sin(f/100)*10}px)`}}/>
    <div style={{position:'absolute',left:-400,bottom:-440,width:950,height:950,borderRadius:'50%',background:`radial-gradient(circle,${brand.primary}20,transparent 66%)`}}/>
  </AbsoluteFill>;
  return <AbsoluteFill style={{background:brand.background,overflow:'hidden'}}>
    <div style={{position:'absolute',width:950,height:950,left:260+Math.sin(f/100)*35,top:-400,borderRadius:'50%',background:`radial-gradient(circle,${brand.primary}22, transparent 65%)`}}/>
    <div style={{position:'absolute',inset:0,opacity:.12,backgroundImage:`linear-gradient(${brand.muted}44 1px,transparent 1px),linear-gradient(90deg,${brand.muted}44 1px,transparent 1px)`,backgroundSize:'80px 80px',transform:`translateY(${f*.08}px)`}}/>
  </AbsoluteFill>;
};
const Graphics:React.FC<{scene:Scene;brand:Brand}>=({scene,brand})=>{
  const f=useCurrentFrame(),{fps}=useVideoConfig();
  const asset=useAssets();
  const style=useStyle(),typography=style?.tokens.typography;
  const p=scene.start===0?1:style?interpolate(f,[0,style.tokens.motion.entrySeconds*fps],[0,1],{easing:Easing.bezier(...style.tokens.motion.easing),extrapolateLeft:'clamp',extrapolateRight:'clamp'}):enter(f);
  if(scene.lettering)return null;
  if(scene.type==='composition')return <MotionElements scene={scene} brand={brand}/>;
  const titleSize=(scene.title.length>65?.68:scene.title.length>40?.8:1)*(typography?.headingSize??78);
  const stagger=(i:number)=>({opacity:enter(f,i*3),transform:`translateY(${(1-enter(f,i*3))*35}px)`});
  return <div style={{position:'absolute',left:90,right:150,top:245,height:535,display:'flex',flexDirection:'column',justifyContent:'center',gap:24,opacity:p,transform:`translateY(${(1-p)*28}px) scale(${.97+.03*p})`}}>
    {(!style||scene.branding==='show')&&<div style={{fontSize:23,color:brand.primary,fontWeight:700,letterSpacing:4,textTransform:'uppercase'}}> {scene.type==='quote'?'Uma ideia para guardar':brand.name}</div>}
    <div style={{fontSize:titleSize,lineHeight:1.06,fontWeight:typography?.headingWeight??900,letterSpacing:typography?.letterSpacing??-2,color:style?brand.primary:brand.foreground,overflowWrap:'anywhere'}}>{scene.title}</div>
    {scene.subtitle&&<div style={{fontSize:30,lineHeight:1.3,color:brand.muted}}>{scene.subtitle}</div>}
    {scene.type==='metric'&&<div style={{fontSize:126,fontWeight:900,color:brand.primary,letterSpacing:-5,transform:`scale(${.92+.08*enter(f,5)})`,transformOrigin:'left'}}>{scene.value}</div>}
    {scene.type==='bullets'&&<div style={{display:'flex',flexDirection:'column',gap:15}}>{scene.items?.map((item,i)=><div key={i} style={{...stagger(i+2),display:'flex',gap:20,alignItems:'center',fontSize:33,fontWeight:700}}><span style={{width:12,height:12,borderRadius:'50%',background:brand.primary,flexShrink:0}}/>{safe(item)}</div>)}</div>}
    {scene.type==='comparison'&&<div style={{display:'flex',gap:18}}>{scene.items?.slice(0,2).map((item,i)=><div key={i} style={{...stagger(i+2),flex:1,padding:24,border:`1px solid ${brand.primary}${i?'88':'33'}`,borderRadius:24,background:i?brand.primary+'18':'#ffffff08',fontSize:34,fontWeight:700}}>{safe(item)}</div>)}</div>}
    {scene.type==='quote'&&<div style={{width:100,height:6,borderRadius:3,background:brand.primary,transform:`scaleX(${enter(f,5)})`,transformOrigin:'left'}}/>}
    {scene.type==='bars'&&<div style={{display:'flex',flexDirection:'column',gap:12}}>{scene.bars?.map((b,i)=><div key={i} style={{...stagger(i+2),fontSize:25}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span>{b.label}</span><span>{b.value}%</span></div><div style={{height:18,borderRadius:9,background:'#ffffff14'}}><div style={{height:'100%',borderRadius:9,width:`${b.value*enter(f,5+i*3)}%`,background:brand.primary}}/></div></div>)}</div>}
    {scene.type==='image'&&scene.image&&<Img src={asset(scene.image)} style={{width:'100%',height:285,objectFit:'contain',borderRadius:22}}/>}
    {scene.illustration&&<div style={{fontSize:19,color:brand.muted,letterSpacing:2,textTransform:'uppercase'}}>Ilustração / demonstração</div>}
  </div>;
};
const Captions:React.FC<{words:Word[];brand:Brand;scenes:Scene[]}>=({words,brand,scenes})=>{
  const f=useCurrentFrame(),{fps}=useVideoConfig(),t=f/fps;
  const scene=scenes.find(s=>s.start<=t&&s.end>t);
  const style=useStyle();
  if(captionsHidden(scene,t))return null;
  if(style&&scene){
    const settings=style.tokens.captions,group=phraseGroups(words,scene,settings).find(g=>t>=g.start&&t<g.end);
    if(!group)return null;
    return <div style={{position:'absolute',top:settings.top,left:style.tokens.safeArea.left,right:style.tokens.safeArea.right,display:'flex',justifyContent:'center'}}>
      <div style={{padding:'16px 24px 20px',borderRadius:19,background:settings.background+'f0',color:settings.foreground,fontSize:settings.fontSize,fontWeight:settings.fontWeight,lineHeight:1.2,textAlign:'center',maxWidth:'100%',overflowWrap:'anywhere'}}>
        {group.words.filter(w=>settings.grouping==='phrase'||w.start<=t).map((w,i)=><React.Fragment key={w.start+'-'+i}><span style={{borderBottom:settings.activeMark==='underline'&&t>=w.start&&t<w.end?`3px solid ${brand.primary}`:'3px solid transparent',color:settings.activeMark==='color'&&t>=w.start&&t<w.end?brand.primary:settings.foreground}}>{w.text}</span>{i<group.words.length-1?' ':''}</React.Fragment>)}
      </div>
    </div>;
  }
  const current=words.findIndex(w=>w.start<=t&&w.end>t);
  if(current<0)return null;
  // Grupos com no máximo três palavras, cortados também por pausas e largura.
  let start=current;while(start>0&&current-start<2&&words[start].start-words[start-1].end<.35&&words.slice(start-1,current+1).map(w=>w.text).join(' ').length<30)start--;
  const group=words.slice(start,current+1);
  return <div style={{position:'absolute',top:1360,left:90,right:150,display:'flex',justifyContent:'center'}}>
    <div style={{padding:'15px 22px',borderRadius:18,background:'#080b10ee',boxShadow:'0 12px 35px #0007',fontSize:53,lineHeight:1.12,fontWeight:900,textAlign:'center',maxWidth:'100%',overflowWrap:'anywhere'}}>
      {group.map((w,i)=><React.Fragment key={`${w.start}-${i}`}><span style={{color:start+i===current||scene?.emphasis.some(e=>e.toLowerCase()===w.text.toLowerCase())?brand.primary:brand.foreground}}>{w.text}</span>{i<group.length-1?' ':''}</React.Fragment>)}
    </div>
  </div>;
};
const Lettering:React.FC<{scene:Scene;brand:Brand}>=({scene,brand})=>{
  const style=useStyle(),t=useCurrentFrame()/useVideoConfig().fps,l=scene.lettering!;
  const drift=interpolate(t,[0,scene.end-scene.start],[l.drift,-l.drift],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <div style={{position:'absolute',left:20,top:l.top,width:1040,textAlign:'center',fontSize:l.size,fontWeight:style?.tokens.typography.letteringWeight??750,lineHeight:1,letterSpacing:-4,color:l.outline?'transparent':brand.primary,WebkitTextStroke:l.outline?`3.5px ${brand.primary}`:undefined,transform:`translateX(${drift}px)`,overflowWrap:'anywhere'}}>{l.text}</div>;
};
const BrandLogo:React.FC<{scene:Scene;brand:Brand}>=({scene,brand})=>{
  const style=useStyle(),asset=useAssets(),t=useCurrentFrame()/useVideoConfig().fps;
  if(!brand.logo||scene.branding==='hide'||style?.tokens.logo.sceneControlled&&!scene.branding)return null;
  const settings=style?.tokens.logo,p=scene.branding==='reveal'?interpolate(t-scene.start,[.7,1.7],[0,1],{easing:Easing.bezier(.18,.85,.2,1),extrapolateLeft:'clamp',extrapolateRight:'clamp'}):1;
  const target=settings?.width??170,w=scene.branding==='reveal'?800+(target-800)*p:target,top=scene.branding==='reveal'?800+((settings?.top??130)-800)*p:settings?.top??130;
  return <Img src={asset(brand.logo)} style={{position:'absolute',left:settings?.placement==='top-center'||scene.branding==='reveal'?(1080-w)/2:90,top,width:w,height:w*.22,objectFit:'contain'}}/>;
};
const VideoContent:React.FC<RenderProps>=({job,brand,cuts,scenes,words})=>{
  const f=useCurrentFrame(),{fps}=useVideoConfig(),t=f/fps;
  const asset=useAssets();
  const style=useStyle();
  const scene=scenes.find(s=>s.start<=t&&s.end>t)??scenes.at(-1)!;
  const full=scene.layout==='full';
  const local=(t-scene.start)/(scene.end-scene.start);
  const zoom=scene.zoomTo===undefined?1+(scene.zoom-1)*Math.max(0,Math.min(1,local)):scene.zoom+(scene.zoomTo-scene.zoom)*Math.max(0,Math.min(1,local));
  const framing=scene.framing??job.framing,v=scene.viewport;
  const segments=timing(cuts,fps);
  return <AbsoluteFill style={{fontFamily:brand.fontFamily,color:brand.foreground,overflow:'hidden'}}>
    {brand.fontFile&&<style>{`@font-face{font-family:${JSON.stringify(brand.fontFamily)};src:url(${JSON.stringify(asset(brand.fontFile))});font-weight:100 900}`}</style>}
    <Backdrop brand={brand}/>
    {job.music&&<Audio src={asset(job.music)} volume={job.musicVolume} loop/>}
    {scenes.filter(s=>s.lettering).map(s=><Sequence key={'letter-'+s.id} from={Math.round(s.start*fps)} durationInFrames={Math.max(1,Math.round(s.end*fps)-Math.round(s.start*fps))}><Lettering scene={s} brand={brand}/></Sequence>)}
    {scenes.filter(s=>s.elements).map(s=><Sequence key={'back-'+s.id} from={Math.round(s.start*fps)} durationInFrames={Math.max(1,Math.round(s.end*fps)-Math.round(s.start*fps))}><MotionElements scene={s} brand={brand} layer="back"/></Sequence>)}
    <div style={{position:'absolute',left:v?.x??(full?0:90),right:v?undefined:full?0:150,width:v?.width,top:v?.y??(full?0:825),height:v?.height??(full?1920:485),borderRadius:v?.radius??style?.tokens.presenter.radius??(full?0:36),overflow:'hidden',opacity:scene.presenter==='hide'?0:1,boxShadow:full?'none':'0 22px 65px #0008',border:full?'none':'1px solid #ffffff22'}}>
      {segments.map((s,i)=><Sequence key={i} from={s.from} durationInFrames={s.duration} layout="none">
        <OffthreadVideo src={asset(job.video)} trimBefore={s.trim} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:`${framing.x}% ${framing.y}%`,transformOrigin:`${framing.x}% ${framing.y}%`,transform:`scale(${zoom})`}} volume={.95}/>
      </Sequence>)}
    </div>
    {style?.tokens.presenter.supportLine&&scene.presenter!=='hide'&&<div style={{position:'absolute',left:v?.x??90,top:(v?.y??(full?0:825))+(v?.height??(full?1920:485)),width:v?.width??840,height:2,background:brand.muted+'66'}}/>}
    {!style&&full&&<AbsoluteFill style={{background:'linear-gradient(180deg,#080c10f0 0%,#080c10ba 39%,#080c1018 68%,#080c10aa 100%)'}}/>}
    <BrandLogo scene={scene} brand={brand}/>
    {scenes.map(s=><Sequence key={s.id} from={Math.round(s.start*fps)} durationInFrames={Math.max(1,Math.round(s.end*fps)-Math.round(s.start*fps))}>
      <Graphics scene={s} brand={brand}/>
      {s.type!=='composition'&&s.elements&&<MotionElements scene={s} brand={brand}/>}
      {s.sound&&<Audio src={asset(s.sound)} volume={s.soundVolume}/>}
    </Sequence>)}
    <Captions words={words} brand={brand} scenes={scenes}/>
    {!style&&<div style={{position:'absolute',left:90,right:150,top:1502,height:3,background:'#ffffff18'}}><div style={{height:'100%',width:`${100*f/Math.max(1,Math.round(cuts.segments.reduce((n,s)=>n+s.end-s.start,0)*fps)-1)}%`,background:brand.primary}}/></div>}
  </AbsoluteFill>;
};
export const Video:React.FC<RenderProps>=props=><AssetHashes.Provider value={props.assetHashes??{}}><StyleContext.Provider value={props.style}><VideoContent {...props}/></StyleContext.Provider></AssetHashes.Provider>;
