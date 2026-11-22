// Lanterns of the Deep is drawn entirely on the canvas; the rules and input stay elsewhere.
const WIDTH = 1280;
const HEIGHT = 720;
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const INK = '#071b23';
const GOLD = '#e6c484';
const PALE = '#f7e9c6';
const MUTED = '#93b2ae';
const SUITS = {
  ember: { light: '#f5ae7a', color: '#c96f4f', dark: '#5d302d', label: 'EMBER' },
  tide: { light: '#9ce4de', color: '#54aeb5', dark: '#1c5664', label: 'TIDE' },
  grove: { light: '#c4dba1', color: '#82a879', dark: '#385a4a', label: 'GROVE' },
  star: { light: '#e3cff6', color: '#a996cc', dark: '#51456d', label: 'STAR' }
};

function roundPath(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function box(ctx, x, y, w, h, radius, fill, stroke, lineWidth = 1) {
  roundPath(ctx, x, y, w, h, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lineWidth; ctx.strokeStyle = stroke; ctx.stroke(); }
}

function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}

function circle(ctx, x, y, r, fill, stroke, width = 1) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function text(ctx, value, x, y, size, color, align = 'left', weight = 'normal', family = SANS) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(value), x, y);
}

function tracked(ctx, value, x, y, size, color, spacing = 2, align = 'center', weight = '600', family = SANS) {
  const label = String(value);
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let width = 0;
  for (const character of label) width += ctx.measureText(character).width;
  width += Math.max(0, label.length - 1) * spacing;
  let at = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  for (const character of label) {
    ctx.fillText(character, at, y);
    at += ctx.measureText(character).width + spacing;
  }
}

function wrappedLines(ctx, value, width, maxLines) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (let i = 0; i < words.length; i++) {
    const next = current ? `${current} ${words[i]}` : words[i];
    if (current && ctx.measureText(next).width > width) {
      lines.push(current);
      current = words[i];
      if (lines.length === maxLines) {
        let last = lines[maxLines - 1];
        while (last.length && ctx.measureText(`${last}…`).width > width) last = last.slice(0, -1);
        lines[maxLines - 1] = `${last}…`;
        return lines;
      }
    } else current = next;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function paragraph(ctx, value, x, y, width, size, leading, color, maxLines = 4, family = SANS, weight = 'normal') {
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const lines = wrappedLines(ctx, value, width, maxLines);
  lines.forEach((row, i) => ctx.fillText(row, x, y + i * leading));
  return lines.length;
}

function star(ctx, x, y, r, color, points = 4) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / points;
    const radius = i % 2 ? r * 0.28 : r;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

function glow(ctx, x, y, radius, inner, outer = 'rgba(0,0,0,0)') {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, inner); gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function ornament(ctx, x, y, direction = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(direction, 1);
  ctx.strokeStyle = 'rgba(229,194,131,.46)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 38); ctx.lineTo(0, 10); ctx.quadraticCurveTo(0, 0, 10, 0); ctx.lineTo(72, 0);
  ctx.moveTo(5, 35); ctx.lineTo(5, 14); ctx.quadraticCurveTo(5, 5, 14, 5); ctx.lineTo(49, 5);
  ctx.stroke();
  circle(ctx, 0, 0, 2, GOLD); star(ctx, 59, 5, 3, GOLD);
  ctx.restore();
}

function background(ctx, time, title = false) {
  const sea = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sea.addColorStop(0, '#0a2732'); sea.addColorStop(0.48, '#0a2830'); sea.addColorStop(1, '#04141d');
  ctx.fillStyle = sea; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  glow(ctx, 640, title ? 350 : 270, title ? 610 : 560, title ? 'rgba(33,100,99,.38)' : 'rgba(38,108,103,.25)');
  glow(ctx, 180, 120, 410, 'rgba(36,88,95,.16)');
  glow(ctx, 1120, 430, 430, 'rgba(5,69,79,.19)');

  ctx.save();
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 7; i++) {
    const x = 125 + i * 210;
    ctx.fillStyle = i % 2 ? '#c0e4cb' : '#91c8c1';
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 74, 0); ctx.lineTo(x - 65, 525); ctx.lineTo(x - 120, 525); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  ctx.save();
  for (let i = 0; i < 42; i++) {
    const x = 28 + ((i * 193 + i * i * 17) % 1220);
    const base = (i * 137 + i * i * 13) % 685;
    const y = (base - time * (3 + i % 4) + 7200) % 720;
    const radius = i % 8 === 0 ? 2.1 : 1;
    circle(ctx, x, y, radius, i % 5 === 0 ? 'rgba(244,211,149,.42)' : 'rgba(143,206,197,.28)');
  }
  ctx.strokeStyle = 'rgba(139,202,190,.085)'; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = 105 + i * 125;
    ctx.beginPath(); ctx.moveTo(0, y);
    ctx.bezierCurveTo(195, y - 27, 270, y + 23, 445, y - 3);
    ctx.bezierCurveTo(700, y - 39, 840, y + 28, 1050, y - 7);
    ctx.bezierCurveTo(1140, y - 22, 1220, y - 12, 1280, y - 18); ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(219,189,129,.21)'; ctx.lineWidth = 1;
  roundPath(ctx, 14, 14, 1252, 692, 14); ctx.stroke();
  roundPath(ctx, 20, 20, 1240, 680, 10); ctx.strokeStyle = 'rgba(229,195,132,.09)'; ctx.stroke();
  ornament(ctx, 26, 26); ornament(ctx, 1254, 26, -1);
  ctx.save(); ctx.translate(0, 720); ctx.scale(1, -1); ornament(ctx, 26, 26); ornament(ctx, 1254, 26, -1); ctx.restore();
}

function panel(ctx, x, y, w, h) {
  const fill = ctx.createLinearGradient(x, y, x, y + h);
  fill.addColorStop(0, 'rgba(16,50,56,.94)'); fill.addColorStop(1, 'rgba(7,28,36,.96)');
  box(ctx, x, y, w, h, 12, fill, 'rgba(218,184,119,.47)');
  box(ctx, x + 5, y + 5, w - 10, h - 10, 8, null, 'rgba(229,202,145,.12)');
  circle(ctx, x + 12, y + 12, 1.3, 'rgba(233,201,145,.75)');
  circle(ctx, x + w - 12, y + 12, 1.3, 'rgba(233,201,145,.75)');
}

function divider(ctx, x, y, w, color = 'rgba(224,192,133,.38)') {
  line(ctx, x, y, x + w / 2 - 7, y, color);
  line(ctx, x + w / 2 + 7, y, x + w, y, color);
  star(ctx, x + w / 2, y, 3.5, color);
}

