# Lanterns of the Deep

A solitary keeper duels a rival beneath the sea, sending luminous creatures down three lanes and weaving their suits together. It runs entirely offline in a desktop browser.

## Rules

Both keepers begin with 20 life. Play a card by spending its energy and choosing a lane. Units strike the opposing lane at the end of their owner's turn; an opposing unit blocks the strike, otherwise it reaches the keeper. Playing a unit into an occupied friendly lane replaces the old unit. Reduce the rival to zero life before your own runs out.

Energy starts at three and grows each turn, up to eight. Draw up to two cards each turn, with a five-card hand limit. Playing two cards of the same suit in one turn creates a resonance bonus; some cards also reward a particular preceding kind or return cards. The rival's intent hints at its plan. Read each card's rule before choosing a lane.

## Controls

Drag a card to a lane, or click a card and then a lane. Keys 1–5 select a hand card; Q, W, E choose the left, middle or right lane. Space ends the turn; Escape pauses. The pause screen offers volume and animation speed settings.

## Run

From the repository root, run `python3 -m http.server` and open `http://localhost:8000/game/` in a desktop browser. No build step or network connection is needed once the page is served.

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/AARenor/card_duel/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/AARenor/card_duel/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
