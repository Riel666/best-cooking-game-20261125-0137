// Bootstrap: wire the game to the page, pose a screenshot state when the
// URL asks for one (?shot=cover, ?shot=orders, ?shot=assembly, ?shot=serve
// — see shots.js), run the self-test when asked (?selftest=1 or
// ?selftest=burn), otherwise show the title screen. The game repaints
// every animation frame while playing.
import { Game } from './game.js';
import { applyShot } from './shots.js';
import { recipeById } from './recipes.js';

const game = new Game(document);
window.__game = game;

const params = new URLSearchParams(window.location.search);
const selftestMode = params.get('selftest');
if (selftestMode === '1' || selftestMode === 'burn') {
  // Headless play-test, in fixed 1/60 s steps (no rAF: headless --dump-dom
  // produces no animation frames), reporting the result in the title and
  // #selftest. Mode 1 serves one Sunny Burger end to end; mode "burn"
  // grills a patty and lets it burn.
  game.startGame();
  // A deterministic first ticket so the scripted serve can match it.
  game.board.orders = [{
    id: 1,
    recipe: recipeById('sunny'),
    remaining: 50,
    max: 50,
  }];
  game.board.spawnIn = 999;
  game.selftest = { frames: 0, step: 0, result: null, mode: selftestMode };
  const report = document.createElement('div');
  report.id = 'selftest';
  report.style.cssText = 'position:fixed;left:0;top:0;z-index:99;background:#000;color:#fff;font:14px monospace;padding:4px 8px;';
  document.body.appendChild(report);
  const dt = 1 / 60;
  let guard = 0;
  while (!game.selftest.result && guard < 60 * 120) {
    game.debugDrive(dt);
    game.update(dt);
    guard++;
  }
  if (!game.selftest.result) game.selftest.result = 'FAIL self-test loop ran 120s without a result';
  game.draw();
  report.textContent = `SELFTEST ${game.selftest.result}`;
  document.title = `SELFTEST ${game.selftest.result}`;
} else {
  const posed = applyShot(game);
  if (!posed) game.showTitle();
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (game.state === 'play' && !game.frozen) game.update(dt);
    game.draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