function suitIcon(ctx, suit, x, y, size, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 0.13;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (suit === 'ember') {
    ctx.beginPath(); ctx.moveTo(0, -1); ctx.bezierCurveTo(.7, -.48, .67, -.1, .48, .35);
    ctx.bezierCurveTo(.35, .7, .17, .86, 0, .9); ctx.bezierCurveTo(-.63, .8, -.76, .3, -.48, -.13);
    ctx.bezierCurveTo(-.32, -.37, -.16, -.55, 0, -1); ctx.fill();
    ctx.fillStyle = '#ffe6ad'; ctx.beginPath(); ctx.moveTo(0, -.23); ctx.bezierCurveTo(.35, .13, .32, .51, 0, .65);
    ctx.bezierCurveTo(-.29, .53, -.26, .18, 0, -.23); ctx.fill();
  } else if (suit === 'tide') {
    ctx.beginPath(); ctx.moveTo(-.85, .1); ctx.bezierCurveTo(-.55, -.55, .1, -.7, .7, -.4);
    ctx.bezierCurveTo(.25, -.42, -.05, -.18, -.12, .08); ctx.bezierCurveTo(.2, -.13, .59, -.06, .85, .2);
    ctx.bezierCurveTo(.33, .08, .06, .54, -.35, .52); ctx.bezierCurveTo(-.58, .51, -.76, .35, -.85, .1); ctx.fill();
  } else if (suit === 'grove') {
    ctx.beginPath(); ctx.moveTo(0, .85); ctx.bezierCurveTo(-.8, .62, -.89, -.09, -.78, -.74);
    ctx.bezierCurveTo(-.14, -.72, .6, -.35, .5, .25); ctx.bezierCurveTo(.45, .58, .2, .76, 0, .85); ctx.fill();
    ctx.strokeStyle = '#e6f0ca'; ctx.lineWidth = .1; ctx.beginPath(); ctx.moveTo(-.5, -.5); ctx.quadraticCurveTo(-.04, -.06, .2, .58); ctx.stroke();
  } else {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? .37 : .95;
      if (!i) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function lantern(ctx, x, y, scale, time = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  glow(ctx, 0, 10, 125, `rgba(247,185,91,${0.22 + Math.sin(time * 1.7) * 0.025})`);
  ctx.strokeStyle = '#cba975'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -132); ctx.lineTo(0, -102); ctx.stroke();
  circle(ctx, 0, -91, 11, null, '#d4b57e', 3);
  ctx.beginPath(); ctx.moveTo(-38, -55); ctx.lineTo(-31, -76); ctx.quadraticCurveTo(0, -92, 31, -76); ctx.lineTo(38, -55); ctx.closePath();
  ctx.fillStyle = '#9e8058'; ctx.fill(); ctx.strokeStyle = '#f0d39c'; ctx.lineWidth = 2; ctx.stroke();
  const glass = ctx.createLinearGradient(-34, -50, 34, 56);
  glass.addColorStop(0, '#426961'); glass.addColorStop(.45, '#d0a86b'); glass.addColorStop(1, '#294b4b');
  ctx.beginPath(); ctx.moveTo(-38, -54); ctx.lineTo(38, -54); ctx.lineTo(29, 56); ctx.lineTo(-29, 56); ctx.closePath();
  ctx.fillStyle = glass; ctx.fill(); ctx.strokeStyle = '#e6c68d'; ctx.lineWidth = 4; ctx.stroke();
  glow(ctx, 0, 0, 54, 'rgba(255,233,151,.9)');
  ctx.fillStyle = '#fff1b8'; ctx.beginPath(); ctx.moveTo(0, -31); ctx.bezierCurveTo(20, -10, 20, 12, 0, 24);
  ctx.bezierCurveTo(-20, 12, -17, -5, 0, -31); ctx.fill();
  ctx.fillStyle = '#ffcf7c'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.bezierCurveTo(9, 4, 8, 16, 0, 19);
  ctx.bezierCurveTo(-8, 16, -8, 5, 0, -5); ctx.fill();
  ctx.strokeStyle = '#ddbc82'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-14, -53); ctx.lineTo(-10, 55); ctx.moveTo(14, -53); ctx.lineTo(10, 55);
  ctx.moveTo(-34, -28); ctx.lineTo(34, -28); ctx.moveTo(-31, 38); ctx.lineTo(31, 38); ctx.stroke();
  box(ctx, -35, 55, 70, 12, 3, '#997752', '#e4c489', 2);
  box(ctx, -27, 67, 54, 7, 2, '#6d624b', '#c8a875');
  star(ctx, 0, 83, 7, '#e8c689');
  ctx.restore();
}

function seaFronds(ctx, x, y, direction) {
  ctx.save(); ctx.translate(x, y); ctx.scale(direction, 1);
  ctx.strokeStyle = 'rgba(89,143,126,.35)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const dx = i * 20;
    ctx.beginPath(); ctx.moveTo(dx, 0); ctx.bezierCurveTo(dx + 15, -45, dx - 20, -90, dx + 8, -145 - (i % 3) * 13); ctx.stroke();
    ctx.lineWidth = 1.2;
    for (let j = 0; j < 3; j++) {
      const yy = -35 - j * 28;
      ctx.beginPath(); ctx.moveTo(dx + 3, yy); ctx.quadraticCurveTo(dx + 25, yy - 3, dx + 25, yy - 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(dx + 1, yy - 13); ctx.quadraticCurveTo(dx - 19, yy - 19, dx - 17, yy - 36); ctx.stroke();
    }
    ctx.lineWidth = 3;
  }
  ctx.restore();
}

function button(ctx, x, y, w, h, label, sublabel) {
  ctx.save();
  ctx.shadowColor = 'rgba(232,183,100,.22)'; ctx.shadowBlur = 22;
  const fill = ctx.createLinearGradient(x, y, x, y + h);
  fill.addColorStop(0, '#e8ca92'); fill.addColorStop(.52, '#c8a56b'); fill.addColorStop(1, '#ae8550');
  box(ctx, x, y, w, h, 8, fill, '#f8dfaa', 1.5); ctx.shadowBlur = 0;
  box(ctx, x + 5, y + 5, w - 10, h - 10, 5, null, 'rgba(84,59,35,.55)');
  star(ctx, x + 18, y + h / 2, 5, '#805d39'); star(ctx, x + w - 18, y + h / 2, 5, '#805d39');
  tracked(ctx, label, x + w / 2, y + (sublabel ? 29 : h / 2 + 5), 15, '#263834', 2.2, 'center', '800');
  if (sublabel) tracked(ctx, sublabel, x + w / 2, y + 47, 9, '#5b573f', 1.2, 'center', '700');
  ctx.restore();
}

