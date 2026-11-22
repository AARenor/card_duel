// Lanterns fight in three channels. Every card is a lantern creature; its rule
// resolves when it is played, before the creatures attack at the end of a turn.
const LANES = 3;
const MAX_LIFE = 24;
const MAX_ENERGY = 8;
const MAX_HAND = 5;
const LANE_NAMES = ['left', 'middle', 'right'];

const CARDS = [
  { name: 'Coal Diver', suit: 'ember', cost: 1, attack: 2, health: 1, kind: 'Diver', effect: 'flare', rule: 'Another Ember ally gives this +1 ATK.' },
  { name: 'Cinder Ray', suit: 'ember', cost: 2, attack: 2, health: 3, kind: 'Ray', effect: 'scorch', rule: 'Deal 1 damage to the unit opposite.' },
  { name: 'Furnace Keeper', suit: 'ember', cost: 3, attack: 3, health: 4, kind: 'Keeper', effect: 'after-diver', rule: 'If your last card was a Diver, gain +2 ATK.' },
  { name: 'Crown of Cinders', suit: 'ember', cost: 4, attack: 4, health: 4, kind: 'Monarch', effect: 'burn', rule: 'Deal 2 damage to the enemy lantern.' },
  { name: 'Pearl Scout', suit: 'tide', cost: 1, attack: 1, health: 2, kind: 'Scout', effect: 'draw', rule: 'Draw a card.' },
  { name: 'Undertow Caller', suit: 'tide', cost: 2, attack: 2, health: 2, kind: 'Caller', effect: 'return', rule: 'Return your latest discarded card to hand.' },
  { name: 'Coral Warden', suit: 'tide', cost: 2, attack: 1, health: 4, kind: 'Warden', effect: 'mend', rule: 'Restore 2 lantern health.' },
  { name: 'Tide Oracle', suit: 'tide', cost: 3, attack: 3, health: 3, kind: 'Oracle', effect: 'after-scout', rule: 'If your last card was a Scout, gain +2 HP.' },
  { name: 'Kelp Strider', suit: 'grove', cost: 1, attack: 1, health: 3, kind: 'Strider', effect: 'shelter', rule: 'If facing an enemy, gain +1 HP.' },
  { name: 'Moss Guardian', suit: 'grove', cost: 2, attack: 1, health: 4, kind: 'Guardian', effect: 'guard', rule: 'Give your other allies +1 HP.' },
  { name: 'Rootbound Stag', suit: 'grove', cost: 3, attack: 3, health: 4, kind: 'Stag', effect: 'after-warden', rule: 'If your last card was a Warden, gain +2 ATK.' },
  { name: 'Ancient Bloom', suit: 'grove', cost: 4, attack: 3, health: 5, kind: 'Bloom', effect: 'heal', rule: 'Restore 3 lantern health.' },
  { name: 'Lantern Moth', suit: 'star', cost: 1, attack: 1, health: 2, kind: 'Moth', effect: 'glimmer', rule: 'Another Star ally gives this +1 ATK.' },
  { name: 'Mirrorling', suit: 'star', cost: 2, attack: 1, health: 2, kind: 'Mirror', effect: 'copy', rule: 'Copy the ATK and max HP of your strongest ally.' },
  { name: 'Astral Weaver', suit: 'star', cost: 3, attack: 2, health: 4, kind: 'Weaver', effect: 'after-moth', rule: 'If your last card was a Moth, gain +2 ATK.' },
  { name: 'Starforged Leviathan', suit: 'star', cost: 4, attack: 4, health: 4, kind: 'Leviathan', effect: 'starlight', rule: 'Gain +1/+1 for each other Star ally.' },
];

const CARD_BY_KIND = Object.fromEntries(CARDS.map(card => [card.kind, card]));

function freshCard(kind) {
  return { ...CARD_BY_KIND[kind] };
}

function note(game, message) {
  game.log.push(message);
  if (game.log.length > 24) game.log.shift();
}

