// Posed states for the entry's screenshots (shots.json). A ?shot= value
// puts the game into a state a real play session reaches, so the
// screenshots are honest renders of the game itself: same code, same
// state, only the path there is a query instead of keys and clicks.
import { recipeById } from './recipes.js';

function setOrder(game, recipeId, remaining, max) {
  const recipe = recipeById(recipeId);
  game.board.orders = [{ id: 1, recipe, remaining, max }];
  game.board.spawnIn = 999;
}

export function applyShot(game) {
  const shot = new URLSearchParams(window.location.search).get('shot');
  if (!shot) return false;
  game.startGame();
  game.frozen = true;
  if (shot === 'cover') {
    // Mid-service: two tickets on the board, the chef chopping a tomato at
    // the board, a bun and cheese already on the plate, the clock running.
    setOrder(game, 'sunny', 38, 52);
    game.board.orders.push({ id: 2, recipe: recipeById('garden'), remaining: 26, max: 52 });
    game.board.spawnIn = 999;
    game.elapsed = 68;
    game.timeLeft = 112;
    game.score = 340;
    game.combo = 2;
    game.plating = [{ kind: 'bun', state: 'raw' }, { kind: 'cheese', state: 'raw' }];
    game.player.x = 124;
    game.player.y = 392;
    game.player.dir = -1;
    game.player.hand = { kind: 'tomato', state: 'raw' };
    game.chop = { t: 0.7 };
    game.setMessage('Chopping… hold E.');
    game.updateHud();
    game.draw();
    return true;
  }
  if (shot === 'orders') {
    // The rush: three tickets, one nearly out of patience, the chef
    // carrying a grilled patty toward the plating counter.
    setOrder(game, 'thyme', 9, 44);
    game.board.orders.push({ id: 2, recipe: recipeById('sunny'), remaining: 22, max: 44 });
    game.board.orders.push({ id: 3, recipe: recipeById('melt'), remaining: 31, max: 44 });
    game.board.spawnIn = 999;
    game.elapsed = 131;
    game.timeLeft = 49;
    game.score = 980;
    game.combo = 3;
    game.plating = [{ kind: 'bun', state: 'raw' }];
    game.player.x = 620;
    game.player.y = 240;
    game.player.dir = 1;
    game.player.hand = { kind: 'patty', state: 'grilled' };
    game.setMessage('Grilled patty in hand — onto the plate!');
    game.updateHud();
    game.draw();
    return true;
  }
  if (shot === 'assembly') {
    // One dish mid-assembly: bun, grilled patty and cheese on the plate,
    // the chef adding the chopped tomato that finishes it.
    setOrder(game, 'sunny', 30, 52);
    game.board.spawnIn = 999;
    game.elapsed = 74;
    game.timeLeft = 106;
    game.score = 410;
    game.combo = 2;
    game.plating = [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'grilled' },
      { kind: 'cheese', state: 'raw' },
    ];
    game.player.x = 480;
    game.player.y = 430;
    game.player.dir = 1;
    game.player.hand = { kind: 'tomato', state: 'chopped' };
    game.setMessage('Chopped Tomato — ready for the plate.');
    game.updateHud();
    game.draw();
    return true;
  }
  if (shot === 'serve') {
    // The plate is finished and in the chef's hands at the serving window,
    // the matching ticket highlighted, ready to serve.
    setOrder(game, 'sunny', 24, 52);
    game.board.spawnIn = 999;
    game.elapsed = 82;
    game.timeLeft = 98;
    game.score = 520;
    game.combo = 2;
    game.plateOnStation = false;
    game.plating = [];
    game.player.x = 844;
    game.player.y = 400;
    game.player.dir = 1;
    game.player.hand = {
      plate: true,
      items: [
        { kind: 'bun', state: 'raw' },
        { kind: 'patty', state: 'grilled' },
        { kind: 'cheese', state: 'raw' },
        { kind: 'tomato', state: 'chopped' },
      ],
    };
    game.setMessage('Plate in hand — serve it at the window.');
    game.updateHud();
    game.draw();
    return true;
  }
  return false;
}