function titleScreen(ctx, time, state) {
  background(ctx, time, true);
  seaFronds(ctx, 35, 710, 1); seaFronds(ctx, 1245, 710, -1);
  glow(ctx, 640, 373, 300, 'rgba(232,183,102,.11)');
  divider(ctx, 450, 73, 380);
  tracked(ctx, 'A CARD DUEL IN THE ABYSS', 640, 61, 11, '#c6c5a4', 3);
  ctx.save(); ctx.shadowColor = 'rgba(240,203,134,.28)'; ctx.shadowBlur = 24;
  text(ctx, 'LANTERNS', 640, 174, 79, '#f6e6be', 'center', 'normal', SERIF);
  ctx.restore();
  tracked(ctx, 'OF THE DEEP', 640, 218, 25, GOLD, 7, 'center', '500', SERIF);
  divider(ctx, 443, 239, 394);
  text(ctx, 'Keep your flame. Command the deep.', 640, 269, 17, '#c3d5c5', 'center', 'normal', SERIF);
  lantern(ctx, 640, 398, 1.02, time);
  circle(ctx, 640, 398, 115, null, 'rgba(235,198,130,.16)');
  circle(ctx, 640, 398, 128, null, 'rgba(235,198,130,.09)');
  const cards = state.players && state.players[0] && state.players[0].hand || [];
  for (let i = 0; i < 5; i++) {
    const tilt = (i - 2) * .13;
    ctx.save(); ctx.translate(250 + (i - 2) * 43, 407 + Math.abs(i - 2) * 7);
    ctx.rotate(tilt); ctx.scale(.72, .72);
    if (cards[i]) handCard(ctx, cards[i], -60, -90, false, false);
    else { ctx.scale(2.4, 2.4); cardBack(ctx, 0, 0, 0); }
    ctx.restore();
    ctx.save(); ctx.translate(1030 + (i - 2) * 43, 407 + Math.abs(i - 2) * 7);
    ctx.rotate(tilt); ctx.scale(1.75, 1.75); cardBack(ctx, 0, 0, 0); ctx.restore();
  }
  tracked(ctx, 'GATHER YOUR CREW', 250, 513, 10, '#b8cbb8', 1.6);
  tracked(ctx, 'FACE THE UNKNOWN', 1030, 513, 10, '#b8cbb8', 1.6);
  button(ctx, 500, 555, 280, 65, 'BEGIN VOYAGE', 'ENTER TO BEGIN');
  tracked(ctx, 'GATHER YOUR CREW  ·  MATCH SUITS  ·  KEEP THE LIGHT', 640, 663, 10, '#a6bbb0', 1.4);
}

function header(ctx, turn) {
  star(ctx, 43, 46, 10, GOLD);
  text(ctx, 'LANTERNS', 60, 45, 19, PALE, 'left', 'normal', SERIF);
  tracked(ctx, 'OF THE DEEP', 60, 61, 8, '#c9ad7d', 1.9, 'left');
  line(ctx, 242, 44, 490, 44, 'rgba(222,190,130,.23)');
  line(ctx, 790, 44, 1038, 44, 'rgba(222,190,130,.23)');
  box(ctx, 494, 27, 292, 35, 18, 'rgba(10,42,47,.86)', 'rgba(224,192,132,.48)');
  tracked(ctx, `ROUND ${String(turn || 1).padStart(2, '0')}   /   YOUR TURN`, 640, 49, 10, PALE, 1.6);
  box(ctx, 1093, 28, 142, 32, 6, 'rgba(8,33,39,.8)', 'rgba(224,192,132,.28)');
  tracked(ctx, 'ESC  ·  PAUSE', 1164, 48, 10, '#c8d5c3', 1.1);
}

function count(collection) {
  return Array.isArray(collection) ? collection.length : (typeof collection === 'number' ? collection : 0);
}

function playerPanel(ctx, player, x, y, opponent) {
  panel(ctx, x, y, 270, 170);
  tracked(ctx, opponent ? 'THE DROWNED' : 'YOUR LANTERN', x + 20, y + 26, 10, '#d7c195', 1.7, 'left');
  text(ctx, opponent ? 'Rival of the deep' : 'Keeper of the light', x + 20, y + 47, 16, '#dce8d6', 'left', 'normal', SERIF);
  line(ctx, x + 20, y + 58, x + 250, y + 58, 'rgba(219,192,140,.22)');
  const life = Math.max(0, player.life ?? 0);
  const lifeColor = opponent ? '#e89b81' : '#a8e1cc';
  glow(ctx, x + 58, y + 105, 52, opponent ? 'rgba(213,111,79,.17)' : 'rgba(91,194,167,.17)');
  circle(ctx, x + 58, y + 105, 32, '#102e33', 'rgba(231,200,142,.66)', 1.5);
  circle(ctx, x + 58, y + 105, 27, null, 'rgba(226,192,133,.2)');
  text(ctx, life, x + 58, y + 114, 31, lifeColor, 'center', '700', SERIF);
  tracked(ctx, 'LIGHT', x + 58, y + 153, 8, '#acc1b5', 1.4);
  tracked(ctx, 'LANTERN', x + 109, y + 80, 9, '#a9bfb4', 1.1, 'left');
  box(ctx, x + 109, y + 89, 134, 7, 4, '#0a242a');
  const lifeWidth = Math.max(0, Math.min(1, life / 24)) * 134;
  if (lifeWidth > 0) box(ctx, x + 109, y + 89, lifeWidth, 7, 3, opponent ? '#d38a73' : '#91cbb0');
  const energy = player.energy ?? 0;
  const maxEnergy = player.maxEnergy ?? 0;
  tracked(ctx, 'ENERGY', x + 109, y + 119, 9, '#a9bfb4', 1.1, 'left');
  text(ctx, `${energy} / ${maxEnergy}`, x + 244, y + 120, 14, PALE, 'right', '700');
  for (let i = 0; i < Math.min(8, Math.max(0, maxEnergy)); i++) {
    circle(ctx, x + 114 + i * 17, y + 137, 4.5, i < energy ? '#f1cc84' : '#264a49', i < energy ? '#fce5af' : '#517268');
  }
  text(ctx, `DECK ${count(player.deck)}  ·  DISCARD ${count(player.discard)}`, x + 109, y + 156, 9, '#a8bdb0', 'left', '700');
}

function nameSeed(name) {
  let seed = 0;
  for (const c of String(name || '')) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  return seed;
}