// Keep randomness in the state so a staged scene, including its future draws,
// is reproducible. Normal games receive a fresh seed.
function random(game) {
  let seed = game._seed;
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  game._seed = seed >>> 0;
  return game._seed / 4294967296;
}

function shuffle(game, cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random(game) * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
}

function makePlayer(game) {
  const deck = [];
  for (const card of CARDS) {
    for (let copy = 0; copy < 3; copy++) deck.push(freshCard(card.kind));
  }
  shuffle(game, deck);

  // Both captains open with an affordable same-suit pair. The remaining
  // cards and the pair's suit come from the shuffled deck.
  const firstIndex = deck.findIndex(card => card.cost === 1);
  const first = deck.splice(firstIndex, 1)[0];
  const secondIndex = deck.findIndex(card => card.suit === first.suit && card.cost === 2);
  const hand = [first, deck.splice(secondIndex, 1)[0]];
  while (hand.length < MAX_HAND) hand.push(deck.pop());
  return { life: MAX_LIFE, energy: 3, maxEnergy: 3, hand, deck, discard: [], lanes: Array(LANES).fill(null) };
}

function makeGame(seed) {
  const game = {
    players: [], turn: 1, active: 0, log: [], intent: '', result: null, combo: 0,
    _seed: (seed >>> 0) || 0x6d2b79f5,
    _turnsStarted: [1, 0], _suits: {}, _lastKind: null,
  };
  game.players.push(makePlayer(game), makePlayer(game));
  note(game, 'The current is yours. Play lanterns into the three channels.');
  updateIntent(game);
  return game;
}

export function createGame() {
  return makeGame(Math.floor(Math.random() * 4294967296));
}

function draw(game, side, count = 1) {
  const player = game.players[side];
  let drawn = 0;
  while (drawn < count && player.hand.length < MAX_HAND) {
    if (player.deck.length === 0 && player.discard.length) {
      player.deck = player.discard.splice(0);
      shuffle(game, player.deck);
      note(game, side === 0 ? 'Your discarded lanterns return to the deck.' : 'The rival recovers their discarded lanterns.');
    }
    if (player.deck.length === 0) break;
    player.hand.push(player.deck.pop());
    drawn++;
  }
  return drawn;
}

function discardUnit(player, lane) {
  const unit = player.lanes[lane];
  if (!unit) return;
  player.discard.push(freshCard(unit.kind));
  player.lanes[lane] = null;
}

function addHealth(unit, amount) {
  unit.maxHealth += amount;
  unit.health += amount;
}

function damageUnit(game, side, lane, amount) {
  const player = game.players[side];
  const unit = player.lanes[lane];
  if (!unit) return false;
  unit.health = Math.max(0, unit.health - amount);
  if (unit.health > 0) return false;
  discardUnit(player, lane);
  note(game, `${unit.name} sinks into the depths.`);
  return true;
}

function finishIfNeeded(game) {
  if (game.result) return true;
  if (game.players[0].life <= 0) {
    game.players[0].life = 0;
    game.result = 'defeat';
    game.intent = 'Your lantern has gone dark.';
    note(game, 'Your lantern goes dark. The deep takes this round.');
  } else if (game.players[1].life <= 0) {
    game.players[1].life = 0;
    game.result = 'victory';
    game.intent = 'The rival lantern is extinguished.';
    note(game, 'The rival lantern goes dark. You carry the light!');
  }
  return game.result !== null;
}

