import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {JobSchema,BrandSchema,type RenderProps} from './schema';

const defaults:RenderProps={
  job:JobSchema.parse({version:1,name:'Selecione um trabalho'}),
  brand:BrandSchema.parse({name:'9D'}),
  cuts:{version:1,sourceDuration:3,segments:[{start:0,end:3}]},
  scenes:[{id:'inicio',start:0,end:3,type:'headline',title:'Cinema 9D Edição',layout:'full',emphasis:[],zoom:1,illustration:false,soundVolume:.1}],words:[],
};
export const Root:React.FC=()=> <Composition id="Cinema9DEdicao" component={Video}
  width={1080} height={1920} fps={30} durationInFrames={90} defaultProps={defaults}
  calculateMetadata={({props})=>({width:props.job.width,height:props.job.height,fps:props.job.fps,
    durationInFrames:Math.max(1,Math.round(props.cuts.segments.reduce((n,s)=>n+s.end-s.start,0)*props.job.fps))})}/>;