// Small illustrated inhabitants give individual cards a silhouette as well as a suit.
function seaFigure(ctx, card, x, y, size, palette) {
  const kind = card.kind || '';
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = palette.light; ctx.lineWidth = .055;
  if (['Diver', 'Keeper', 'Warden', 'Guardian'].includes(kind)) {
    ctx.fillStyle = palette.dark;
    ctx.beginPath(); ctx.moveTo(-.34, -.02); ctx.quadraticCurveTo(-.56, .12, -.55, .48);
    ctx.lineTo(-.74, .57); ctx.lineTo(-.65, .69); ctx.lineTo(-.36, .57);
    ctx.lineTo(-.29, .85); ctx.lineTo(-.05, .85); ctx.lineTo(0, .55);
    ctx.lineTo(.05, .85); ctx.lineTo(.29, .85); ctx.lineTo(.36, .57);
    ctx.lineTo(.65, .69); ctx.lineTo(.74, .57); ctx.lineTo(.55, .48);
    ctx.quadraticCurveTo(.56, .12, .34, -.02); ctx.closePath(); ctx.fill(); ctx.stroke();
    circle(ctx, 0, -.30, .39, palette.color, palette.light, .06);
    circle(ctx, 0, -.30, .26, '#13383b', '#f4dcaa', .04);
    glow(ctx, 0, -.31, .24, 'rgba(255,225,153,.62)');
    circle(ctx, 0, -.31, .12, '#ffe4a3');
    line(ctx, -.26, .25, .26, .25, palette.light, .045);
    circle(ctx, 0, .39, .07, '#f5d28a');
  } else if (['Ray', 'Scout', 'Caller', 'Mirror', 'Leviathan'].includes(kind)) {
    ctx.fillStyle = palette.dark;
    ctx.beginPath(); ctx.moveTo(-.54, 0); ctx.lineTo(-.94, -.42); ctx.lineTo(-.82, .02);
    ctx.lineTo(-.95, .42); ctx.lineTo(-.54, .17); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = palette.color;
    ctx.beginPath(); ctx.moveTo(-.62, .08); ctx.bezierCurveTo(-.48, -.45, .12, -.58, .68, -.14);
    ctx.quadraticCurveTo(.91, -.01, .75, .13); ctx.bezierCurveTo(.35, .46, -.25, .54, -.62, .08);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = palette.dark;
    ctx.beginPath(); ctx.moveTo(-.2, -.32); ctx.lineTo(.04, -.68); ctx.lineTo(.25, -.29); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-.18, .18); ctx.lineTo(.08, .49); ctx.lineTo(.2, .17); ctx.closePath(); ctx.fill(); ctx.stroke();
    circle(ctx, .49, -.08, .055, '#fff1be');
    ctx.beginPath(); ctx.moveTo(-.37, -.08); ctx.quadraticCurveTo(-.15, .03, -.3, .22);
    ctx.moveTo(-.12, -.16); ctx.quadraticCurveTo(.08, -.02, -.07, .2); ctx.stroke();
  } else if (['Strider', 'Stag', 'Bloom'].includes(kind)) {
    ctx.strokeStyle = palette.light; ctx.lineWidth = .12;
    ctx.beginPath(); ctx.moveTo(0, .83); ctx.bezierCurveTo(-.06, .35, .13, -.24, 0, -.75);
    ctx.moveTo(0, .46); ctx.quadraticCurveTo(-.5, .24, -.62, -.25);
    ctx.moveTo(.04, .13); ctx.quadraticCurveTo(.48, -.05, .58, -.5);
    ctx.moveTo(-.23, .31); ctx.quadraticCurveTo(-.54, .29, -.7, .04);
    ctx.moveTo(.25, -.04); ctx.quadraticCurveTo(.47, .03, .69, -.2); ctx.stroke();
    ctx.fillStyle = palette.color; ctx.strokeStyle = palette.light; ctx.lineWidth = .04;
    for (const [px, py, angle] of [[-.62, -.3, -.6], [.6, -.52, .5], [-.72, .01, -.8], [.72, -.22, .8], [0, -.8, 0]]) {
      ctx.save(); ctx.translate(px, py); ctx.rotate(angle);
      ctx.beginPath(); ctx.moveTo(0, .19); ctx.quadraticCurveTo(-.28, -.03, 0, -.27);
      ctx.quadraticCurveTo(.28, -.03, 0, .19); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    circle(ctx, 0, .18, .09, '#f5e3a1');
  } else {
    ctx.fillStyle = palette.color;
    ctx.beginPath(); ctx.moveTo(-.67, .02); ctx.bezierCurveTo(-.64, -.84, .64, -.84, .67, .02);
    ctx.quadraticCurveTo(.48, .19, .29, .05); ctx.quadraticCurveTo(.1, .21, -.08, .05);
    ctx.quadraticCurveTo(-.28, .21, -.46, .05); ctx.quadraticCurveTo(-.57, .12, -.67, .02);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = palette.light; ctx.lineWidth = .055;
    for (let i = 0; i < 4; i++) {
      const px = -.43 + i * .28;
      ctx.beginPath(); ctx.moveTo(px, .08); ctx.bezierCurveTo(px - .16, .35, px + .15, .51, px, .81); ctx.stroke();
    }
    circle(ctx, 0, -.28, .13, '#f9e8b8');
    star(ctx, -.39, -.25, .08, '#fff1c9'); star(ctx, .4, -.22, .08, '#fff1c9');
  }
  ctx.restore();
}

function artwork(ctx, card, x, y, w, h) {
  const suit = SUITS[card.suit] ? card.suit : 'star';
  const palette = SUITS[suit];
  const seed = nameSeed(card.name);
  ctx.save(); roundPath(ctx, x, y, w, h, 3); ctx.clip();
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, palette.dark); bg.addColorStop(1, '#102e37');
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  glow(ctx, x + w * .51, y + h * .46, Math.max(w, h) * .65, `${palette.color}80`);
  ctx.strokeStyle = 'rgba(225,237,208,.13)'; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const yy = y + h * (.26 + i * .25);
    ctx.beginPath(); ctx.moveTo(x - 5, yy); ctx.bezierCurveTo(x + w * .25, yy - 9, x + w * .62, yy + 8, x + w + 5, yy - 3); ctx.stroke();
  }
  // Each portrait is a creature of its suit, in a tiny luminous sea.
  ctx.strokeStyle = `${palette.light}55`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x + w / 2, y + h * .5, Math.min(w, h) * .42, 0, Math.PI * 2); ctx.stroke();
  if (card.type === 'spell') {
    circle(ctx, x + w / 2, y + h * .5, Math.min(w, h) * .28, 'rgba(7,31,36,.5)', palette.light);
    suitIcon(ctx, suit, x + w / 2, y + h * .5, Math.min(w, h) * .19, palette.light);
    star(ctx, x + w * .25, y + h * .3, 3, palette.light);
    star(ctx, x + w * .74, y + h * .7, 3, palette.light);
  } else seaFigure(ctx, card, x + w / 2, y + h * .53, Math.min(w, h) * .42, palette);
  circle(ctx, x + w - 12, y + 12, 8, 'rgba(7,31,36,.75)', `${palette.light}99`);
  suitIcon(ctx, suit, x + w - 12, y + 12, 5, palette.light);
  for (let i = 0; i < 7; i++) {
    const px = x + 8 + ((seed >>> (i % 4) * 5) + i * 29) % Math.max(1, w - 16);
    const py = y + 6 + ((seed >>> (i % 3) * 7) + i * 17) % Math.max(1, h - 12);
    if (i % 3 === 0) star(ctx, px, py, 2.5, 'rgba(255,238,196,.65)');
    else circle(ctx, px, py, 1, 'rgba(224,245,225,.55)');
  }
  ctx.fillStyle = 'rgba(4,27,32,.45)';
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h - 8);
  ctx.quadraticCurveTo(x + w * .25, y + h - 16, x + w * .5, y + h - 5);
  ctx.quadraticCurveTo(x + w * .75, y + h - 13, x + w, y + h - 7); ctx.lineTo(x + w, y + h); ctx.fill();
  ctx.restore();
}