function resolveEffect(game, side, lane, unit) {
  const player = game.players[side];
  const enemy = game.players[1 - side];
  const otherAllies = () => player.lanes.filter((ally, index) => ally && index !== lane);
  switch (unit.effect) {
    case 'flare':
    case 'glimmer':
      if (otherAllies().some(ally => ally.suit === unit.suit)) unit.attack++;
      break;
    case 'scorch':
      if (enemy.lanes[lane]) damageUnit(game, 1 - side, lane, 1);
      break;
    case 'after-diver':
      if (game._lastKind === 'Diver') unit.attack += 2;
      break;
    case 'burn':
      enemy.life = Math.max(0, enemy.life - 2);
      note(game, `${unit.name} burns the opposing lantern for 2.`);
      break;
    case 'draw':
      if (draw(game, side)) note(game, `${unit.name} draws a card.`);
      break;
    case 'return':
      if (player.discard.length && player.hand.length < MAX_HAND) {
        const returned = player.discard.pop();
        player.hand.push(returned);
        note(game, `${unit.name} returns ${returned.name} to hand.`);
      }
      break;
    case 'mend':
      player.life = Math.min(MAX_LIFE, player.life + 2);
      break;
    case 'after-scout':
      if (game._lastKind === 'Scout') addHealth(unit, 2);
      break;
    case 'shelter':
      if (enemy.lanes[lane]) addHealth(unit, 1);
      break;
    case 'guard':
      for (const ally of otherAllies()) addHealth(ally, 1);
      break;
    case 'after-warden':
      if (game._lastKind === 'Warden') unit.attack += 2;
      break;
    case 'heal':
      player.life = Math.min(MAX_LIFE, player.life + 3);
      break;
    case 'copy': {
      let strongest = null;
      for (const ally of otherAllies()) {
        if (!strongest || ally.attack + ally.maxHealth > strongest.attack + strongest.maxHealth) strongest = ally;
      }
      if (strongest) {
        unit.attack = strongest.attack;
        unit.health = unit.maxHealth = strongest.maxHealth;
        note(game, `${unit.name} mirrors ${strongest.name}.`);
      }
      break;
    }
    case 'after-moth':
      if (game._lastKind === 'Moth') unit.attack += 2;
      break;
    case 'starlight': {
      const stars = otherAllies().filter(ally => ally.suit === 'star').length;
      unit.attack += stars;
      addHealth(unit, stars);
      break;
    }
  }
}

export function playCard(game, side, index, lane) {
  if (game.result || (side !== 0 && side !== 1) || game.active !== side ||
      !Number.isInteger(index) || !Number.isInteger(lane) || lane < 0 || lane >= LANES) return false;
  const player = game.players[side];
  const card = player.hand[index];
  if (!card || card.cost > player.energy) return false;

  player.hand.splice(index, 1);
  player.energy -= card.cost;
  if (player.lanes[lane]) {
    note(game, `${player.lanes[lane].name} makes way in the ${LANE_NAMES[lane]} channel.`);
    discardUnit(player, lane);
  }
  const unit = { ...card, maxHealth: card.health };
  player.lanes[lane] = unit;
  note(game, `${side === 0 ? 'You summon' : 'The rival summons'} ${unit.name} in the ${LANE_NAMES[lane]} channel.`);
  resolveEffect(game, side, lane, unit);

  // Each pair of a suit played during this turn gives the second card +1/+1.
  const count = (game._suits[card.suit] || 0) + 1;
  game._suits[card.suit] = count;
  if (count % 2 === 0) {
    unit.attack++;
    addHealth(unit, 1);
    game.combo++;
    note(game, `${card.suit[0].toUpperCase() + card.suit.slice(1)} harmony! ${unit.name} gains +1/+1.`);
  }
  game._lastKind = card.kind;
  finishIfNeeded(game);
  if (!game.result && side === 0) updateIntent(game);
  return true;
}

function attack(game, side) {
  const player = game.players[side];
  const enemy = game.players[1 - side];
  for (let lane = 0; lane < LANES && !game.result; lane++) {
    const unit = player.lanes[lane];
    if (!unit) continue;
    const target = enemy.lanes[lane];
    if (target) {
      note(game, `${unit.name} strikes ${target.name} for ${unit.attack}.`);
      damageUnit(game, 1 - side, lane, unit.attack);
    } else {
      enemy.life = Math.max(0, enemy.life - unit.attack);
      note(game, `${unit.name} hits ${side === 0 ? 'the rival' : 'your'} lantern for ${unit.attack}.`);
      finishIfNeeded(game);
    }
  }
}

