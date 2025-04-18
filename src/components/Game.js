import React, { useState, useEffect, useRef, useCallback } from 'react';
import Character from './Character';
import Obstacle from './Obstacle';
import '../styles/game.css';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const GRAVITY = 1;
const JUMP_FORCE = -16;
const INITIAL_OBSTACLE_SPEED = 9;
const GROUND_HEIGHT = 50;

// Difficulty levels - more challenging progression
const DIFFICULTY_LEVELS = [
  { name: "Normal", speedMultiplier: 1.0, obstacleFrequency: 2000, platformFrequency: 4000 }, // Faster initial frequencies
  { name: "Hard", speedMultiplier: 1.3, obstacleFrequency: 1700, platformFrequency: 3500 },
  { name: "Very Hard", speedMultiplier: 1.6, obstacleFrequency: 1500, platformFrequency: 3000 },
  { name: "Extreme", speedMultiplier: 2.0, obstacleFrequency: 1300, platformFrequency: 2500 },
  { name: "Impossible", speedMultiplier: 2.5, obstacleFrequency: 1100, platformFrequency: 2000 },
  { name: "Nightmare", speedMultiplier: 3.0, obstacleFrequency: 900, platformFrequency: 1800 }
];

const Game = () => {
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [characterPosition, setCharacterPosition] = useState({ 
    x: 100, 
    y: GAME_HEIGHT - GROUND_HEIGHT - 40,
    velocityY: 0,
    isJumping: false,
    onPlatform: false,
    jumpCount: 0
  });
  const [obstacles, setObstacles] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [lastJumpTime, setLastJumpTime] = useState(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(INITIAL_OBSTACLE_SPEED);
  
  // Background parallax positions
  const [backgroundPositions, setBackgroundPositions] = useState({
    stars: 0,
    mountains: 0,
    city: 0,
    grid: 0
  });

  const requestRef = useRef();
  const lastTimeRef = useRef(0);
  const obstacleTimerRef = useRef(null);
  const platformTimerRef = useRef(null);
  const difficultyTimerRef = useRef(null);

  // Jump function with useCallback
  const jump = useCallback(() => {
    if (!gameOver) {
      // Allow jump if on ground/platform or if we can double jump (only once in the air)
      if (!characterPosition.isJumping || characterPosition.jumpCount < 1) {
        setCharacterPosition(prev => ({
          ...prev,
          velocityY: JUMP_FORCE,
          isJumping: true,
          jumpCount: prev.isJumping ? prev.jumpCount + 1 : 0
        }));
        setLastJumpTime(Date.now());
      }
    }
  }, [gameOver, characterPosition.isJumping, characterPosition.jumpCount]);

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
        jump();
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed, jump]);

  // Handle repeated jumping when space is held down
  useEffect(() => {
    if (isSpacePressed) {
      const now = Date.now();
      if (now - lastJumpTime > 300) {
        // For auto-repeat jumps, only allow when on ground/platform
        if (!characterPosition.isJumping) {
          jump();
        }
      }
    }
  }, [isSpacePressed, characterPosition.isJumping, lastJumpTime, jump]);

  // Function to start obstacle generation
  const startObstacleGeneration = useCallback((frequency) => {
    obstacleTimerRef.current = setInterval(() => {
      // Check if we should add a spike field or a standard obstacle
      if (Math.random() > 0.7) {
        // Create a field of spikes (small triangles)
        const spikeCount = Math.floor(Math.random() * 5) + 3; // 3-7 spikes
        const spikes = [];
        
        for (let i = 0; i < spikeCount; i++) {
          spikes.push({
            id: Date.now() + i,
            x: GAME_WIDTH + (i * 30), // Space them out
            y: GAME_HEIGHT - GROUND_HEIGHT - 20, // Smaller height for spikes
            width: 20,
            height: 20,
            passed: false,
            type: 'spike'
          });
        }
        
        setObstacles(prev => [...prev, ...spikes]);
      } else {
        // Normal obstacles (blocks and triangles)
        const randomHeight = Math.random() > 0.5 ? 40 : 30;
        setObstacles(prev => [
          ...prev, 
          { 
            id: Date.now(),
            x: GAME_WIDTH,
            y: GAME_HEIGHT - GROUND_HEIGHT - randomHeight,
            width: 40,
            height: randomHeight,
            passed: false,
            type: Math.random() > 0.5 ? 'triangle' : 'block'
          }
        ]);
      }
    }, frequency);
  }, []);

  // Function to start platform generation
  const startPlatformGeneration = useCallback((frequency) => {
    platformTimerRef.current = setInterval(() => {
      if (Math.random() > 0.5) {
        // Generate a column/platform
        const platformHeight = Math.floor(Math.random() * 3) + 1; // 1-3 platform height units
        const height = platformHeight * 50; // Height in pixels
        
        setPlatforms(prev => [
          ...prev,
          {
            id: Date.now(),
            x: GAME_WIDTH,
            y: GAME_HEIGHT - GROUND_HEIGHT - height,
            width: 80,
            height: height,
            type: 'column',
            hasRing: Math.random() > 0.7 // Some columns have rings
          }
        ]);
      } else {
        // Generate a ramp
        const rampHeight = Math.floor(Math.random() * 2) + 1; // 1-2 platform height units
        const height = rampHeight * 60; // Height in pixels
        
        setPlatforms(prev => [
          ...prev,
          {
            id: Date.now(),
            x: GAME_WIDTH,
            y: GAME_HEIGHT - GROUND_HEIGHT - height,
            width: 120,
            height: height,
            type: 'ramp'
          }
        ]);
      }
    }, frequency);
  }, []);

  // Progressive difficulty increase
  useEffect(() => {
    if (!gameOver) {
      difficultyTimerRef.current = setInterval(() => {
        const newDifficulty = Math.min(difficultyLevel + 1, DIFFICULTY_LEVELS.length - 1);
        setDifficultyLevel(newDifficulty);
        
        // Update game speed based on new difficulty
        const newSpeed = INITIAL_OBSTACLE_SPEED * DIFFICULTY_LEVELS[newDifficulty].speedMultiplier;
        setGameSpeed(newSpeed);
        
        // Clear and reset obstacle timers with new frequency
        if (obstacleTimerRef.current) {
          clearInterval(obstacleTimerRef.current);
          startObstacleGeneration(DIFFICULTY_LEVELS[newDifficulty].obstacleFrequency);
        }
        
        // Clear and reset platform timers with new frequency
        if (platformTimerRef.current) {
          clearInterval(platformTimerRef.current);
          startPlatformGeneration(DIFFICULTY_LEVELS[newDifficulty].platformFrequency);
        }
      }, 20000); // Decreased from 30000 to 20000 - faster difficulty progression
    }
    
    return () => {
      if (difficultyTimerRef.current) {
        clearInterval(difficultyTimerRef.current);
      }
    };
  }, [gameOver, difficultyLevel, startObstacleGeneration, startPlatformGeneration]);

  // Generate obstacles
  useEffect(() => {
    if (!gameOver) {
      const currentDifficulty = DIFFICULTY_LEVELS[difficultyLevel];
      startObstacleGeneration(currentDifficulty.obstacleFrequency);
    }

    return () => {
      if (obstacleTimerRef.current) {
        clearInterval(obstacleTimerRef.current);
      }
    };
  }, [gameOver, difficultyLevel, startObstacleGeneration]);

  // Generate platforms (columns and ramps)
  useEffect(() => {
    if (!gameOver) {
      const currentDifficulty = DIFFICULTY_LEVELS[difficultyLevel];
      startPlatformGeneration(currentDifficulty.platformFrequency);
    }

    return () => {
      if (platformTimerRef.current) {
        clearInterval(platformTimerRef.current);
      }
    };
  }, [gameOver, difficultyLevel, startPlatformGeneration]);

  // Game loop
  useEffect(() => {
    const gameLoop = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      lastTimeRef.current = timestamp;

      // Update character
      setCharacterPosition(prev => {
        let newVelocityY = prev.velocityY + GRAVITY;
        let newY = prev.y + newVelocityY;
        let onPlatform = false;
        let jumpCount = prev.jumpCount;
        
        // Check for platform collisions (standing on platforms)
        platforms.forEach(platform => {
          const charBottom = prev.y + 40;
          const charRight = prev.x + 40;
          const charLeft = prev.x;
          
          const platformTop = platform.y;
          // We don't need platformBottom in this implementation, removing to fix warning
          const platformRight = platform.x + platform.width;
          const platformLeft = platform.x;
          
          // If character is falling onto a platform
          if (newVelocityY > 0 && 
              charBottom <= platformTop && 
              newY + 40 >= platformTop &&
              charRight > platformLeft && 
              charLeft < platformRight) {
                
            newY = platformTop - 40; // Stand on the platform
            newVelocityY = 0;
            onPlatform = true;
            jumpCount = 0; // Reset jump count when landing
          }
          
          // For ramps, allow sliding up if moving into them
          if (platform.type === 'ramp' && 
              charRight > platformLeft && 
              charLeft < platformRight) {
            
            // Calculate position on the ramp based on x
            const rampProgress = (charRight - platformLeft) / platform.width;
            const rampY = platformTop + platform.height * (1 - rampProgress);
            
            // If character is above the ramp line
            if (charBottom >= rampY - 5 && charBottom <= rampY + 5) {
              newY = rampY - 40;
              onPlatform = true;
              jumpCount = 0; // Reset jump count when on ramp
            }
          }
        });
        
        const groundY = GAME_HEIGHT - GROUND_HEIGHT - 40;
        
        // Check if character is on the ground
        if (newY >= groundY && !onPlatform) {
          newY = groundY;
          newVelocityY = 0;
          onPlatform = true;
          jumpCount = 0; // Reset jump count when landing on ground
        }
        
        return {
          ...prev,
          y: newY,
          velocityY: newVelocityY,
          isJumping: !onPlatform,
          onPlatform,
          jumpCount
        };
      });

      // Update obstacles with current game speed
      setObstacles(prev => {
        return prev
          .map(obstacle => ({
            ...obstacle,
            x: obstacle.x - gameSpeed
          }))
          .filter(obstacle => obstacle.x > -100);
      });
      
      // Update platforms with current game speed
      setPlatforms(prev => {
        return prev
          .map(platform => ({
            ...platform,
            x: platform.x - gameSpeed
          }))
          .filter(platform => platform.x > -200);
      });
      
      // Update background positions for parallax effect with speed scaled to difficulty
      const speedFactor = difficultyLevel > 0 ? 1 + (difficultyLevel * 0.1) : 1;
      setBackgroundPositions(prev => ({
        stars: (prev.stars - gameSpeed * 0.2 * speedFactor) % (GAME_WIDTH * 2),
        mountains: (prev.mountains - gameSpeed * 0.4 * speedFactor) % (GAME_WIDTH * 2),
        city: (prev.city - gameSpeed * 0.6 * speedFactor) % (GAME_WIDTH * 2),
        grid: (prev.grid - gameSpeed * 0.8 * speedFactor) % (GAME_WIDTH * 2)
      }));

      // Check for collisions and scoring
      const charPos = { 
        x: characterPosition.x,
        y: characterPosition.y,
        width: 40,
        height: 40
      };

      setObstacles(prev => {
        let scoreIncreased = false;
        
        prev.forEach(obstacle => {
          // Different collision detection for different obstacle types
          if (obstacle.type === 'triangle') {
            // Triangle hit box is smaller than visual representation
            const triangleHitbox = {
              x: obstacle.x + 10, // Add padding to make hitbox smaller
              y: obstacle.y + 20, // Raise hitbox from bottom
              width: 20, // Make hitbox narrower
              height: 20  // Make hitbox shorter
            };
            
            if (checkCollision(charPos, triangleHitbox)) {
              setGameOver(true);
            }
          } else if (obstacle.type === 'spike') {
            // Spike hit box is very small
            const spikeHitbox = {
              x: obstacle.x + 5,
              y: obstacle.y + 5,
              width: 10,
              height: 15
            };
            
            if (checkCollision(charPos, spikeHitbox)) {
              setGameOver(true);
            }
          } else {
            // Standard rectangular collision for blocks
            if (checkCollision(charPos, obstacle)) {
              setGameOver(true);
            }
          }

          // Update score when passing an obstacle
          if (!obstacle.passed && charPos.x > obstacle.x + obstacle.width) {
            obstacle.passed = true;
            scoreIncreased = true;
          }
        });

        if (scoreIncreased) {
          setScore(prev => prev + 1);
          
          // Increase difficulty based on score milestones
          if (score > 0 && score % 15 === 0) {
            const newDifficulty = Math.min(difficultyLevel + 1, DIFFICULTY_LEVELS.length - 1);
            if (newDifficulty > difficultyLevel) {
              setDifficultyLevel(newDifficulty);
              setGameSpeed(INITIAL_OBSTACLE_SPEED * DIFFICULTY_LEVELS[newDifficulty].speedMultiplier);
            }
          }
        }

        return prev;
      });

      if (!gameOver) {
        requestRef.current = requestAnimationFrame(gameLoop);
      }
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameOver, characterPosition.x, characterPosition.y, platforms, gameSpeed, difficultyLevel, score]);

  // Helper function for collision detection
  const checkCollision = (rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  const restartGame = () => {
    setGameOver(false);
    setScore(0);
    setDifficultyLevel(0);
    setGameSpeed(INITIAL_OBSTACLE_SPEED);
    setCharacterPosition({ 
      x: 100, 
      y: GAME_HEIGHT - GROUND_HEIGHT - 40,
      velocityY: 0,
      isJumping: false,
      onPlatform: false,
      jumpCount: 0
    });
    setObstacles([]);
    setPlatforms([]);
    setBackgroundPositions({
      stars: 0,
      mountains: 0,
      city: 0,
      grid: 0
    });
    lastTimeRef.current = 0;
  };

  return (
    <div 
      className="game-area"
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT, background: "#151560" }}
    >
      {/* Parallax background layers */}
      <div 
        className="background-layer stars" 
        style={{ left: backgroundPositions.stars }}
      />
      <div 
        className="background-layer mountains"
        style={{ left: backgroundPositions.mountains }}
      />
      <div 
        className="background-layer city"
        style={{ left: backgroundPositions.city }}
      />
      <div 
        className="background-layer grid"
        style={{ left: backgroundPositions.grid }}
      />
      
      <div className="score">Score: {score}</div>
      <div className="difficulty-indicator">
        Level: {DIFFICULTY_LEVELS[difficultyLevel].name} (x{DIFFICULTY_LEVELS[difficultyLevel].speedMultiplier.toFixed(1)})
      </div>
      
      <Character 
        position={characterPosition} 
        isJumping={characterPosition.isJumping}
        jumpCount={characterPosition.jumpCount}
      />
      
      {/* Render Platforms */}
      {platforms.map(platform => (
        <div 
          key={platform.id}
          className={`platform ${platform.type}`}
          style={{
            left: platform.x,
            top: platform.y,
            width: platform.width,
            height: platform.height
          }}
        >
          {platform.hasRing && (
            <div className="ring"></div>
          )}
        </div>
      ))}
      
      {obstacles.map(obstacle => (
        <Obstacle key={obstacle.id} obstacle={obstacle} />
      ))}
      
      <div className="ground" />
      
      {gameOver && (
        <div className="game-over">
          <div>Game Over</div>
          <div>Your Score: {score}</div>
          <button className="start-button" onClick={restartGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default Game; 