function stat(ctx, x, y, value, type, small = false) {
  const r = small ? 11 : 13;
  circle(ctx, x, y, r, type === 'attack' ? '#973f36' : '#2f756e', type === 'attack' ? '#f1a283' : '#a9e1ca', 1.3);
  text(ctx, value ?? '–', x, y + (small ? 5 : 6), small ? 14 : 16, '#fff5dc', 'center', '800');
}

function cardName(ctx, name, centerX, top, width) {
  ctx.font = `700 12px ${SERIF}`;
  const rows = wrappedLines(ctx, name || 'Unknown', width, 2);
  rows.forEach((row, i) => text(ctx, row, centerX, top + (rows.length === 1 ? 17 : 12 + i * 12), 12, '#f9e9c8', 'center', '700', SERIF));
}

function handCard(ctx, card, x, y, selected, hovered, faded = false) {
  const palette = SUITS[card.suit] || SUITS.star;
  ctx.save();
  if (faded) ctx.globalAlpha = .32;
  if (selected || hovered) { ctx.shadowColor = selected ? '#e8c676' : palette.light; ctx.shadowBlur = selected ? 24 : 13; }
  box(ctx, x, y, 120, 180, 8, '#bba17a', selected ? '#ffe4a0' : '#dbc49b', selected ? 2.5 : 1.2);
  ctx.shadowBlur = 0;
  box(ctx, x + 3, y + 3, 114, 174, 5, '#0f3038', '#806e55');
  const cap = ctx.createLinearGradient(x, y + 3, x, y + 35);
  cap.addColorStop(0, palette.dark); cap.addColorStop(1, '#1a3438');
  box(ctx, x + 5, y + 5, 110, 30, 4, cap);
  cardName(ctx, card.name, x + 73, y + 4, 80);
  circle(ctx, x + 17, y + 18, 13, '#203c41', '#efd198', 1.5);
  text(ctx, card.cost ?? 0, x + 17, y + 24, 17, '#fff1c9', 'center', '800', SERIF);
  artwork(ctx, card, x + 6, y + 37, 108, 72);
  box(ctx, x + 6, y + 111, 108, 62, 3, '#e8ddbd');
  text(ctx, card.type === 'spell' ? 'SPELL' : String(card.kind || 'CREW').toUpperCase(), x + 60, y + 122, 8, '#6f6551', 'center', '800');
  paragraph(ctx, card.rule || '', x + 12, y + 135, 96, 10.5, 12, '#293c3a', 2);
  if (card.type === 'spell') {
    line(ctx, x + 14, y + 163, x + 32, y + 163, '#c3b394');
    line(ctx, x + 88, y + 163, x + 106, y + 163, '#c3b394');
    tracked(ctx, 'SPELL', x + 60, y + 167, 9, palette.dark, 1.5, 'center', '800');
  } else {
    line(ctx, x + 36, y + 160, x + 84, y + 160, '#c3b394');
    stat(ctx, x + 20, y + 163, card.attack, 'attack', true);
    stat(ctx, x + 100, y + 163, card.health, 'health', true);
    suitIcon(ctx, card.suit, x + 60, y + 164, 6, palette.dark);
  }
  ctx.restore();
}

function unitCard(ctx, card, x, y) {
  const palette = SUITS[card.suit] || SUITS.star;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  box(ctx, x, y, 120, 104, 7, '#a9916d', '#e1c99b', 1.2); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  box(ctx, x + 3, y + 3, 114, 98, 5, '#17363b', '#5e776a');
  ctx.font = `700 12px ${SERIF}`;
  let name = String(card.name || 'Crew');
  while (name.length > 1 && ctx.measureText(name).width > 104) name = name.slice(0, -1);
  if (name !== card.name) name = `${name.slice(0, -1)}…`;
  text(ctx, name, x + 60, y + 17, 12, '#f8ebcd', 'center', '700', SERIF);
  artwork(ctx, card, x + 6, y + 22, 108, 54);
  line(ctx, x + 24, y + 89, x + 96, y + 89, 'rgba(229,203,149,.4)');
  stat(ctx, x + 18, y + 87, card.attack, 'attack', true);
  stat(ctx, x + 102, y + 87, card.health, 'health', true);
  suitIcon(ctx, card.suit, x + 60, y + 89, 7, palette.light);
  ctx.restore();
}

function emptyLane(ctx, x, y, opponent, highlighted, key) {
  ctx.save();
  box(ctx, x, y, 120, 104, 7, highlighted ? 'rgba(98,126,95,.18)' : 'rgba(7,30,36,.56)', highlighted ? 'rgba(249,219,144,.8)' : 'rgba(176,194,166,.25)', highlighted ? 1.5 : 1);
  ctx.setLineDash([3, 5]); box(ctx, x + 5, y + 5, 110, 94, 4, null, highlighted ? 'rgba(245,217,151,.4)' : 'rgba(174,203,183,.15)'); ctx.setLineDash([]);
  circle(ctx, x + 60, y + 42, 18, null, 'rgba(189,210,185,.18)');
  star(ctx, x + 60, y + 42, 7, highlighted ? 'rgba(242,213,154,.68)' : 'rgba(172,203,185,.23)');
  tracked(ctx, highlighted ? 'PLACE HERE' : opponent ? 'OPEN WATER' : 'EMPTY LANE', x + 60, y + 76, 8, highlighted ? '#e9d09d' : '#7c9d93', .8);
  if (!opponent) text(ctx, key, x + 60, y + 91, 10, '#9db6a4', 'center', '700');
  ctx.restore();
}

function cardBack(ctx, x, y, angle) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  box(ctx, -22, -30, 44, 60, 4, '#c3aa7f', '#e4cca0');
  box(ctx, -19, -27, 38, 54, 3, '#17454a', '#7f9986');
  box(ctx, -15, -23, 30, 46, 2, null, 'rgba(233,202,147,.35)');
  circle(ctx, 0, 0, 12, null, 'rgba(231,204,151,.65)');
  star(ctx, 0, 0, 8, '#e6c790');
  ctx.restore();
}

