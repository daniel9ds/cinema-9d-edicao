// Gera as ilustrações do README em SVG estático, nas versões clara e escura.
// Uso: node docs/assets/readme/gerar.mjs  (sem dependências, sem fontes externas)
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const SANS = "ui-sans-serif, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

// Paleta derivada da identidade padrão do método (src/schema.ts) e funções do fluxo.
const THEMES = {
  escuro: {bg:'#101419', panel:'#171d24', panel2:'#1d242d', line:'#2c3540', fg:'#f5f6f1', muted:'#aab1ba',
    auto:'#7cc7ff', agente:'#a4ff63', pessoa:'#ff9e7a', logo:'#f5f6f1', glow:'#a4ff63'},
  claro:  {bg:'#f6f7f3', panel:'#ffffff', panel2:'#eef0ec', line:'#d5dad2', fg:'#101419', muted:'#4b5560',
    auto:'#1d65a6', agente:'#3a7a0c', pessoa:'#b8441f', logo:'#101419', glow:'#7ed23f'},
};

// Símbolo 9D (logo-9d.svg, viewBox 184.72 × 139.64).
const LOGO = 'M113.8,91.44c-25.82,2.86-37.85,10.09-38.87,48.2h-15.53c-.72-.05-1.44-.08-2.17-.08H.23c0-47.1,12.83-39.38,57-39.38,7.63,0,13.03-3.53,16.19-10.61h-28.77c-12.28,0-22.78-4.43-31.52-13.25C4.39,67.47,0,56.94,0,44.66S4.39,21.85,13.14,13.1C21.88,4.35,32.38,0,44.66,0c27.63,0,55.24.05,82.86.05,15.82,0,29.29,6.58,40.45,17.75,11.16,11.16,16.75,24.64,16.75,40.45v25.12c0,15.82-5.58,29.33-16.75,40.49-9.5,9.5-20.59,13.88-32.41,15.78h-50.43c.23-32.87,13.83-37.56,28.04-38.01h.65s15.21,0,15.21,0c9.26-.51,16.31-3.59,16.31-18.26v-25.08c0-4.84-1.75-9.04-5.28-12.58-3.53-3.53-7.75-5.28-12.54-5.28h-13.71v.07s0,22.26,0,22.26c.04,9.31.1,18.47,0,28.68h0ZM80.5,52.14c-4.48-9.96-12.12-14.96-22.92-14.96h-17.81c-5.01,0-7.48,2.48-7.48,7.48s2.48,7.48,7.48,7.48h40.72Z';
const logo = (x, y, h, fill) => `<path transform="translate(${x} ${y}) scale(${(h/139.64).toFixed(4)})" fill="${fill}" d="${LOGO}"/>`;

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const text = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-family="${o.mono?MONO:SANS}" font-size="${o.size??20}"${o.weight?` font-weight="${o.weight}"`:''} fill="${o.fill}"${o.anchor?` text-anchor="${o.anchor}"`:''}${o.ls?` letter-spacing="${o.ls}"`:''}${o.extra??''}>${esc(s)}</text>`;
const svg = (w, h, title, desc, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
${body}
</svg>
`;

