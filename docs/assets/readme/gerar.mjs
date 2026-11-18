// Gera os painéis SVG do README a partir das artes em ./arte/*.jpg.
// Uso: node docs/assets/readme/gerar.mjs
// As artes de fundo foram geradas por IA (imgpt / Codex) e são ilustrações: não mostram telas reais do método.
// Textos e diagramas são vetores escritos aqui. Sem scripts e sem fontes externas; a animação é CSS e para com
// prefers-reduced-motion.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const art = name => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(dir, 'arte', name + '.jpg')).toString('base64');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const C = {bg: '#0b0e12', ink: '#f5f6f1', muted: '#aab1ba', dim: '#7b8590', line: 'rgba(255,255,255,0.12)',
  lime: '#a4ff63', cyan: '#7cc7ff', peach: '#ff9e7a', card: 'rgba(10,13,17,0.80)'};
const ROLE = {VOCÊ: C.peach, AGENTE: C.lime, AUTO: C.cyan};
const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";
const LOGO = fs.readFileSync(path.join(dir, 'logo-9d.svg'), 'utf8').match(/ d="([^"]+)"/)[1];

const css = `
.eb{font:600 16px ${MONO};letter-spacing:3px;fill:${C.lime}}
.t{font:700 60px ${SANS};letter-spacing:-1.2px;fill:${C.ink}}
.s{font:400 22px ${SANS};fill:${C.muted}}
.m{font:500 14px ${MONO};letter-spacing:2px;fill:${C.muted}}
.ms{font:500 12px ${MONO};letter-spacing:1.5px;fill:${C.dim}}
.ct{font:700 25px ${SANS};fill:${C.ink}}
.cd{font:400 15px ${SANS};fill:#c3c9d0}
.cm{font:500 14px ${MONO};fill:${C.lime}}
.cn{font:500 13px ${MONO};letter-spacing:1px;fill:${C.dim}}
.chip{font:600 11px ${MONO};letter-spacing:1.5px}
.pulse{animation:pulse 2.4s ease-in-out infinite}
.run{animation:run 7s linear infinite}
.flow{stroke-dasharray:6 9;animation:flow 1.1s linear infinite}
.grow{transform-origin:64px 0;animation:grow 3.5s ease-out infinite alternate}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes run{from{transform:translateX(0)}to{transform:translateX(1472px)}}
@keyframes flow{to{stroke-dashoffset:-15}}
@keyframes grow{from{transform:scaleX(.25)}to{transform:scaleX(1)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

function panel({file, w = 1600, h, image, title, desc, body, artX = 0, artW = w, fade = 'full', rx = 28}) {
  const fades = fade === 'full'
    ? `<rect width="${w}" height="${h}" fill="url(#fx)"/><rect width="${w}" height="${h}" fill="url(#fy)"/>`
    : `<rect width="${w}" height="${h}" fill="url(#fs)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<defs>
<style>${css}</style>
<clipPath id="r"><rect width="${w}" height="${h}" rx="${rx}"/></clipPath>
<linearGradient id="fx" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${C.bg}" stop-opacity=".94"/><stop offset=".5" stop-color="${C.bg}" stop-opacity=".6"/><stop offset="1" stop-color="${C.bg}" stop-opacity=".3"/></linearGradient>
<linearGradient id="fy" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${C.bg}" stop-opacity=".85"/><stop offset=".42" stop-color="${C.bg}" stop-opacity="0"/><stop offset=".85" stop-color="${C.bg}" stop-opacity=".2"/><stop offset="1" stop-color="${C.bg}" stop-opacity=".75"/></linearGradient>
<linearGradient id="fs" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${C.bg}"/><stop offset=".42" stop-color="${C.bg}"/><stop offset=".62" stop-color="${C.bg}" stop-opacity=".35"/><stop offset="1" stop-color="${C.bg}" stop-opacity=".15"/></linearGradient>
<marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.muted}"/></marker>
<marker id="ap" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.peach}"/></marker>
</defs>
<g clip-path="url(#r)">
<rect width="${w}" height="${h}" fill="${C.bg}"/>
<image href="${art(image)}" x="${artX}" y="0" width="${artW}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
${fades}
${body}
</g>
${rx ? `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${rx}" fill="none" stroke="${C.line}"/>` : ''}
</svg>
`;
  fs.writeFileSync(path.join(dir, file), svg);
}

const head = (eb, t, s) => `<text class="eb" x="64" y="80">${esc(eb)}</text>
<text class="t" x="64" y="148">${esc(t)}</text>
${s ? `<text class="s" x="64" y="190">${esc(s)}</text>` : ''}`;
const card = (x, y, w, h, stroke = C.line) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${C.card}" stroke="${stroke}"/>`;
const chip = (xr, y, role) => {
  const label = role === 'AUTO' ? 'AUTOMÁTICO' : role, cw = label.length * 8 + 18;
  return `<rect x="${xr - cw}" y="${y}" width="${cw}" height="22" rx="11" fill="none" stroke="${ROLE[role]}" stroke-opacity=".7"/><text class="chip" x="${xr - cw / 2}" y="${y + 15}" text-anchor="middle" fill="${ROLE[role]}">${label}</text>`;
};
const legend = (x, y) => [['VOCÊ', C.peach], ['AGENTE (CODEX OU CLAUDE CODE)', C.lime], ['AUTOMÁTICO (SCRIPTS LOCAIS)', C.cyan]]
  .map(([l, c], i) => { const xx = x + [0, 120, 470][i]; return `<circle cx="${xx + 5}" cy="${y - 5}" r="5" fill="${c}"/><text class="m" x="${xx + 18}" y="${y}">${l}</text>`; }).join('');