function board(ctx, player, enemy, ui) {
  panel(ctx, 324, 83, 666, 408);
  const ocean = ctx.createLinearGradient(0, 95, 0, 481);
  ocean.addColorStop(0, 'rgba(24,73,76,.40)'); ocean.addColorStop(.5, 'rgba(13,47,53,.13)'); ocean.addColorStop(1, 'rgba(21,66,66,.34)');
  box(ctx, 332, 91, 650, 392, 7, ocean);
  for (let i = 0; i < 3; i++) {
    const x = 430 + i * 150;
    box(ctx, x - 8, 207, 136, 252, 9, 'rgba(6,28,32,.2)', 'rgba(198,198,151,.09)');
    line(ctx, x + 60, 326, x + 60, 345, 'rgba(228,201,151,.32)');
    star(ctx, x + 60, 336, 4, 'rgba(228,201,151,.55)');
  }
  tracked(ctx, 'THE DROWNED\'S HAND', 640, 111, 9, '#afc8b8', 1.6);
  const enemyCards = Math.min(count(enemy.hand), 5);
  for (let i = 0; i < enemyCards; i++) cardBack(ctx, 640 + (i - (enemyCards - 1) / 2) * 34, 153 + Math.abs(i - (enemyCards - 1) / 2) * 2, (i - (enemyCards - 1) / 2) * .08);
  tracked(ctx, `${count(enemy.hand)} CARDS`, 640, 194, 8, '#94b4a6', 1.1);
  tracked(ctx, 'RIVAL CREW', 358, 241, 8, '#94b4a6', 1, 'left');
  tracked(ctx, 'YOUR CREW', 358, 362, 8, '#d9c293', 1, 'left');
  const index = ui.drag ? ui.drag.index : ui.selected;
  const selectedCard = player.hand && player.hand[index];
  const active = !!selectedCard;
  const spell = active && selectedCard.type === 'spell';
  const needsAlly = spell && (selectedCard.effect === 'spell-bless' || selectedCard.effect === 'spell-echo');
  tracked(ctx, spell ? 'CHOOSE' : 'DROP TO', 358, 381, 8, '#829f94', .7, 'left');
  tracked(ctx, needsAlly ? 'AN ALLY' : spell ? 'A LANE' : 'REPLACE', 358, 394, 8, '#829f94', .7, 'left');
  for (let i = 0; i < 3; i++) {
    const x = 430 + i * 150;
    const rival = enemy.lanes && enemy.lanes[i];
    const ally = player.lanes && player.lanes[i];
    if (rival) unitCard(ctx, rival, x, 225);
    else emptyLane(ctx, x, 225, true, false, '');
    if (ally) {
      const snap = ui.snapAt ? Math.max(0, 1 - (ui.now - ui.snapAt) / 260) : 0;
      ctx.save();
      if (ui.snapLane === i && snap) ctx.translate(0, -35 * snap * snap);
      unitCard(ctx, ally, x, 345);
      ctx.restore();
      if (active && !spell) box(ctx, x - 3, 342, 126, 110, 9, null, 'rgba(249,219,144,.85)', 2);
    } else emptyLane(ctx, x, 345, false, active && !spell, ['Q', 'W', 'E'][i]);
    if (spell && (!needsAlly || ally)) {
      box(ctx, x - 8, 207, 136, 252, 9, null, 'rgba(249,219,144,.85)', 2);
    }
  }
  tracked(ctx, 'Q', 490, 476, 10, '#c2d2b8', 1);
  tracked(ctx, 'W', 640, 476, 10, '#c2d2b8', 1);
  tracked(ctx, 'E', 790, 476, 10, '#c2d2b8', 1);
}

function handGuide(ctx, player, ui) {
  panel(ctx, 28, 515, 270, 180);
  const index = ui.hover >= 0 ? ui.hover : ui.selected;
  const card = player.hand && player.hand[index];
  if (card) {
    const palette = SUITS[card.suit] || SUITS.star;
    tracked(ctx, 'CARD NOTES', 48, 539, 9, '#bdcbb6', 1.6, 'left');
    if (card.cost > player.energy) tracked(ctx, 'NEED ENERGY', 278, 539, 8, '#eda18a', .8, 'right');
    text(ctx, card.name, 48, 565, 19, PALE, 'left', 'normal', SERIF);
    suitIcon(ctx, card.suit, 53, 584, 7, palette.light);
    tracked(ctx, `${palette.label}  /  ${card.type === 'spell' ? 'SPELL' : String(card.kind || 'CREW').toUpperCase()}`, 68, 588, 9, palette.light, 1, 'left');
    divider(ctx, 48, 598, 230);
    paragraph(ctx, card.rule || 'A loyal member of your crew.', 48, 619, 226, 13, 17, '#d7e2cf', 3);
    line(ctx, 48, 661, 278, 661, 'rgba(224,195,139,.25)');
    text(ctx, card.type === 'spell' ? `COST ${card.cost}   ·   SPELL` : `COST ${card.cost}   ·   ATK ${card.attack}   ·   HP ${card.health}`, 48, 681, 11, '#d3c59e', 'left', '700');
  } else {
    tracked(ctx, 'A KEEPER\'S GUIDE', 48, 540, 9, '#d4bf94', 1.6, 'left');
    text(ctx, 'Tend your light.', 48, 565, 20, PALE, 'left', 'normal', SERIF);
    text(ctx, 'Click or drag a card to a lane.', 48, 592, 13, '#d4e0ce');
    text(ctx, 'Hover to read its ability.', 48, 613, 12, '#b4cabe');
    text(ctx, '1–5 select  ·  Q W E place', 48, 632, 12, '#b4cabe');
    line(ctx, 48, 647, 278, 647, 'rgba(224,195,139,.25)');
    text(ctx, `DECK  ${count(player.deck)}`, 48, 670, 11, '#d3c59e', 'left', '700');
    text(ctx, `DISCARD  ${count(player.discard)}`, 276, 670, 11, '#d3c59e', 'right', '700');
  }
}

// The preview names the planned card; classify its effect without pretending to
// know the rival's subsequent plays.
function intentKind(state) {
  const rival = state.players && state.players[1] || {};
  const cards = [...(rival.hand || []), ...(rival.deck || [])];
  const card = cards.find(item => item && state.intent && state.intent.includes(item.name));
  if (!card) return 'WAITING';
  const effect = card.effect || '';
  if (effect.startsWith('after-') || ['flare', 'glimmer', 'starlight', 'spell-echo'].includes(effect)) return 'COMBO';
  if (['guard', 'mend', 'shelter', 'heal', 'spell-mend', 'spell-bless'].includes(effect)) return 'DEFEND';
  return 'ATTACK';
}