// Ícones de traço em grade 24×24.
const ICONS = {
  materiais: 'M3 7h7l2 2h9v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z M7 13h10 M7 16h6',
  transcricao: 'M3 12h2 M7 8v8 M11 5v14 M15 9v6 M19 11v2 M21 12h0',
  direcao: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z',
  previa: 'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M10.5 9.5v5l4-2.5z',
  revisao: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z M12 9.2a2.8 2.8 0 1 0 0 5.6a2.8 2.8 0 1 0 0-5.6z',
  aprovacao: 'M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z M8.5 12l2.5 2.5 4.5-5',
  exportacao: 'M12 4v11 M7.5 10.5L12 15l4.5-4.5 M5 19h14',
  engrenagem: 'M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z M12 2.5v3 M12 18.5v3 M2.5 12h3 M18.5 12h3 M5.3 5.3l2.1 2.1 M16.6 16.6l2.1 2.1 M5.3 18.7l2.1-2.1 M16.6 7.4l2.1-2.1',
  pessoa: 'M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6',
  pasta: 'M3 7h7l2 2h9v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
  cadeado: 'M7 11V8a5 5 0 0 1 10 0v3 M5.5 11h13v9.5h-13z',
};
const icon = (name, x, y, size, stroke, sw = 1.8) =>
  `<path transform="translate(${x} ${y}) scale(${size/24})" d="${ICONS[name]}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;

const ROLE = {auto:'AUTOMÁTICO', agente:'AGENTE', pessoa:'PESSOA'};
const roleIcon = {auto:'engrenagem', agente:'direcao', pessoa:'pessoa'};

// ---------- Banner ----------
function banner(c) {
  const W = 960, H = 380;
  const waves = Array.from({length: 18}, (_, i) => {
    const h = [10,22,36,18,44,28,52,30,16,40,24,48,20,34,14,26,38,12][i];
    return `<rect x="${742 + i*9}" y="${288 - h/2}" width="5" height="${h}" rx="2.5" fill="${c.agente}" opacity="${0.35 + (i%3)*0.2}"/>`;
  }).join('');
  return svg(W, H, 'Cinema 9D Edição',
    'Banner: símbolo 9D, o nome Cinema 9D Edição e a frase “Sua gravação de fala vira vídeo vertical editado, com seu agente de IA e ferramentas locais”. À direita, um celular estilizado com legenda e forma de onda.',
`<defs>
  <radialGradient id="g" cx="0.82" cy="0.35" r="0.6"><stop offset="0" stop-color="${c.glow}" stop-opacity="0.16"/><stop offset="1" stop-color="${c.glow}" stop-opacity="0"/></radialGradient>
  <clipPath id="f"><rect width="${W}" height="${H}" rx="24"/></clipPath>
</defs>
<g clip-path="url(#f)">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="23.5" fill="none" stroke="${c.line}"/>
  ${logo(56, 58, 46, c.logo)}
  ${text(132, 92, 'MÉTODO LOCAL · CODEX + CLAUDE CODE', {mono:true, size:15, fill:c.muted, ls:2})}
  ${text(54, 184, 'Cinema 9D Edição', {size:66, weight:800, fill:c.fg, ls:-1})}
  ${text(56, 236, 'Sua gravação de fala vira vídeo vertical', {size:27, fill:c.muted})}
  ${text(56, 272, 'editado, com seu agente de IA e ferramentas locais.', {size:27, fill:c.muted})}
  <g font-family="${MONO}" font-size="15" letter-spacing="1">
    <rect x="56" y="304" width="126" height="34" rx="17" fill="none" stroke="${c.auto}"/>${text(119, 326, 'cortes', {mono:true, size:15, fill:c.auto, anchor:'middle'})}
    <rect x="194" y="304" width="132" height="34" rx="17" fill="none" stroke="${c.agente}"/>${text(260, 326, 'legendas', {mono:true, size:15, fill:c.agente, anchor:'middle'})}
    <rect x="338" y="304" width="118" height="34" rx="17" fill="none" stroke="${c.pessoa}"/>${text(397, 326, 'motion', {mono:true, size:15, fill:c.pessoa, anchor:'middle'})}
  </g>
  <rect x="724" y="40" width="188" height="300" rx="26" fill="${c.panel}" stroke="${c.line}" stroke-width="2"/>
  <rect x="740" y="58" width="156" height="200" rx="14" fill="${c.panel2}"/>
  ${icon('pessoa', 782, 92, 72, c.muted, 1.4)}
  <rect x="752" y="214" width="132" height="30" rx="8" fill="${c.bg}" opacity="0.92"/>
  ${text(818, 235, 'sua fala aqui', {size:16, weight:700, fill:c.fg, anchor:'middle'})}
  <rect x="770" y="241" width="40" height="2.5" rx="1.25" fill="${c.agente}"/>
  ${waves}
  <rect x="790" y="318" width="56" height="5" rx="2.5" fill="${c.line}"/>