function startTurn(game, side) {
  const player = game.players[side];
  game.active = side;
  if (game._turnsStarted[side] > 0) player.maxEnergy = Math.min(MAX_ENERGY, player.maxEnergy + 1);
  game._turnsStarted[side]++;
  player.energy = player.maxEnergy;
  game.combo = 0;
  game._suits = {};
  game._lastKind = null;
  if (side === 0) game.turn++;
  draw(game, side, 2);
  note(game, side === 0 ? `Turn ${game.turn}: your lanterns are ready.` : 'The rival gathers light.');
}

// Score every affordable card and channel, including what would be displaced.
// This makes the rival develop open lanes, finish exposed lanterns and avoid
// trading away a stronger creature just because it still has energy.
function scorePlay(game, side, card, lane, suits, lastKind) {
  const player = game.players[side];
  const enemy = game.players[1 - side];
  const previous = player.lanes[lane];
  const target = enemy.lanes[lane];
  let attackValue = card.attack;
  let healthValue = card.health;
  let bonus = 0;
  const allies = player.lanes.filter((ally, index) => ally && index !== lane);
  const suitAllies = allies.filter(ally => ally.suit === card.suit).length;

  if ((card.effect === 'flare' || card.effect === 'glimmer') && suitAllies) attackValue++;
  if ((card.effect === 'after-diver' && lastKind === 'Diver') ||
      (card.effect === 'after-warden' && lastKind === 'Warden') ||
      (card.effect === 'after-moth' && lastKind === 'Moth')) attackValue += 2;
  if (card.effect === 'after-scout' && lastKind === 'Scout') healthValue += 2;
  if (card.effect === 'shelter' && target) healthValue++;
  if (card.effect === 'starlight') { attackValue += suitAllies; healthValue += suitAllies; }
  if (card.effect === 'copy' && allies.length) {
    const strongest = allies.reduce((best, ally) => ally.attack + ally.maxHealth > best.attack + best.maxHealth ? ally : best);
    attackValue = strongest.attack;
    healthValue = strongest.maxHealth;
  }
  if ((suits[card.suit] || 0) % 2 === 1) { attackValue++; healthValue++; bonus += 1; }
  if (card.effect === 'guard') bonus += allies.length * 0.8;
  if (card.effect === 'draw' && (player.deck.length || player.discard.length)) bonus += 1.5;
  if (card.effect === 'return' && (player.discard.length || previous)) bonus += 2;
  if (card.effect === 'mend') bonus += Math.min(2, MAX_LIFE - player.life) * 0.8;
  if (card.effect === 'heal') bonus += Math.min(3, MAX_LIFE - player.life) * 0.8;
  if (card.effect === 'burn') bonus += enemy.life <= 2 ? 100 : 3;

  let score = attackValue * 2 + healthValue * 0.7 + 1 - card.cost * 0.45 + bonus;
  if (previous) score -= previous.attack * 2 + previous.health * 0.7 + 1.4;
  const targetHealth = target ? target.health - (card.effect === 'scorch' ? 1 : 0) : 0;
  if (!target || targetHealth <= 0) {
    score += attackValue * 0.8;
    if (enemy.life <= attackValue + (card.effect === 'burn' ? 2 : 0)) score += 100;
  } else if (targetHealth <= attackValue) {
    score += 3;
  }
  if (card.effect === 'scorch' && target) score += 1;
  return score;
}

function bestPlay(game, side, cards, energy, suits, lastKind) {
  let best = null;
  for (let index = 0; index < cards.length; index++) {
    const card = cards[index];
    if (card.cost > energy) continue;
    for (let lane = 0; lane < LANES; lane++) {
      const score = scorePlay(game, side, card, lane, suits, lastKind);
      if (score > 0 && (!best || score > best.score)) best = { index, lane, card, score };
    }
  }
  return best;
}

