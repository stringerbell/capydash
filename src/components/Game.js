import React, { useState, useEffect, useRef, useCallback } from 'react';
import Character from './Character';
import Obstacle from './Obstacle';
import '../styles/game.css';
import capybaraPattern from '../assets/Cute_Capybara_Character_Seamless_Pattern_high_resolution_preview_2105908.jpg';
import normalMusic from '../assets/normal.mp3';
import alternateMusic from '../assets/alternate.mp3';

// Using window dimensions for full-screen
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
const GRAVITY = 0.8;
const JUMP_FORCE = -18;
const INITIAL_OBSTACLE_SPEED = 9;
const GROUND_HEIGHT = 60;
const CHARACTER_SIZE = 90;

// Difficulty levels - more challenging progression
const DIFFICULTY_LEVELS = [
  { name: "Normal", speedMultiplier: 1.0, obstacleFrequency: 2000, platformFrequency: 4000 },
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
    x: GAME_WIDTH * 0.15, // Positioned proportionally to screen width
    y: GAME_HEIGHT - GROUND_HEIGHT - CHARACTER_SIZE,
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
  const [musicTrack, setMusicTrack] = useState(Math.random() > 0.5 ? normalMusic : alternateMusic);
  const [isMuted, setIsMuted] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
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
  const audioRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // Adjust character position on resize to maintain proper position relative to ground
      setCharacterPosition(prev => ({
        ...prev,
        x: window.innerWidth * 0.15,
        y: window.innerHeight - GROUND_HEIGHT - CHARACTER_SIZE
      }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Jump function with useCallback
  const jump = useCallback(() => {
    if (!gameOver) {
      // Allow jump if on ground/platform or if we can double jump (only once in the air)
      if (!characterPosition.isJumping || characterPosition.jumpCount < 1) {
        // Add an immediate position boost for more responsive jumping
        const jumpBoost = characterPosition.isJumping ? 0 : 5; // Only boost on first jump
        
        setCharacterPosition(prev => ({
          ...prev,
          velocityY: JUMP_FORCE,
          y: prev.y - jumpBoost, // Apply immediate position boost
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
            x: windowDimensions.width + (i * 30), // Space them out
            y: windowDimensions.height - GROUND_HEIGHT - 30, // Smaller height for spikes
            width: 30,
            height: 30,
            passed: false,
            type: 'spike'
          });
        }
        
        setObstacles(prev => [...prev, ...spikes]);
      } else {
        // Normal obstacles (blocks and triangles)
        const randomHeight = Math.random() > 0.5 ? 60 : 45; // Increased obstacle sizes
        setObstacles(prev => [
          ...prev, 
          { 
            id: Date.now(),
            x: windowDimensions.width,
            y: windowDimensions.height - GROUND_HEIGHT - randomHeight,
            width: 60, // Increased from 40 to 60
            height: randomHeight,
            passed: false,
            type: Math.random() > 0.5 ? 'triangle' : 'block'
          }
        ]);
      }
    }, frequency);
  }, [windowDimensions]);

  // Function to start platform generation
  const startPlatformGeneration = useCallback((frequency) => {
    platformTimerRef.current = setInterval(() => {
      if (Math.random() > 0.5) {
        // Generate a column/platform
        const platformHeight = Math.floor(Math.random() * 3) + 1; // 1-3 platform height units
        const height = platformHeight * 70; // Increased height in pixels
        
        setPlatforms(prev => [
          ...prev,
          {
            id: Date.now(),
            x: windowDimensions.width,
            y: windowDimensions.height - GROUND_HEIGHT - height,
            width: 120, // Increased from 80 to 120
            height: height,
            type: 'column',
            hasRing: Math.random() > 0.7 // Some columns have rings
          }
        ]);
      } else {
        // Generate a ramp
        const rampHeight = Math.floor(Math.random() * 2) + 1; // 1-2 platform height units
        const height = rampHeight * 80; // Increased height in pixels
        
        setPlatforms(prev => [
          ...prev,
          {
            id: Date.now(),
            x: windowDimensions.width,
            y: windowDimensions.height - GROUND_HEIGHT - height,
            width: 160, // Increased from 120 to 160
            height: height,
            type: 'ramp'
          }
        ]);
      }
    }, frequency);
  }, [windowDimensions]);

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

  // Background music
  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(musicTrack);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    
    // Start playing when the game starts
    if (!gameOver && !isMuted) {
      audioRef.current.play().catch(error => {
        console.log("Audio play failed:", error);
      });
    } else {
      // Pause when game is over or muted
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [gameOver, musicTrack, isMuted]);

  // Effect to toggle mute/unmute
  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.pause();
      } else if (!gameOver) {
        audioRef.current.play().catch(error => {
          console.log("Audio play failed:", error);
        });
      }
    }
  }, [isMuted, gameOver]);

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
        // Apply more velocity at the start of a jump for better responsiveness
        const gravityFactor = prev.velocityY < 0 ? 0.85 : 1; // Less gravity when going up
        let newVelocityY = prev.velocityY + (GRAVITY * gravityFactor);
        let newY = prev.y + newVelocityY;
        let onPlatform = false;
        let jumpCount = prev.jumpCount;
        
        // Check for platform collisions (standing on platforms)
        platforms.forEach(platform => {
          const charBottom = prev.y + CHARACTER_SIZE;
          const charRight = prev.x + CHARACTER_SIZE;
          const charLeft = prev.x;
          
          const platformTop = platform.y;
          // We don't need platformBottom in this implementation, removing to fix warning
          const platformRight = platform.x + platform.width;
          const platformLeft = platform.x;
          
          // If character is falling onto a platform
          if (newVelocityY > 0 && 
              charBottom <= platformTop && 
              newY + CHARACTER_SIZE >= platformTop &&
              charRight > platformLeft && 
              charLeft < platformRight) {
                
            newY = platformTop - CHARACTER_SIZE; // Stand on the platform
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
              newY = rampY - CHARACTER_SIZE;
              onPlatform = true;
              jumpCount = 0; // Reset jump count when on ramp
            }
          }
        });
        
        const groundY = windowDimensions.height - GROUND_HEIGHT - CHARACTER_SIZE;
        
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
        stars: (prev.stars - gameSpeed * 0.2 * speedFactor) % (windowDimensions.width * 2),
        mountains: (prev.mountains - gameSpeed * 0.4 * speedFactor) % (windowDimensions.width * 2),
        city: (prev.city - gameSpeed * 0.6 * speedFactor) % (windowDimensions.width * 2),
        grid: (prev.grid - gameSpeed * 0.8 * speedFactor) % (windowDimensions.width * 2)
      }));

      // Check for collisions and scoring
      const charPos = { 
        x: characterPosition.x,
        y: characterPosition.y,
        width: CHARACTER_SIZE,
        height: CHARACTER_SIZE
      };

      setObstacles(prev => {
        let scoreIncreased = false;
        
        prev.forEach(obstacle => {
          // Different collision detection for different obstacle types
          if (obstacle.type === 'triangle') {
            // Triangle hit box is smaller than visual representation
            const triangleHitbox = {
              x: obstacle.x + 15, // Adjusted for larger size
              y: obstacle.y + 30, // Adjusted for larger size
              width: 30, // Adjusted for larger size
              height: 30  // Adjusted for larger size
            };
            
            if (checkCollision(charPos, triangleHitbox)) {
              setGameOver(true);
            }
          } else if (obstacle.type === 'spike') {
            // Spike hit box is very small
            const spikeHitbox = {
              x: obstacle.x + 8,
              y: obstacle.y + 8,
              width: 14,
              height: 22
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
  }, [gameOver, characterPosition.x, characterPosition.y, platforms, gameSpeed, difficultyLevel, score, windowDimensions]);

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
      x: windowDimensions.width * 0.15,
      y: windowDimensions.height - GROUND_HEIGHT - CHARACTER_SIZE,
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
    // Switch to a random music track
    setMusicTrack(Math.random() > 0.5 ? normalMusic : alternateMusic);
    lastTimeRef.current = 0;
  };

  return (
    <div 
      className="game-area"
      style={{ 
        width: '100vw', 
        height: '100vh', 
        background: `url(${capybaraPattern})`,
        backgroundSize: 'cover',
        overflow: 'hidden' 
      }}
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
      
      <button 
        className="mute-button"
        onClick={() => setIsMuted(!isMuted)}
      >
        {isMuted ? "🔇 Unmute" : "🔊 Mute"}
      </button>
      
      <Character 
        position={characterPosition} 
        isJumping={characterPosition.isJumping}
        jumpCount={characterPosition.jumpCount}
        size={CHARACTER_SIZE}
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
      
      <div 
        className="ground" 
        style={{ height: GROUND_HEIGHT }}
      />
      
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