// ---------- HERO ----------
panel({file: 'hero.svg', h: 680, image: 'hero',
  title: 'Cinema 9D Edição',
  desc: 'Cinema 9D Edição: sua gravação de fala vira vídeo vertical editado, com cortes, legendas e motion, usando Codex ou Claude Code e ferramentas locais (Whisper, Remotion, FFmpeg). Ilustração de uma mesa de edição à noite.',
  body: `<g transform="translate(64 40) scale(.25)"><path d="${LOGO}" fill="${C.ink}"/></g>
<text class="m" x="128" y="66" fill="${C.ink}">CINEMA 9D <tspan fill="${C.dim}">/</tspan> EDIÇÃO</text>
<circle class="pulse" cx="1262" cy="61" r="6" fill="${C.peach}"/><text class="m" x="1276" y="66" fill="${C.peach}">REC</text>
<text class="m" x="1536" y="66" text-anchor="end">CODEX · CLAUDE CODE</text>
<line x1="64" y1="104" x2="1536" y2="104" stroke="${C.line}"/>
<line class="grow" x1="64" y1="104" x2="260" y2="104" stroke="${C.lime}" stroke-width="2"/>
<text class="eb" x="64" y="196" style="font-size:18px">SUA GRAVAÇÃO. SEU AGENTE. SEU COMPUTADOR.</text>
<text x="58" y="326" style="font:800 128px ${SANS};letter-spacing:-4px;fill:${C.ink}">CINEMA 9D</text>
<text x="58" y="446" style="font:800 128px ${SANS};letter-spacing:-4px;fill:${C.lime}">EDIÇÃO</text>
<text class="s" x="64" y="510" style="font-size:25px;fill:#d5dae0">Fala gravada vira vídeo vertical editado:</text>
<text class="s" x="64" y="544" style="font-size:25px;fill:#d5dae0">cortes, legendas e motion, com a sua aprovação.</text>
<line x1="64" y1="598" x2="1536" y2="598" stroke="${C.line}"/>
<text class="m" x="64" y="638">CORTES</text><text class="m" x="200" y="638">LEGENDAS</text><text class="m" x="364" y="638">MOTION</text><text class="m" x="496" y="638">APROVAÇÃO</text>
<text class="m" x="1536" y="638" text-anchor="end" fill="${C.lime}">WHISPER LOCAL · REMOTION · FFMPEG</text>`});

