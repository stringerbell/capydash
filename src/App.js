import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import './styles/index.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  
  // Detect if the user is on a mobile device and orientation
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);
  
  const startGame = () => {
    // Request fullscreen when starting the game
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
    
    // Dispatch event to notify that game has started
    window.dispatchEvent(new Event('gameStart'));
    
    // Scroll to top to ensure game is fully visible
    window.scrollTo(0, 0);
    
    setGameStarted(true);
  };
  
  return (
    <div className="game-container">
      <h1 className="game-title">CapyDash</h1>
      {!gameStarted ? (
        isMobile ? (
          // Simpler mobile start screen
          <div className="mobile-start-screen">
            <h1>Welcome to CapyDash!</h1>
            <p>Jump over obstacles and survive</p>
            
            <div className="instructions">
              <p><span className="emoji">👆</span> Tap to jump</p>
              <p><span className="emoji">👆👆</span> Double tap to double jump</p>
              <p><span className="emoji">👆👆👆</span> Tap rapidly to jump repeatedly</p>
            </div>
            
            <button 
              className="start-button" 
              onClick={startGame}
            >
              START GAME
            </button>
          </div>
        ) : (
          // Desktop start screen
          <div className={`start-screen ${orientation}`}>
            <h1>Welcome to CapyDash!</h1>
            <p>Jump over obstacles and survive as long as you can</p>
            
            <p>Press SPACE to jump over obstacles</p>
            <p>Press SPACE again in mid-air to double jump!</p>
            <p>Hold SPACE to jump repeatedly when on the ground</p>
            
            <button className="start-button" onClick={startGame}>
              Start Game
            </button>
          </div>
        )
      ) : (
        <Game />
      )}
    </div>
  );
}

export default App; 