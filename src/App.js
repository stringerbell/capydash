import React, { useState } from 'react';
import Game from './components/Game';
import './styles/index.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  
  return (
    <div className="game-container">
      <h1 className="game-title">CapyDash</h1>
      {!gameStarted ? (
        <div className="start-screen">
          <h2>Welcome to CapyDash!</h2>
          <p>Press SPACE to jump over obstacles</p>
          <p>Press SPACE again in mid-air to double jump!</p>
          <p>Hold SPACE to jump repeatedly when on the ground</p>
          <button className="start-button" onClick={() => setGameStarted(true)}>
            Start Game
          </button>
        </div>
      ) : (
        <Game />
      )}
    </div>
  );
}

export default App; 