// ---------- 01 FLUXO ----------
const steps = [
  ['GRAVAR', 'VOCÊ', 'vídeo, marca e briefing', 'iniciar'],
  ['PREPARAR', 'AUTO', 'transcrição e cortes', 'preparar'],
  ['DIRIGIR', 'AGENTE', 'cortes, cenas e telas', 'planejar'],
  ['PRÉVIA', 'AUTO', 'MP4 540×960', 'previa'],
  ['APROVAR', 'VOCÊ', 'você assiste e dá o OK', 'aprovar'],
  ['FINAL', 'AUTO', 'MP4 1080×1920', 'final'],
];
const SX = i => 64 + i * 250, SY = 262, SW = 222, SH = 146;
panel({file: 'fluxo.svg', h: 560, image: 'fluxo',
  title: 'Da gravação ao vídeo final',
  desc: 'Fluxo em seis etapas: 1 gravar (você: vídeo, marca e briefing, comando iniciar); 2 preparar (automático: transcrição local e proposta de cortes, comando preparar); 3 dirigir (agente: cortes, cenas e telas, comando planejar); 4 prévia (automático: MP4 540×960, comando previa); 5 aprovar (você assiste e dá o OK, comando aprovar); 6 final (automático: MP4 1080×1920, comando final). Uma seta tracejada leva os ajustes da aprovação de volta à direção: qualquer mudança exige nova prévia e nova aprovação.',
  body: `${head('01 / FLUXO', 'Da gravação ao vídeo final.', 'O agente dirige, os scripts executam e nada é exportado sem o seu OK.')}
<line x1="64" y1="240" x2="1536" y2="240" stroke="${C.line}"/>
<circle class="run" cx="64" cy="240" r="4" fill="${C.lime}"/>
${steps.map(([t, role, d, cmd], i) => {
    const x = SX(i);
    return `${card(x, SY, SW, SH, i === 4 ? 'rgba(255,158,122,.45)' : C.line)}
<text class="cn" x="${x + 20}" y="${SY + 34}">0${i + 1}</text>${chip(x + SW - 16, SY + 18, role)}
<text class="ct" x="${x + 20}" y="${SY + 76}">${t}</text>
<text class="cd" x="${x + 20}" y="${SY + 102}">${esc(d)}</text>
<text class="cm" x="${x + 20}" y="${SY + 128}" fill="${ROLE[role]}">${cmd}</text>
${i < 5 ? `<line x1="${x + SW + 3}" y1="${SY + SH / 2}" x2="${x + 247}" y2="${SY + SH / 2}" stroke="${C.muted}" stroke-width="1.5" marker-end="url(#a)"/>` : ''}`;
  }).join('\n')}
<path class="flow" d="M${SX(4) + SW / 2} ${SY + SH + 2} V ${SY + SH + 34} H ${SX(2) + SW / 2} V ${SY + SH + 8}" fill="none" stroke="${C.peach}" stroke-width="1.6" marker-end="url(#ap)"/>
<text class="cn" x="${(SX(2) + SX(4)) / 2 + SW / 2}" y="${SY + SH + 60}" text-anchor="middle" fill="${C.peach}">AJUSTE → VOLTA À DIREÇÃO · NOVA PRÉVIA · NOVA APROVAÇÃO</text>
${legend(64, 528)}`});

// ---------- 02 ESTRUTURA ----------
const prods = ['A', 'B', 'C'];
const PX = i => 650 + i * 316, PY = 262, PW = 270, PH = 228;
const rows = [['entrada/', 'gravação, só leitura'], ['marca/', 'logo, cores e fonte'], ['edicao/', 'cortes, cenas, OK'], ['saida/', 'prévias e finais']];
panel({file: 'estrutura.svg', h: 560, image: 'estrutura',
  title: 'Um método, produções independentes',
  desc: 'Estrutura: à esquerda, a instalação central do método em ~/projetos/cinema-9d-edicao, clonada uma vez, com bin/cinema-edicao, scripts, src (Remotion), skills, styles e docs. Abaixo dela, a biblioteca local opcional com estilos e kits, fora do Git. O método opera cada produção pelo caminho absoluto. À direita, três produções independentes (A, B e C), em qualquer pasta, cada uma com entrada (gravação original, só leitura), marca, edicao e saida. Ilustração de um cubo central ligado a caixas separadas.',
  body: `${head('02 / ESTRUTURA', 'Um método. Várias produções.', 'O repositório guarda a receita. Cada vídeo vive na sua própria pasta.')}
${card(64, PY, 470, 168, 'rgba(164,255,99,.45)')}
<text class="cn" x="88" y="${PY + 34}" fill="${C.lime}">MÉTODO · CLONADO UMA VEZ</text>
<text x="88" y="${PY + 74}" style="font:700 21px ${MONO};fill:${C.ink}">~/projetos/cinema-9d-edicao</text>
<text class="cd" x="88" y="${PY + 110}">bin/cinema-edicao · scripts · src (Remotion)</text>
<text class="cd" x="88" y="${PY + 136}">skills · styles · docs</text>
<rect x="64" y="${PY + 184}" width="470" height="44" rx="22" fill="${C.card}" stroke="${C.muted}" stroke-opacity=".5" stroke-dasharray="5 6"/>
<text class="cn" x="88" y="${PY + 211}">BIBLIOTECA LOCAL · ESTILOS E KITS · FORA DO GIT</text>
<path class="flow" d="M536 ${PY + 84} H 600 V 236 H ${PX(2) + PW / 2}" fill="none" stroke="${C.lime}" stroke-width="1.6"/>
<text class="ms" x="616" y="226" fill="${C.lime}">O MÉTODO OPERA CADA PRODUÇÃO PELO CAMINHO ABSOLUTO</text>
${prods.map((p, i) => {
    const x = PX(i);
    return `<line x1="${x + PW / 2}" y1="236" x2="${x + PW / 2}" y2="${PY - 2}" stroke="${C.lime}" stroke-width="1.6" marker-end="url(#a)"/>
<circle class="pulse" cx="${x + PW / 2}" cy="236" r="4" fill="${C.lime}" style="animation-delay:${i * .5}s"/>
${card(x, PY, PW, PH)}
<text class="cn" x="${x + 20}" y="${PY + 34}" fill="${C.cyan}">PRODUÇÃO ${p}</text>
<text class="ct" x="${x + 20}" y="${PY + 68}" style="font-size:21px">qualquer pasta</text>
${rows.map(([n, d], j) => `<text class="cm" x="${x + 20}" y="${PY + 108 + j * 31}" fill="${C.ink}">${n}</text><text class="cd" x="${x + 104}" y="${PY + 108 + j * 31}" style="font-size:14px">${esc(d)}</text>`).join('')}`;
  }).join('\n')}
<text class="m" x="64" y="534">ORIGINAIS INTOCADOS / NADA SE MISTURA / CADA PRODUÇÃO GUARDA SUA CÓPIA DO ESTILO</text>`});