</g>`);
}

// ---------- Fluxo ----------
function fluxo(c) {
  const W = 720, X = 40, CW = 556, CH = 104, GAP = 22, TOP = 214;
  const steps = [
    ['materiais', 'Materiais e briefing', 'Gravação, marca, telas e objetivo', ['pessoa'], ''],
    ['transcricao', 'Transcrição e proposta de cortes', 'Whisper local, quadros e pausas', ['auto'], 'preparar'],
    ['direcao', 'Direção e montagem', 'Revisa cortes, cria cenas e motion', ['agente','auto'], 'planejar'],
    ['previa', 'Prévia', 'MP4 540×960 e quadros para conferir', ['auto'], 'previa'],
    ['revisao', 'Revisão humana', 'Fala, leitura, ritmo e marca', ['pessoa'], ''],
    ['aprovacao', 'Aprovação da revisão atual', 'Registro ligado ao MP4 conferido', ['pessoa'], 'aprovar'],
    ['exportacao', 'Exportação final', 'MP4 1080×1920 e relatório técnico', ['auto'], 'final'],
  ];
  const y = i => TOP + i*(CH + GAP);
  const H = y(steps.length) + 118;
  const cards = steps.map(([ic, title, sub, roles, cmd], i) => {
    const top = y(i), main = c[roles[0]];
    const chips = roles.map(r => ROLE[r]).join(' + ');
    return `<g>
  <rect x="${X}" y="${top}" width="${CW}" height="${CH}" rx="14" fill="${c.panel}" stroke="${c.line}"/>
  <rect x="${X}" y="${top}" width="6" height="${CH}" rx="3" fill="${main}"/>
  <circle cx="${X+48}" cy="${top+CH/2}" r="25" fill="none" stroke="${main}" stroke-width="2"/>
  ${icon(ic, X+34, top+CH/2-14, 28, main)}
  ${text(X+90, top+32, `${String(i+1).padStart(2,'0')} · ${chips}`, {mono:true, size:14, fill:main, ls:1.5})}
  ${cmd ? text(X+CW-20, top+32, cmd, {mono:true, size:14, fill:c.muted, anchor:'end'}) : ''}
  ${text(X+90, top+64, title, {size:24, weight:700, fill:c.fg})}
  ${text(X+90, top+89, sub, {size:17, fill:c.muted})}
