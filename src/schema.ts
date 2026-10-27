import {z} from 'zod';

const time = z.number().finite().nonnegative();
const relativeFile = z.string().min(1).refine(s => !s.includes('\\') && !s.startsWith('/') && !s.split('/').includes('..') && !/^[a-z]+:/i.test(s), 'Use caminho relativo dentro da pasta do trabalho.');
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
export const JobSchema = z.object({
  version: z.literal(1), name: z.string().min(1), video: relativeFile.default('entrada/video.mp4'),
  theme: z.string().min(1).optional(), revision: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/).default('r01'),
  rendering: z.object({type:z.literal('custom'),project:relativeFile,composition:z.string().min(1)}).optional(),
  language: z.string().regex(/^[a-z]{2}$/).default('pt'),
  fps: z.union([z.literal(30), z.literal(60)]).default(30),
  width: z.literal(1080).default(1080), height: z.literal(1920).default(1920),
  framing: z.object({x: z.number().min(0).max(100), y: z.number().min(0).max(100)}).default({x: 50, y: 45}),
  music: relativeFile.optional(), musicVolume:z.number().min(0).max(.15).default(.035),
  silence: z.object({thresholdDb: z.number().min(-70).max(-15), minimumSeconds: z.number().min(.3).max(5), paddingSeconds: z.number().min(.05).max(.5)}).default({thresholdDb: -35, minimumSeconds: .7, paddingSeconds: .18}),
});
export const BrandSchema = z.object({
  name: z.string().min(1), primary: color.default('#a4ff63'), background: color.default('#101419'),
  foreground: color.default('#f5f6f1'), muted: color.default('#aab1ba'),
  fontFamily: z.string().min(1).default('Arial'), fontFile: relativeFile.optional(), logo: relativeFile.optional(),
});
export const CutSchema = z.object({start: time, end: time}).refine(x => x.end > x.start, 'O fim deve ser maior que o início.');
export const CutsSchema = z.object({version: z.literal(1), sourceDuration: z.number().positive(),
  segments: z.array(CutSchema).min(1), note: z.string().optional(),
}).superRefine((data, ctx) => {
  data.segments.forEach((s, i) => {
    if (s.end > data.sourceDuration + .002) ctx.addIssue({code:'custom', message:'Corte fora da duração original.', path:['segments',i]});
    if (i && s.start < data.segments[i-1].end - .0001) ctx.addIssue({code:'custom', message:'Cortes devem estar ordenados e sem sobreposição.', path:['segments',i]});
  });
});
export const WordSchema = z.object({text: z.string().min(1), start: time, end: time, confidence: z.number().min(0).max(1).optional()}).refine(w => w.end > w.start);
export const TranscriptSchema = z.object({version: z.literal(1), language:z.string(), sourceSha256:z.string(), model:z.string(), words:z.array(WordSchema), timing:z.enum(['whisper-word','estimated']).default('whisper-word')});
const point = z.object({x:z.number().min(-1080).max(2160),y:z.number().min(-1920).max(3840)});
const element = z.object({
  id:z.string().min(1),kind:z.enum(['card','screen','label']).default('card'),
  title:z.string().max(95).optional(),subtitle:z.string().max(160).optional(),image:relativeFile.optional(),
  x:point.shape.x,y:point.shape.y,width:z.number().min(20).max(1080),height:z.number().min(20).max(1920),
  depth:z.number().min(-10).max(10).default(0),rotateY:z.number().min(-60).max(60).default(0),
  enter:time.default(0),keyframes:z.array(point.extend({time})).min(2).optional(),
});
export const GestureMapSchema=z.object({version:z.literal(1),sourceSha256:z.string(),timebase:z.literal('original'),
  gestures:z.array(z.object({start:time,end:time,speech:z.string(),gesture:z.string(),action:z.string(),evidence:z.string().optional()}).refine(g=>g.end>g.start))});