function updateIntent(game) {
  const rival = game.players[1];
  const cards = rival.hand.slice();
  // Preview the cards the rival can draw, without changing either deck.
  for (let i = rival.deck.length - 1, drawn = 0; i >= 0 && drawn < 2 && cards.length < MAX_HAND; i--, drawn++) {
    cards.push(rival.deck[i]);
  }
  const energy = Math.min(MAX_ENERGY, rival.maxEnergy + (game._turnsStarted[1] > 0 ? 1 : 0));
  const plan = bestPlay(game, 1, cards, energy, {}, null);
  game.intent = plan ? `Eyeing ${plan.card.name} in the ${LANE_NAMES[plan.lane]} channel.` : 'Gathering light for the next tide.';
}

function rivalTurn(game) {
  while (!game.result) {
    const rival = game.players[1];
    const plan = bestPlay(game, 1, rival.hand, rival.energy, game._suits, game._lastKind);
    if (!plan || !playCard(game, 1, plan.index, plan.lane)) break;
  }
}

// The human ends a round: their lanterns strike, then the rival draws, plays
// its scored moves and strikes. Control returns with a refreshed human turn.
export function endTurn(game) {
  if (game.result || (game.active !== 0 && game.active !== 1)) return false;
  if (game.active === 0) {
    attack(game, 0);
    if (game.result) return true;
    startTurn(game, 1);
  }
  rivalTurn(game);
  if (game.result) return true;
  attack(game, 1);
  if (game.result) return true;
  startTurn(game, 0);
  updateIntent(game);
  return true;
}

// Screenshot scenes use real cards removed from their seeded decks so they can
// also be played on from the staged position without duplicating any cards.
export function setupShot(name) {
  const game = makeGame(0x1a47e2d5);
  const handKinds = [
    ['Diver', 'Ray', 'Warden', 'Moth', 'Bloom'],
    ['Scout', 'Caller', 'Diver', 'Moth', 'Leviathan'],
  ];
  const laneKinds = [
    [['Strider', 2, 3], ['Ray', 3, 2], ['Mirror', 3, 3]],
    [['Guardian', 2, 3], ['Oracle', 3, 3], ['Keeper', 4, 3]],
  ];
  game.players.forEach((player, side) => {
    const pool = player.deck.concat(player.hand);
    const take = kind => pool.splice(pool.findIndex(card => card.kind === kind), 1)[0];
    player.hand = handKinds[side].map(take);
    player.lanes = laneKinds[side].map(([kind, attackValue, health]) => {
      const card = take(kind);
      return { ...card, attack: attackValue, health, maxHealth: Math.max(card.health, health) };
    });
    player.deck = pool;
    player.discard = [];
    player.life = side === 0 ? 18 : 15;
    player.maxEnergy = 5;
    player.energy = side === 0 ? 3 : 5;
  });
  game.turn = 4;
  game._turnsStarted = [4, 3];
  game.combo = name === 'combo' || name === 'cover' ? 1 : 0;
  game._suits = game.combo ? { ember: 2 } : {};
  game._lastKind = game.combo ? 'Ray' : null;
  game.log = game.combo
    ? ['The lanterns gather in the deep.', 'Ember harmony! Cinder Ray gains +1/+1.']
    : ['The lanterns gather in the deep.', 'Choose a card and a channel to summon it.'];
  updateIntent(game);
  if (name === 'victory') {
    game.players[1].life = 0;
    game.result = 'victory';
    game.intent = 'The rival lantern is extinguished.';
    note(game, 'The rival lantern goes dark. You carry the light!');
  } else if (name === 'defeat') {
    game.players[0].life = 0;
    game.result = 'defeat';
    game.intent = 'Your lantern has gone dark.';
    note(game, 'Your lantern goes dark. The deep takes this round.');
  }
  return game;
}