</g>`;
  }).join('\n');
  const arrows = steps.slice(1).map((_, i) => {
    const a = y(i) + CH, b = y(i+1);
    return `<path d="M${X+48} ${a+2}V${b-4}" stroke="${c.line}" stroke-width="2.5"/><path d="M${X+42} ${b-10}l6 7 6-7" fill="none" stroke="${c.muted}" stroke-width="2"/>`;
  }).join('');
  // Retorno: da revisão humana (5) para a direção e montagem (3).
  const yr = y(4) + CH/2, yd = y(2) + CH/2, xr = X + CW + 50;
  const loop = `<path d="M${X+CW} ${yr}H${xr}V${yd}H${X+CW+10}" fill="none" stroke="${c.pessoa}" stroke-width="2.5" stroke-dasharray="7 6"/>
  <path d="M${X+CW+18} ${yd-7}l-9 7 9 7" fill="none" stroke="${c.pessoa}" stroke-width="2.5" stroke-linejoin="round"/>
  ${text(xr+24, (yr+yd)/2, 'AJUSTES VOLTAM À EDIÇÃO', {mono:true, size:13, fill:c.pessoa, anchor:'middle', ls:1.5, extra:` transform="rotate(-90 ${xr+24} ${(yr+yd)/2})"`})}`;
  const legend = [['auto','Automático','scripts locais'],['agente','Agente','Codex ou Claude'],['pessoa','Pessoa','você decide']].map(([r, a, b], i) => {
    const lx = X + i*214;
    return `<rect x="${lx}" y="132" width="200" height="52" rx="12" fill="${c.panel2}"/>
  ${icon(roleIcon[r], lx+14, 144, 28, c[r])}
  ${text(lx+52, 155, a, {size:17, weight:700, fill:c[r]})}
  ${text(lx+52, 175, b, {size:14, fill:c.muted})}`;
  }).join('\n');
  const fy = y(steps.length) + 4;
  return svg(W, H, 'Fluxo de produção do Cinema 9D Edição',
    'Sete etapas em sequência: 1 materiais e briefing (pessoa); 2 transcrição e proposta de cortes (automático, comando preparar); 3 direção e montagem (agente e automático); 4 prévia (automático, comando previa); 5 revisão humana (pessoa); 6 aprovação da revisão atual (pessoa, comando aprovar); 7 exportação final (automático, comando final). Uma seta tracejada leva os ajustes da revisão humana de volta à direção e montagem. Qualquer mudança invalida a aprovação anterior e exige nova prévia e nova aprovação.',
`<rect width="${W}" height="${H}" rx="24" fill="${c.bg}"/>
<rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="23.5" fill="none" stroke="${c.line}"/>
${logo(X, 40, 26, c.logo)}
${text(X+46, 61, 'FLUXO DE PRODUÇÃO', {mono:true, size:14, fill:c.muted, ls:2})}
${text(X, 110, 'Da gravação ao MP4 final', {size:34, weight:800, fill:c.fg})}
${legend}
${arrows}
${cards}
${loop}
<rect x="${X}" y="${fy}" width="${CW+76}" height="86" rx="14" fill="none" stroke="${c.pessoa}" stroke-dasharray="7 6"/>
${icon('cadeado', X+20, fy+28, 30, c.pessoa)}
${text(X+66, fy+36, 'Mudou corte, cena, legenda, marca ou mídia?', {size:18, weight:700, fill:c.fg})}
${text(X+66, fy+62, 'A aprovação anterior deixa de valer: nova prévia, nova aprovação.', {size:16, fill:c.muted})}`);
}

// ---------- Estrutura ----------
function estrutura(c) {
  const W = 720, X = 40, IW = 640;
  const chip = (x, y, w, label, col) => `<rect x="${x}" y="${y}" width="${w}" height="32" rx="8" fill="${c.panel2}"/>${text(x+w/2, y+21, label, {mono:true, size:14, fill:col, anchor:'middle'})}`;
  const tree = [
    ['entrada/', 'gravação original · só leitura', c.pessoa],
    ['roteiro/', 'briefing e objetivo', c.pessoa],
    ['marca/ interface/', 'logo, fonte e telas', c.pessoa],
    ['edicao/', 'cortes, cenas, aprovação', c.agente],
    ['trabalho/', 'transcrição, quadros', c.auto],
    ['versoes/', 'lotes de versões (opcional)', c.agente],
    ['saida/', 'prévias e MP4 finais', c.auto],
  ];
  const PY = 574, rowH = 40;
  const rows = tree.map(([dir, what, col], i) => {
    const ry = PY + 92 + i*rowH;
    return `${icon('pasta', X+22, ry-17, 20, col, 1.7)}${text(X+52, ry, dir, {mono:true, size:15, fill:c.fg})}${text(X+52, ry+17, what, {size:13.5, fill:c.muted})}`;
  }).join('\n');
  const PH = 92 + tree.length*rowH + 14, H = PY + PH + 96;
  const side = (y, name, theme) => `<rect x="${X+430}" y="${y}" width="210" height="${(PH-20)/2}" rx="14" fill="${c.panel}" stroke="${c.line}"/>
  ${icon('pasta', X+450, y+24, 24, c.muted, 1.7)}
  ${text(X+484, y+43, name, {size:18, weight:700, fill:c.fg})}
  ${text(X+450, y+80, theme, {size:15, fill:c.muted})}
  ${text(X+450, y+104, 'mesma estrutura,', {size:15, fill:c.muted})}
  ${text(X+450, y+126, 'arquivos próprios', {size:15, fill:c.muted})}`;
  return svg(W, H, 'Instalação central e produções independentes',
    'No topo, a instalação central do método em ~/projetos/cinema-9d-edicao, com bin/cinema-edicao, scripts, src com Remotion, skills, styles e docs; a skill fica vinculada em ~/.claude/skills e ~/.codex/skills. Ao lado, a biblioteca local opcional em ~/projetos/cinema-9d-biblioteca, com estilos e kits, fora do método e do Git; iniciar --kit copia para a produção só os arquivos listados no kit. O método opera cada produção pelo caminho absoluto. Cada produção fica em qualquer pasta, com entrada (gravação original, só leitura), roteiro, marca e interface, edicao, trabalho, versoes e saida. Produções B e C têm a mesma estrutura e arquivos próprios.',
`<rect width="${W}" height="${H}" rx="24" fill="${c.bg}"/>
<rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="23.5" fill="none" stroke="${c.line}"/>
${logo(X, 40, 26, c.logo)}
${text(X+46, 61, 'ESTRUTURA', {mono:true, size:14, fill:c.muted, ls:2})}
${text(X, 110, 'Um método central,', {size:34, weight:800, fill:c.fg})}
${text(X, 150, 'produções independentes', {size:34, weight:800, fill:c.fg})}