function rightPanels(ctx, state) {
  panel(ctx, 1007, 83, 245, 166);
  tracked(ctx, 'FORESIGHT', 1028, 108, 9, '#d9c393', 1.7, 'left');
  const kind = intentKind(state);
  const intentColor = kind === 'ATTACK' ? '#e8a384' : kind === 'DEFEND' ? '#a8dbbf' : kind === 'COMBO' ? '#e4c7ef' : '#c5d4bd';
  circle(ctx, 1039, 128, 11, '#153d40', intentColor);
  if (kind === 'COMBO') star(ctx, 1039, 128, 6, intentColor);
  else if (kind === 'DEFEND') {
    line(ctx, 1035, 128, 1043, 128, intentColor, 2);
    line(ctx, 1039, 124, 1039, 132, intentColor, 2);
  } else if (kind === 'ATTACK') {
    line(ctx, 1035, 132, 1043, 124, intentColor, 2);
    line(ctx, 1036, 124, 1043, 131, intentColor, 2);
  } else circle(ctx, 1039, 128, 3, intentColor);
  tracked(ctx, `NEXT PLAY  ·  ${kind}`, 1057, 132, 10, intentColor, 1, 'left');
  line(ctx, 1028, 145, 1230, 145, 'rgba(221,194,141,.27)');
  paragraph(ctx, state.intent || 'The rival is watching the tide.', 1028, 170, 199, 13, 18, '#d1dfd2', 4);
  star(ctx, 1224, 108, 6, '#d8bd86');

  panel(ctx, 1007, 260, 245, 161);
  tracked(ctx, 'SHIP\'S LOG', 1028, 285, 9, '#d9c393', 1.7, 'left');
  const logs = Array.isArray(state.log) ? state.log.slice(-3).reverse() : [];
  if (!logs.length) text(ctx, 'The voyage begins.', 1028, 316, 13, '#a8c3b5', 'left', 'normal', SERIF);
  let y = 309;
  for (const entry of logs) {
    circle(ctx, 1030, y - 4, 2, '#c5a76f');
    const lines = paragraph(ctx, entry, 1041, y, 190, 11.5, 15, '#c4d5c5', 2);
    y += Math.max(1, lines) * 15 + 8;
    if (y > 396) break;
  }

  panel(ctx, 1007, 432, 245, 108);
  tracked(ctx, 'SUIT RESONANCE', 1028, 456, 9, '#d9c393', 1.3, 'left');
  const combo = state.combo || 0;
  text(ctx, combo, 1028, 491, 30, '#f1d495', 'left', '700', SERIF);
  text(ctx, combo === 1 ? 'combo this turn' : 'combos this turn', 1059, 488, 12, '#d1dfce');
  text(ctx, 'Every second matching suit in a turn:', 1028, 511, 11, '#a9c2b3');
  text(ctx, 'Units +1/+1  ·  spells enhanced', 1028, 527, 11, '#c6d8c4');
}

function hand(ctx, player, ui) {
  tracked(ctx, 'YOUR HAND', 350, 507, 9, '#d7c494', 1.5, 'left');
  tracked(ctx, '1 – 5 TO SELECT', 982, 507, 9, '#94b8a8', 1.2, 'right');
  const cards = Array.isArray(player.hand) ? player.hand : [];
  for (let i = 0; i < Math.min(5, cards.length); i++) {
    const hovered = ui.hover === i;
    const selected = ui.selected === i;
    const dragging = ui.drag && ui.drag.index === i;
    const age = ui.dealAt ? (ui.now - ui.dealAt - i * 70) / (500 / (ui.speed || 1)) : 1;
    const progress = Math.max(0, Math.min(1, age));
    const ease = 1 - Math.pow(1 - progress, 3);
    const x = 350 + i * 128 + (1 - ease) * (1050 - 350 - i * 128);
    const y = 515 - (hovered && !dragging ? 8 : 0) - (1 - ease) * 75;
    ctx.save();
    if (progress < .65) {
      ctx.translate(x + 60, y + 90);
      ctx.scale(Math.max(.06, Math.abs(1 - progress / .65 * 2)), 1);
      if (progress < .325) { ctx.scale(2.6, 2.8); cardBack(ctx, 0, 0, 0); }
      else handCard(ctx, cards[i], -60, -90, selected, hovered, dragging);
    } else handCard(ctx, cards[i], x, y, selected, hovered, dragging);
    ctx.restore();
  }
}

