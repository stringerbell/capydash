import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import './styles/index.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect if the user is on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const startGame = () => {
    // Request fullscreen when starting the game
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
    setGameStarted(true);
  };
  
  return (
    <div className="game-container">
      <h1 className="game-title">CapyDash</h1>
      {!gameStarted ? (
        <div className="start-screen">
          <h1>Welcome to CapyDash!</h1>
          <p>Jump over obstacles and survive as long as you can</p>
          
          {isMobile ? (
            <div className="mobile-instructions">
              <p><span className="emoji">👆</span> Tap anywhere on screen to jump</p>
              <p><span className="emoji">👆👆</span> Tap again while in the air to double jump!</p>
              <p><span className="emoji">👆👆👆</span> Tap rapidly to jump repeatedly</p>
              <p className="tip">For best experience, keep your finger ready near the center of the screen</p>
              
              <button className="start-button" onClick={startGame}>
                Start Game
              </button>
            </div>
          ) : (
            <>
              <p>Press SPACE to jump over obstacles</p>
              <p>Press SPACE again in mid-air to double jump!</p>
              <p>Hold SPACE to jump repeatedly when on the ground</p>
              
              <button className="start-button" onClick={startGame}>
                Start Game
              </button>
            </>
          )}
        </div>
      ) : (
        <Game />
      )}
    </div>
  );
}

export default App; 