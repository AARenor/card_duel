import { createGame, playCard, endTurn, setupShot } from './rules.js';
import { render } from './render.js';
import { sound, setVolume } from './sound.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
let state = createGame();
const ui = { screen: 'title', hover: -1, selected: -1, drag: null, burst: false, damage: false, volume: 0.45, speed: 1 };
let effectsUntil = 0;
// Canvas coordinates stay fixed while pointer input follows the displayed size.
let previousScreen = 'title';

function newGame() {
  state = createGame();
  ui.screen = 'table'; ui.selected = -1; ui.hover = -1; ui.drag = null;
  ui.dealAt = performance.now();
  sound('swish');
}
function point(event) {
  const r = canvas.getBoundingClientRect();
  return { x: (event.clientX-r.left)*1280/r.width, y: (event.clientY-r.top)*720/r.height };
}
function handAt(p) {
  if (p.y < 505 || p.y > 720) return -1;
  const i = Math.floor((p.x-350)/128);
  return i >= 0 && i < Math.min(5, state.players[0].hand.length) ? i : -1;
}
function laneAt(p) {
  if (p.y < 205 || p.y > 510) return -1;
  const lane = Math.floor((p.x-430)/150);
  return lane >= 0 && lane < 3 ? lane : -1;
}
function tryPlay(index, lane) {
  if (index < 0 || lane < 0) return;
  const before = state.combo;
  const played = playCard(state, 0, index, lane);
  if (played) {
    sound(state.combo !== before ? 'combo' : 'play');
    ui.burst = state.combo !== before; effectsUntil = performance.now()+1100;
    ui.snapAt = performance.now(); ui.snapLane = lane;
    ui.selected = -1;
  }
  checkResult();
}
function checkResult() {
  if (state.result) {
    ui.screen = state.result;
    if (state.result === 'victory') sound('victory');
  }
}
function finishTurn() {
  if (ui.screen !== 'table') return;
  endTurn(state); ui.selected = -1; ui.damage = true; effectsUntil = performance.now()+900;
  ui.dealAt = performance.now(); ui.shakeAt = performance.now();
  sound('play'); checkResult();
}
function frame(time) {
  ui.now = time;
  if (effectsUntil && time > effectsUntil) { ui.burst = false; ui.damage = false; effectsUntil = 0; }
  render(ctx, state, ui, time * ui.speed);
  requestAnimationFrame(frame);
}
canvas.addEventListener('pointermove', event => {
  const p = point(event);
  ui.hover = ui.screen === 'table' ? handAt(p) : -1;
  if (ui.drag) { ui.drag.x = p.x; ui.drag.y = p.y; }
});
canvas.addEventListener('pointerdown', event => {
  const p = point(event);
  if (ui.screen === 'title') {
    if (p.y > 535) newGame();
    return;
  }
  if (ui.screen === 'victory' || ui.screen === 'defeat') { newGame(); return; }
  if (ui.screen === 'pause') {
    if (p.y > 400 && p.y < 490) { previousScreen = 'pause'; ui.screen = 'options'; }
    else ui.screen = 'table';
    return;
  }
  if (ui.screen === 'options') {
    if (p.y > 300 && p.y < 410) { ui.volume = ui.volume > 0 ? 0 : 0.45; setVolume(ui.volume); sound('swish'); }
    else if (p.y >= 410 && p.y < 500) ui.speed = ui.speed === 1 ? 0.5 : 1;
    else ui.screen = previousScreen;
    return;
  }
  if (p.x > 1070 && p.y > 560) { finishTurn(); return; }
  const index = handAt(p);
  if (index >= 0) { ui.selected = index; ui.drag = { index, x:p.x, y:p.y, startX:p.x, startY:p.y }; sound('swish'); canvas.setPointerCapture(event.pointerId); return; }
  if (ui.selected >= 0) tryPlay(ui.selected, laneAt(p));
});
canvas.addEventListener('pointerup', event => {
  if (!ui.drag) return;
  const p = point(event); const drag = ui.drag; ui.drag = null;
  if (Math.hypot(p.x-drag.startX,p.y-drag.startY) > 25) tryPlay(drag.index, laneAt(p));
});
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (ui.screen === 'table') ui.screen = 'pause';
    else if (ui.screen === 'pause') ui.screen = 'table';
    else if (ui.screen === 'options') ui.screen = previousScreen;
    return;
  }
  if (ui.screen === 'title' && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); newGame(); return; }
  if (ui.screen !== 'table') return;
  if (event.key === ' ') { event.preventDefault(); finishTurn(); }
  if (/^[1-5]$/.test(event.key)) { ui.selected = Number(event.key)-1; sound('swish'); }
  if (/^[qwe]$/i.test(event.key) && ui.selected >= 0) tryPlay(ui.selected, 'qwe'.indexOf(event.key.toLowerCase()));
});
window.__shot = name => {
  state = setupShot(name);
  ui.screen = name === 'title' ? 'title' : name === 'victory' ? 'victory' : name === 'defeat' ? 'defeat' : 'table';
  ui.hover = name === 'cover' ? 2 : -1; ui.selected = -1; ui.drag = null;
  ui.burst = name === 'cover'; ui.damage = name === 'combo'; effectsUntil = 0;
  ui.dealAt = 0; ui.snapAt = 0; ui.shakeAt = 0;
};
window.__shotReady = true;
requestAnimationFrame(frame);
