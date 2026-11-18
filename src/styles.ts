import {z} from 'zod';
import type {Scene,Word} from './schema';

export const StyleRefSchema=z.object({id:z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),version:z.string().regex(/^\d+\.\d+\.\d+$/),sha256:z.string().regex(/^[a-f0-9]{64}$/)});
const color=z.string().regex(/^#[a-f0-9]{6}$/i);
export const StyleProfileSchema=z.object({
  schemaVersion:z.literal(1),id:StyleRefSchema.shape.id,version:StyleRefSchema.shape.version,name:z.string().min(1),
  reference:z.object({label:z.string(),revision:z.string(),approvalScope:z.enum(['reference-production-only','draft-style','reviewed-style'])}),
  brand:z.object({name:z.string(),primary:color,background:color,foreground:color,muted:color,fontFamily:z.string()}),
  tokens:z.object({
    background:z.enum(['grid','soft-arcs']),
    safeArea:z.object({left:z.number().min(0).max(300),right:z.number().min(0).max(300),top:z.number().min(0).max(600),bottom:z.number().min(0).max(600)}),
    typography:z.object({headingSize:z.number().min(32).max(110),headingWeight:z.number().min(100).max(900),letteringWeight:z.number().min(100).max(900),letterSpacing:z.number().min(-8).max(5)}),
    motion:z.object({entrySeconds:z.number().min(.05).max(2),exitSeconds:z.number().min(.05).max(2),easing:z.tuple([z.number().min(0).max(1),z.number(),z.number().min(0).max(1),z.number()]),maxRotateY:z.number().min(0).max(45),driftPixels:z.number().min(0).max(100)}),
    cards:z.object({radius:z.number().min(0).max(60),surface:color,border:color,shadow:color,padding:z.number().min(0).max(50)}),
    captions:z.object({grouping:z.enum(['phrase','progressive']),maxWords:z.number().int().min(1).max(10),maxCharacters:z.number().int().min(12).max(70),maxSeconds:z.number().min(.5).max(5),gapSeconds:z.number().min(.05).max(1),top:z.number().min(200).max(1600),fontSize:z.number().min(28).max(60),fontWeight:z.number().min(100).max(900),background:color,foreground:color,activeMark:z.enum(['underline','color'])}),
    logo:z.object({placement:z.enum(['top-center','top-left']),width:z.number().min(100).max(600),top:z.number().min(0).max(400),sceneControlled:z.boolean()}),
    presenter:z.object({radius:z.number().min(0).max(60),supportLine:z.boolean()}),
  }),
  rules:z.array(z.object({id:z.string(),instruction:z.string(),scope:z.enum(['style','per-production'])})).min(1),
  recipes:z.array(z.object({id:z.string(),purpose:z.string(),parameters:z.array(z.string())})).min(1),
}).strict().superRefine((s,c)=>{
  if(s.tokens.captions.top<s.tokens.safeArea.top||s.tokens.captions.top+160>1920-s.tokens.safeArea.bottom)c.addIssue({code:'custom',message:'Legendas precisam caber na área segura, incluindo até duas linhas.'});
});
export type StyleProfile=z.infer<typeof StyleProfileSchema>;

export function captionsHidden(scene:Scene|undefined,t:number){return scene?.captionMode==='hide'||!!scene?.captionSuppression?.some(r=>t>=r.start&&t<r.end);}
export function phraseGroups(words:Word[],scene:Scene,settings:StyleProfile['tokens']['captions']){
  const groups:Array<{start:number;end:number;words:Word[]}>=[];
  for(const w of words){
    if(w.start>=scene.end||w.end<=scene.start)continue;
    const word={...w,start:Math.max(w.start,scene.start),end:Math.min(w.end,scene.end)},previous=groups.at(-1);
    const split=!previous||previous.words.length>=settings.maxWords||word.start-previous.end>settings.gapSeconds||word.end-previous.start>settings.maxSeconds||[...previous.words.map(w=>w.text),word.text].join(' ').length>settings.maxCharacters||/[.!?;:]$/.test(previous.words.at(-1)!.text);
    if(split)groups.push({start:word.start,end:word.end,words:[word]});
    else{previous.words.push(word);previous.end=word.end;}
  }
  return groups;
}