export const SceneSchema = z.object({
  id: z.string().min(1), start: time, end: time,
  type: z.enum(['headline','bullets','metric','comparison','quote','image','bars','composition']).default('headline'),
  title: z.string().min(1).max(95), subtitle: z.string().max(160).optional(),
  items: z.array(z.string().max(80)).max(4).optional(), value: z.string().max(30).optional(),
  bars: z.array(z.object({label:z.string().max(30), value:z.number().min(0).max(100)})).min(1).max(4).optional(),
  image: relativeFile.optional(), layout:z.enum(['card','full']).default('card'),
  emphasis:z.array(z.string()).default([]), zoom:z.number().min(1).max(1.2).default(1),
  illustration:z.boolean().default(false), sound:relativeFile.optional(), soundVolume:z.number().min(0).max(.25).default(.1),
  captionMode:z.enum(['show','hide']).optional(),
  captionSuppression:z.array(z.object({start:time,end:time}).refine(r=>r.end>r.start)).optional(),
  framing:z.object({x:z.number().min(0).max(100),y:z.number().min(0).max(100)}).optional(),
  zoomTo:z.number().min(1).max(2).optional(), presenter:z.enum(['show','hide']).optional(),
  viewport:z.object({x:z.number().min(0).max(1080),y:z.number().min(0).max(1920),width:z.number().positive().max(1080),height:z.number().positive().max(1920),radius:z.number().min(0).max(200).default(0)}).optional(),
  elements:z.array(element).max(20).optional(),
  connections:z.array(z.object({from:z.string(),to:z.string(),enter:time.default(0)})).max(30).optional(),
}).superRefine((s,ctx) => {
  if(s.end<=s.start) ctx.addIssue({code:'custom',message:'Cena com duração inválida.'});
  if(s.type==='image'&&!s.image) ctx.addIssue({code:'custom',message:'Cena image precisa do arquivo image.'});
  if(s.type==='metric'&&!s.value) ctx.addIssue({code:'custom',message:'Cena metric precisa de value.'});
  if(s.type==='bars'&&!s.bars) ctx.addIssue({code:'custom',message:'Cena bars precisa de bars.'});
  if(['bullets','comparison'].includes(s.type)&&!s.items?.length) ctx.addIssue({code:'custom',message:'Esta cena precisa de items.'});
  for(const r of s.captionSuppression??[])if(r.start<s.start||r.end>s.end)ctx.addIssue({code:'custom',message:'Supressão de legenda usa tempo editado dentro da cena.'});
  const ids=new Set<string>();
  for(const e of s.elements??[]){
    if(ids.has(e.id))ctx.addIssue({code:'custom',message:'ID de elemento repetido.'});ids.add(e.id);
    if(e.enter>=s.end-s.start)ctx.addIssue({code:'custom',message:'Entrada de elemento fora da cena.'});
    e.keyframes?.forEach((k,i)=>{if(k.time>s.end-s.start||(i>0&&k.time<=e.keyframes![i-1].time))ctx.addIssue({code:'custom',message:'Keyframes usam segundos locais crescentes dentro da cena.'});});
    if(e.kind==='screen'&&!e.image)ctx.addIssue({code:'custom',message:'Elemento screen precisa de image.'});
  }
  for(const c of s.connections??[])if(!ids.has(c.from)||!ids.has(c.to)||c.enter>=s.end-s.start)ctx.addIssue({code:'custom',message:'Conexão inválida: confira IDs e tempo local.'});
  if(s.type==='composition'&&!s.elements?.length)ctx.addIssue({code:'custom',message:'Composição precisa de elementos.'});
  if(s.viewport&&(s.viewport.x+s.viewport.width>1080||s.viewport.y+s.viewport.height>1920))ctx.addIssue({code:'custom',message:'Viewport fora do quadro.'});
});
export const ScenesSchema = z.object({version:z.literal(1), status:z.enum(['draft','reviewed']).default('draft'), scenes:z.array(SceneSchema).min(1)}).superRefine((d,c)=>{
  const ids = new Set<string>();
  d.scenes.forEach((s,i)=>{
    if(ids.has(s.id)) c.addIssue({code:'custom',message:'ID repetido.',path:['scenes',i]});
    ids.add(s.id);
    if(i&&s.start<d.scenes[i-1].end-.001)c.addIssue({code:'custom',message:'Cenas sobrepostas ou fora de ordem.',path:['scenes',i]});
  });
});
export type Job = z.infer<typeof JobSchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type Cuts = z.infer<typeof CutsSchema>;
export type Word = z.infer<typeof WordSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type RenderProps = {job:Job; brand:Brand; cuts:Cuts; scenes:Scene[]; words:Word[];assetHashes?:Record<string,string>};
