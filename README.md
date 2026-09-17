# Legends Steal Advantage

Mobile-first game-day web app for comparing runner steal baselines against the current pitcher/catcher battery.

## Runner timing protocol
For each player, record three game-speed trials from the pitcher's first movement until the runner touches second base. The app averages the three trials and stores that as the player's current baseline.

## Game day
- Pitcher: first movement -> catcher receives pitch.
- Catcher: receives pitch -> throw received at second.
- Defense time = pitcher average + catcher pop average.
- Timing edge = defense time - runner baseline.

The default Green/Read/Hold cushions are configurable and should be treated as coaching decision aids rather than guarantees.

## Data privacy
The repository contains the roster but no player timing baselines. Player timing data and game-day opponent timing data are stored locally in the browser on the device where they are entered.

## GitHub Pages
Enable GitHub Pages from the repository's `main` branch and root folder. `index.html` is at the repository root.