function tableScreen(ctx, state, ui, time) {
  background(ctx, time);
  const players = state.players || [];
  const player = players[0] || {};
  const enemy = players[1] || {};
  header(ctx, state.turn);
  playerPanel(ctx, enemy, 28, 83, true);
  playerPanel(ctx, player, 28, 321, false);
  board(ctx, player, enemy, ui);
  handGuide(ctx, player, ui);
  rightPanels(ctx, state);
  hand(ctx, player, ui);
  tracked(ctx, 'SPACE', 1043, 612, 9, '#a7c1b2', 1.1);
  button(ctx, 1080, 585, 160, 64, 'END TURN', 'PASS THE TIDE');
  tracked(ctx, 'LET YOUR CREW STRIKE', 1125, 671, 9, '#91ad9f', 1.1);
  if (ui.burst) {
    const pulse = .20 + .06 * Math.sin(time * 4);
    glow(ctx, 640, 336, 205, `rgba(250,214,130,${pulse})`);
    ctx.save();
    for (let i = 0; i < 18; i++) {
      const phase = (time * .24 + i / 18) % 1;
      const angle = i * 2.4 + time * .2;
      const radius = 44 + phase * 135;
      ctx.globalAlpha = (1 - phase) * .9;
      star(ctx, 640 + Math.cos(angle) * radius, 336 + Math.sin(angle) * radius * .55, 3 + (1 - phase) * 3, '#ffe2a1');
    }
    ctx.globalAlpha = 1;
    ctx.shadowColor = '#f4d794'; ctx.shadowBlur = 14;
    box(ctx, 527, 197, 226, 27, 14, 'rgba(30,60,53,.96)', '#f0ce8d', 1.5);
    tracked(ctx, 'SUIT RESONANCE!', 640, 215, 11, '#ffe8ad', 1.5, 'center', '800');
    star(ctx, 542, 210, 4, '#fbe4aa'); star(ctx, 738, 210, 4, '#fbe4aa');
    ctx.restore();
  }
  if (ui.damage) {
    const shade = ctx.createRadialGradient(640, 360, 220, 640, 360, 740);
    shade.addColorStop(0, 'rgba(148,43,35,0)'); shade.addColorStop(1, 'rgba(176,65,50,.26)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    damageNumber(ctx, state, time);
  }
  const dragged = ui.drag && player.hand && player.hand[ui.drag.index];
  if (dragged) {
    ctx.save(); ctx.translate(ui.drag.x, ui.drag.y); ctx.rotate(.08);
    handCard(ctx, dragged, -60, -90, true, false); ctx.restore();
  }
}

function overlayBase(ctx, heading, eyebrow) {
  ctx.fillStyle = 'rgba(2,13,19,.76)'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  glow(ctx, 640, 335, 365, 'rgba(75,132,114,.16)');
  panel(ctx, 390, 125, 500, 470);
  ornament(ctx, 408, 143); ornament(ctx, 872, 143, -1);
  tracked(ctx, eyebrow, 640, 171, 10, '#cab990', 2.3);
  text(ctx, heading, 640, 220, 37, PALE, 'center', 'normal', SERIF);
  divider(ctx, 495, 242, 290);
}

function pauseScreen(ctx) {
  overlayBase(ctx, 'The water is still', 'VOYAGE PAUSED');
  text(ctx, 'Take a breath. Your light will wait.', 640, 280, 16, '#c3d6c6', 'center', 'normal', SERIF);
  button(ctx, 480, 316, 320, 64, 'RESUME VOYAGE', 'ESC TO RETURN');
  box(ctx, 480, 414, 320, 64, 8, '#173b3e', '#c7af7d');
  box(ctx, 485, 419, 310, 54, 5, null, 'rgba(223,197,144,.2)');
  tracked(ctx, 'OPTIONS', 640, 452, 14, '#e7d4aa', 2.2);
  text(ctx, 'Click outside Options to resume', 640, 536, 12, '#9dbbad', 'center');
}

function optionsScreen(ctx, ui) {
  overlayBase(ctx, 'Set your course', 'OPTIONS');
  text(ctx, 'A little comfort for the journey.', 640, 279, 16, '#c3d6c6', 'center', 'normal', SERIF);
  box(ctx, 465, 311, 350, 78, 7, '#173b3e', 'rgba(218,193,141,.55)');
  tracked(ctx, 'SOUND', 487, 341, 10, '#bfccba', 1.5, 'left');
  text(ctx, 'Click to toggle', 487, 365, 12, '#9fb9ac');
  tracked(ctx, ui.volume > 0 ? 'ON' : 'OFF', 785, 355, 14, '#f0d297', 1.5, 'right');
  box(ctx, 465, 415, 350, 72, 7, '#173b3e', 'rgba(218,193,141,.55)');
  tracked(ctx, 'ANIMATION', 487, 444, 10, '#bfccba', 1.5, 'left');
  text(ctx, 'Click to toggle', 487, 466, 12, '#9fb9ac');
  tracked(ctx, ui.speed === .5 ? 'SLOW' : 'NORMAL', 785, 455, 14, '#f0d297', 1.2, 'right');
  tracked(ctx, '‹  BACK   /   ESC', 640, 553, 12, '#dfc793', 1.5);
}


// Numbers are taken from recorded strikes, never guessed from the damage flag.
function damageNumber(ctx, state, time) {
  const logs = Array.isArray(state.log) ? state.log : [];
  let turnMarkers = 0;
  for (let i = logs.length - 1; i >= 0; i--) {
    const entry = String(logs[i]);
    if (/^Turn \d+: your lanterns are ready\./.test(entry)) {
      if (++turnMarkers > 1) break;
      continue;
    }
    const amount = entry.match(/(?:for (\d+)\.|deals (\d+) damage)/);
    if (!amount) continue;
    const target = (entry.match(/strikes (.+?) for \d+/) || entry.match(/damage to (.+?)\./) || [])[1];
    let x = 640;
    let y = 305;
    const players = state.players || [];
    for (let side = 0; side < 2; side++) {
      const lanes = players[side] && players[side].lanes || [];
      const lane = lanes.findIndex(card => card && card.name === target);
      if (lane >= 0) { x = 525 + lane * 150; y = (side === 0 ? 345 : 225) + 43; break; }
    }
    if (entry.includes('your lantern')) { x = 107; y = 405; }
    else if (entry.includes('rival lantern') || entry.includes('opposing lantern')) { x = 107; y = 167; }
    y -= Math.sin(time * 3) * 4;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `800 32px ${SANS}`; ctx.lineWidth = 5; ctx.strokeStyle = '#3c2926';
    ctx.shadowColor = '#ef8c6e'; ctx.shadowBlur = 15;
    const label = `−${amount[1] || amount[2]}`;
    ctx.strokeText(label, x, y); ctx.fillStyle = '#ffe1b7'; ctx.fillText(label, x, y); ctx.restore();
    return;
  }
}
function resultScreen(ctx, state, victory, time) {
  ctx.fillStyle = 'rgba(2,13,19,.79)'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  glow(ctx, 640, 345, 380, victory ? 'rgba(224,183,97,.19)' : 'rgba(57,119,125,.20)');
  panel(ctx, 390, 104, 500, 496);
  ornament(ctx, 408, 122); ornament(ctx, 872, 122, -1);
  tracked(ctx, victory ? 'VOYAGE COMPLETE' : 'THE VOYAGE ENDS', 640, 148, 10, '#d3bd8d', 2.3);
  text(ctx, victory ? 'The light holds' : 'The light fades', 640, 198, 43, PALE, 'center', 'normal', SERIF);
  divider(ctx, 495, 218, 290);
  const player = state.players && state.players[0] || {};
  const crew = (player.lanes || []).filter(Boolean);
  const featured = crew.reduce((best, card) => !best || card.attack + card.health > best.attack + best.health ? card : best, null)
    || (player.hand || [])[0];
  if (victory && featured) {
    glow(ctx, 640, 322, 180, 'rgba(250,209,130,.25)');
    circle(ctx, 640, 322, 115, null, 'rgba(235,201,139,.45)');
    circle(ctx, 640, 322, 127, null, 'rgba(235,201,139,.20)');
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6 + time * .04;
      star(ctx, 640 + Math.cos(angle) * 134, 322 + Math.sin(angle) * 102, i % 3 ? 3 : 6, '#f1d59b');
    }
    ctx.save(); ctx.translate(640, 322); ctx.rotate(-.04); ctx.scale(1.06, 1.06);
    handCard(ctx, featured, -60, -90, true, false); ctx.restore();
  } else lantern(ctx, 640, 335, .7, time);
  text(ctx, victory ? 'You carried your lantern through the deep.' : 'Even the deepest night gives way to dawn.', 640, 433, 15, '#c9daca', 'center', 'normal', SERIF);
  tracked(ctx, `ROUND ${state.turn || 1}  ·  ${victory ? 'THE DEEP IS QUIET' : 'SAIL AGAIN'}`, 640, 466, 10, '#cbb88b', 1.6);
  button(ctx, 500, 500, 280, 64, 'SAIL AGAIN', 'CLICK ANYWHERE');
}

/** Draw one complete frame in the fixed 1280 × 720 game coordinate space. */
export function render(ctx, state, ui, time = 0) {
  if (!ctx) return;
  const currentState = state || {};
  const currentUi = ui || { screen: 'title', hover: -1, selected: -1, drag: null };
  const seconds = time / 1000;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (currentUi.shakeAt && currentUi.now - currentUi.shakeAt < 300) {
    const strength = 1 - (currentUi.now - currentUi.shakeAt) / 300;
    ctx.translate(Math.sin(currentUi.now * .08) * 5 * strength, Math.cos(currentUi.now * .11) * 3 * strength);
  }
  if (currentUi.screen === 'title') titleScreen(ctx, seconds, currentState);
  else {
    tableScreen(ctx, currentState, currentUi, seconds);
    if (currentUi.screen === 'pause') pauseScreen(ctx);
    else if (currentUi.screen === 'options') optionsScreen(ctx, currentUi);
    else if (currentUi.screen === 'victory' || currentUi.screen === 'defeat') {
      resultScreen(ctx, currentState, currentUi.screen === 'victory', seconds);
    }
  }
  ctx.restore();
}
