# CapyDash

A Geometry Dash-inspired side-scrolling game built with React. The game features a character (which will eventually be a capybara or axolotl) that jumps over obstacles.

## Features

- Side-scrolling gameplay similar to Geometry Dash
- Jump mechanics with space bar
- Hold space to jump repeatedly
- Obstacle avoidance
- Score tracking
- Game over and restart functionality

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm start
# or
yarn start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Game Controls

- Press SPACE to jump
- Hold SPACE to jump repeatedly
- Timing is crucial to avoid obstacles

## Development

The game is built using React and uses requestAnimationFrame for the game loop. Key aspects of the implementation:

- Game physics for jumping and gravity
- Collision detection
- Obstacle generation
- Score tracking

## Future Enhancements

- Replace the current square character with a capybara or axolotl graphic
- Add background music and sound effects
- Implement different levels with increasing difficulty
- Add power-ups and special abilities
- Implement high score tracking 