// ---------- 03 ESTILOS ----------
const phone = (x, y, v, k) => {
  const w = 100, h = 178;
  const inner = [
    `<rect x="${x + 12}" y="${y + 22}" width="60" height="8" rx="4" fill="${C.ink}" opacity=".9"/><rect x="${x + 12}" y="${y + 46}" width="76" height="64" rx="8" fill="${C.lime}" opacity=".85"/>`,
    `<circle cx="${x + 50}" cy="${y + 66}" r="30" fill="none" stroke="${C.lime}" stroke-width="3"/><rect x="${x + 22}" y="${y + 24}" width="56" height="8" rx="4" fill="${C.ink}" opacity=".9"/>`,
    `<rect x="${x + 12}" y="${y + 24}" width="34" height="44" rx="6" fill="${C.muted}" opacity=".7"/><rect x="${x + 54}" y="${y + 24}" width="34" height="44" rx="6" fill="${C.lime}" opacity=".85"/><rect x="${x + 12}" y="${y + 78}" width="76" height="32" rx="6" fill="${C.ink}" opacity=".25"/>`,
  ][k];
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="rgba(10,13,17,.88)" stroke="${C.muted}" stroke-opacity=".55"/>${inner}
<rect x="${x + 12}" y="${y + 130}" width="76" height="20" rx="6" fill="#080b10" stroke="${C.lime}" stroke-opacity=".5"/><rect x="${x + 20}" y="${y + 138}" width="${[44, 52, 36][k]}" height="4" rx="2" fill="${C.ink}"/>
<text class="cn" x="${x + w / 2}" y="${y + h + 26}" text-anchor="middle" fill="${C.ink}">${v}</text>`;
};
panel({file: 'estilos.svg', h: 560, image: 'estilos',
  title: 'Estilos e várias versões',
  desc: 'Estilos e lotes: um perfil de estilo versionado (minha-marca 1.0.0) guarda cores, fonte, legendas, cards e movimento, e é fixado por SHA-256 em cada produção. O comando produzir --versoes 3 cria um lote em que o agente dirige cada versão com diferenças reais. As versões v01, v02 e v03 aparecem lado a lado numa galeria local, e você escolhe; aprovar-lote e finalizar-lote só rodam com o seu OK. Ilustração de cartões de design sobre uma mesa escura.',
  body: `${head('03 / ESTILOS E LOTES', 'Seu estilo, em várias versões.', 'Um perfil versionado guarda a identidade. O agente cria versões com diferenças reais.')}
${card(64, 262, 360, 200)}
<text class="cn" x="88" y="296" fill="${C.lime}">PERFIL DE ESTILO</text>
<text x="88" y="332" style="font:700 20px ${MONO};fill:${C.ink}">minha-marca · 1.0.0</text>
${[C.lime, '#101419', C.ink, C.muted].map((c, i) => `<circle cx="${104 + i * 44}" cy="372" r="16" fill="${c}" stroke="${C.line}"/>`).join('')}
<text class="cd" x="88" y="418" style="font-size:14px">cores · fonte · legendas · cards · movimento</text>
<text class="ms" x="88" y="444" fill="${C.lime}">FIXADO POR SHA-256 NA PRODUÇÃO</text>
<line x1="428" y1="362" x2="466" y2="362" stroke="${C.muted}" stroke-width="1.5" marker-end="url(#a)"/>
${card(470, 262, 330, 200)}
<text class="cn" x="494" y="296" fill="${C.lime}">LOTE</text>
<text x="494" y="332" style="font:700 20px ${MONO};fill:${C.ink}">produzir --versoes 3</text>
<text class="cd" x="494" y="372">o agente dirige cada versão</text>
<text class="cd" x="494" y="396">com diferenças editoriais reais</text>
<text class="ms" x="494" y="444">PLANO → RENDER → REVISÃO</text>
<line x1="804" y1="362" x2="842" y2="362" stroke="${C.muted}" stroke-width="1.5" marker-end="url(#a)"/>
${phone(852, 262, 'v01', 0)}${phone(970, 262, 'v02', 1)}${phone(1088, 262, 'v03', 2)}
<line x1="1196" y1="362" x2="1234" y2="362" stroke="${C.muted}" stroke-width="1.5" marker-end="url(#a)"/>
${card(1240, 262, 296, 200, 'rgba(255,158,122,.45)')}
<text class="cn" x="1264" y="296" fill="${C.peach}">GALERIA LOCAL</text>
<text class="ct" x="1264" y="334" style="font-size:23px">você escolhe</text>
<text class="cm" x="1264" y="374">aprovar-lote</text>
<text class="cm" x="1264" y="400">finalizar-lote</text>
<text class="ms" x="1264" y="444" fill="${C.peach}">SÓ COM O SEU OK</text>
<text class="m" x="64" y="534">ESTILO / KIT / LOTE — TUDO VERSIONADO E NA SUA MÁQUINA</text>`});

// ---------- 04 COMEÇAR ----------
const go = [
  ['Instale uma vez', 'git clone … && npm ci && npm run setup'],
  ['Crie a produção', 'cinema-edicao iniciar "/pasta" --video gravacao.mov'],
  ['Peça ao agente', '"Use a skill cinema-9d-edicao para /pasta"'],
  ['Assista e aprove', 'aprovar --por "Seu nome"  →  final'],
];
panel({file: 'comecar.svg', h: 640, image: 'revisao', artX: 560, artW: 1040, fade: 'side',
  title: 'Comece em quatro passos',
  desc: 'Passo a passo: 1 instale uma vez (git clone, npm ci e npm run setup); 2 crie a produção com cinema-edicao iniciar e o caminho da gravação; 3 peça ao agente para usar a skill cinema-9d-edicao na pasta da produção; 4 assista à prévia, aprove com aprovar --por e exporte com final. Ilustração de um celular com legenda e um sinal de aprovação.',
  body: `${head('04 / COMEÇAR', 'Comece em quatro passos.', 'Do clone ao primeiro vídeo, sempre com você no controle.')}
${go.map(([t, c], i) => {
    const y = 236 + i * 92;
    return `${card(64, y, 820, 76)}
<text x="96" y="${y + 52}" style="font:800 36px ${SANS};fill:${C.lime}">${i + 1}</text>
<text class="ct" x="146" y="${y + 33}" style="font-size:22px">${t}</text>
<text class="cm" x="146" y="${y + 58}" style="font-size:15px;fill:${C.muted}">${esc(c)}</text>`;
  }).join('\n')}
<text class="m" x="64" y="612">macOS · NODE 20+ · FFMPEG · WHISPER.CPP · CODEX OU CLAUDE CODE</text>`});

// ---------- PRÉVIA SOCIAL (1280×640, para Settings → Social preview) ----------
panel({file: 'social.svg', w: 1280, h: 640, image: 'hero', artX: 0, artW: 1280, rx: 0,
  title: 'Cinema 9D Edição', desc: 'Cinema 9D Edição: fala gravada vira vídeo vertical editado, com cortes, legendas e motion.',
  body: `<g transform="translate(64 52) scale(.3)"><path d="${LOGO}" fill="${C.ink}"/></g>
<text class="m" x="140" y="84" fill="${C.ink}">CINEMA 9D <tspan fill="${C.dim}">/</tspan> EDIÇÃO</text>
<text class="eb" x="64" y="212" style="font-size:18px">CODEX · CLAUDE CODE · REMOTION</text>
<text x="58" y="330" style="font:800 112px ${SANS};letter-spacing:-4px;fill:${C.ink}">CINEMA 9D</text>
<text x="58" y="436" style="font:800 112px ${SANS};letter-spacing:-4px;fill:${C.lime}">EDIÇÃO</text>
<text class="s" x="64" y="508" style="font-size:26px;fill:#d5dae0">Fala gravada vira vídeo vertical editado.</text>
<text class="m" x="64" y="580">CORTES · LEGENDAS · MOTION · APROVAÇÃO</text>`});

console.log('ok: hero, fluxo, estrutura, estilos, comecar, social');