<rect x="${X}" y="186" width="${IW}" height="196" rx="16" fill="${c.panel}" stroke="${c.agente}" stroke-width="2"/>
${text(X+24, 222, 'Instalação central do método', {size:21, weight:700, fill:c.fg})}
${text(X+24, 248, '~/projetos/cinema-9d-edicao', {mono:true, size:15, fill:c.agente})}
${chip(X+24, 266, 186, 'bin/cinema-edicao', c.fg)}${chip(X+220, 266, 96, 'scripts/', c.fg)}${chip(X+326, 266, 140, 'src/ Remotion', c.fg)}${chip(X+476, 266, 140, 'skills/', c.fg)}
${chip(X+24, 308, 96, 'styles/', c.fg)}${chip(X+130, 308, 80, 'docs/', c.fg)}${chip(X+220, 308, 396, 'skill em ~/.claude e ~/.codex', c.muted)}
${text(X+24, 364, 'Código, skill e estilos de exemplo. Sem mídia de clientes.', {size:15, fill:c.muted})}

<rect x="${X+240}" y="400" width="${IW-240}" height="118" rx="16" fill="none" stroke="${c.muted}" stroke-dasharray="6 6"/>
${text(X+262, 432, 'Biblioteca local · opcional', {size:19, weight:700, fill:c.fg})}
${text(X+262, 456, '~/projetos/cinema-9d-biblioteca', {mono:true, size:14, fill:c.muted})}
${text(X+262, 480, 'Seus estilos e kits de marca.', {size:15, fill:c.muted})}
${text(X+262, 502, 'Fica fora do método e do Git.', {size:15, fill:c.muted})}

<path d="M${X+110} 382V${PY-6}" stroke="${c.agente}" stroke-width="2.5"/><path d="M${X+103} ${PY-14}l7 8 7-8" fill="none" stroke="${c.agente}" stroke-width="2.5"/>
${text(X+124, 444, 'opera cada', {mono:true, size:13, fill:c.agente})}
${text(X+124, 462, 'produção', {mono:true, size:13, fill:c.agente})}
${text(X+124, 480, 'pelo caminho', {mono:true, size:13, fill:c.agente})}
${text(X+124, 498, 'absoluto', {mono:true, size:13, fill:c.agente})}
<path d="M${X+535} 518V${PY-6}" stroke="${c.muted}" stroke-width="2" stroke-dasharray="5 5"/><path d="M${X+528} ${PY-14}l7 8 7-8" fill="none" stroke="${c.muted}" stroke-width="2"/>
${text(X+522, 550, 'iniciar --kit copia a lista do kit', {mono:true, size:13, fill:c.muted, anchor:'end'})}

<rect x="${X}" y="${PY}" width="410" height="${PH}" rx="16" fill="${c.panel}" stroke="${c.pessoa}" stroke-width="2"/>
${icon('pasta', X+22, PY+22, 26, c.pessoa, 1.8)}
${text(X+58, PY+43, 'Produção A', {size:21, weight:700, fill:c.fg})}
${text(X+22, PY+70, '/qualquer/pasta/novo-video', {mono:true, size:14, fill:c.pessoa})}
${rows}
${side(PY, 'Produção B', 'outro tema')}
${side(PY + (PH-20)/2 + 20, 'Produção C', 'outra marca')}

${text(X, H-50, 'Os originais não são alterados. Mídia e marca de cada cliente', {size:15, fill:c.muted})}
${text(X, H-28, 'ficam na própria produção, nunca no método.', {size:15, fill:c.muted})}`);
}

for (const [name, c] of Object.entries(THEMES)) {
  writeFileSync(path.join(OUT, `banner-${name}.svg`), banner(c));
  writeFileSync(path.join(OUT, `fluxo-${name}.svg`), fluxo(c));
  writeFileSync(path.join(OUT, `estrutura-${name}.svg`), estrutura(c));
}
console.log('SVGs gerados em', OUT);
