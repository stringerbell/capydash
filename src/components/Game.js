import React, { useState, useEffect, useRef, useCallback } from 'react';
import Character from './Character';
import Obstacle from './Obstacle';
import '../styles/game.css';
import capybaraPattern from '../assets/Cute_Capybara_Character_Seamless_Pattern_high_resolution_preview_2105908.jpg';
import normalMusic from '../assets/normal.mp3';
import alternateMusic from '../assets/alternate.mp3';
import nightmareMusic1 from '../nightmare-1.mp3';
import nightmareMusic2 from '../nightmare-2.mp3';
import skullGif from '../skull.gif';

// Using window dimensions for full-screen
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
const GRAVITY = 0.8;
const JUMP_FORCE = -18;
const INITIAL_OBSTACLE_SPEED = 9;
const GROUND_HEIGHT = 60;
const CHARACTER_SIZE = 90;

// Debug flag - set to true to display debug controls
const DEBUG_MODE_DEFAULT = false;

// Difficulty levels - more challenging progression
const DIFFICULTY_LEVELS = [
  { name: "Easy", speedMultiplier: 1.0, obstacleFrequency: 2000, platformFrequency: 4000 },
  { name: "Normal", speedMultiplier: 1.3, obstacleFrequency: 1700, platformFrequency: 3500 },
  { name: "Hard", speedMultiplier: 1.6, obstacleFrequency: 1500, platformFrequency: 3000 },
  { name: "Very Hard", speedMultiplier: 2.0, obstacleFrequency: 1300, platformFrequency: 2500 },
  { name: "Extreme", speedMultiplier: 2.5, obstacleFrequency: 1100, platformFrequency: 2000 },
  { name: "Impossible", speedMultiplier: 3.0, obstacleFrequency: 900, platformFrequency: 1800 },
  { name: "Insane", speedMultiplier: 3.5, obstacleFrequency: 700, platformFrequency: 1500 },
  { name: "Nightmare", speedMultiplier: 4.0, obstacleFrequency: 500, platformFrequency: 1200 },
  { name: "Hell", speedMultiplier: 4.5, obstacleFrequency: 300, platformFrequency: 1000 },
  { name: "Godzilla", speedMultiplier: 5.5, obstacleFrequency: 50, platformFrequency: 250 },
  { name: "Burning Crap", speedMultiplier: 6.0, obstacleFrequency: 10, platformFrequency: 50 },

];

const Game = () => {
  // TEMPORARY FOR TESTING: Starting at Insane level with invincibility
  // TO REVERT TESTING CHANGES: Simply set this flag to false
  // All testing features will be disabled automatically
  const startAtInsane = false; // Set to false to revert
  const insaneIndex = DIFFICULTY_LEVELS.findIndex(level => level.name === "Insane");
  
  // Performance optimization flags
  const [useReducedEffects, setUseReducedEffects] = useState(true); // Less intense effects for better performance
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [debugMode, setDebugMode] = useState(DEBUG_MODE_DEFAULT);
  const [showMobileTip, setShowMobileTip] = useState(true); // Show mobile tip initially
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
  const [difficultyLevel, setDifficultyLevel] = useState(startAtInsane ? insaneIndex : 0);
  const [gameSpeed, setGameSpeed] = useState(startAtInsane ? 
    INITIAL_OBSTACLE_SPEED * DIFFICULTY_LEVELS[insaneIndex].speedMultiplier : 
    INITIAL_OBSTACLE_SPEED);
  const [musicTrack, setMusicTrack] = useState(startAtInsane ? 
    (Math.random() > 0.5 ? nightmareMusic1 : nightmareMusic2) : 
    (Math.random() > 0.5 ? normalMusic : alternateMusic));
  const [isMuted, setIsMuted] = useState(false);
  const [isInvincible, setIsInvincible] = useState(startAtInsane); // TEMPORARY: Make player invincible
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
      // Jump when pressing space
      if (e.code === 'Space' && !isSpacePressed) {
        jump();
        setIsSpacePressed(true);
      }
      
      // Toggle debug mode with Ctrl+D
      if (e.code === 'KeyD' && e.ctrlKey) {
        e.preventDefault();
        setDebugMode(prev => !prev);
        console.log("Debug mode:", !debugMode);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    // Handle touch events for mobile
    const handleTouchStart = () => {
      if (!gameOver) {
        jump();
        setIsSpacePressed(true);
      }
    };

    const handleTouchEnd = () => {
      setIsSpacePressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSpacePressed, jump, gameOver, debugMode]);

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
      // Reduce obstacle generation frequency when using reduced effects
      if (useReducedEffects && Math.random() < 0.3) {
        return; // Skip some obstacle generations for better performance
      }
      
      // Check if we should add a spike field or a standard obstacle
      if (Math.random() > 0.7) {
        // Create a field of spikes (small triangles)
        // Reduce spike count in higher difficulties/reduced effects mode
        const maxSpikes = useReducedEffects || difficultyLevel >= 8 ? 3 : 5;
        const spikeCount = Math.floor(Math.random() * maxSpikes) + 2; // 2-5 spikes
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
  }, [windowDimensions, difficultyLevel, useReducedEffects]);

  // Function to start platform generation
  const startPlatformGeneration = useCallback((frequency) => {
    platformTimerRef.current = setInterval(() => {
      // Reduce platform generation frequency when using reduced effects
      if (useReducedEffects && Math.random() < 0.4) {
        return; // Skip some platform generations for better performance
      }
      
      if (Math.random() > 0.5) {
        // Generate a column/platform
        // Reduce platform height in performance mode
        const maxHeightUnits = useReducedEffects || difficultyLevel >= 8 ? 2 : 3;
        const platformHeight = Math.floor(Math.random() * maxHeightUnits) + 1; // 1-2/3 platform height units
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
            // Reduce frequency of rings in performance mode
            hasRing: !useReducedEffects && Math.random() > 0.7 // Some columns have rings
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
  }, [windowDimensions, difficultyLevel, useReducedEffects]);

  // Progressive difficulty increase
  useEffect(() => {
    if (!gameOver) {
      difficultyTimerRef.current = setInterval(() => {
        const newDifficulty = Math.min(difficultyLevel + 1, DIFFICULTY_LEVELS.length - 1);
        setDifficultyLevel(newDifficulty);
        
        // Update game speed based on new difficulty
        const newSpeed = INITIAL_OBSTACLE_SPEED * DIFFICULTY_LEVELS[newDifficulty].speedMultiplier;
        setGameSpeed(newSpeed);
        
        // Find the index of the "Insane" difficulty level
        const insaneIndex = DIFFICULTY_LEVELS.findIndex(level => level.name === "Insane");
        
        // Switch to nightmare music when reaching 'Insane' difficulty level or above
        if (newDifficulty >= insaneIndex && 
            (musicTrack === normalMusic || musicTrack === alternateMusic)) {
          const randomNightmareTrack = Math.random() > 0.5 ? nightmareMusic1 : nightmareMusic2;
          setMusicTrack(randomNightmareTrack);
        }
        
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
  }, [gameOver, difficultyLevel, startObstacleGeneration, startPlatformGeneration, musicTrack]);

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
        // Apply a maximum limit to the number of obstacles to prevent performance issues
        const maxObstacles = difficultyLevel >= 8 ? 15 : 30;
        
        // Map and filter obstacles
        let updated = prev
          .map(obstacle => ({
            ...obstacle,
            x: obstacle.x - gameSpeed
          }))
          .filter(obstacle => obstacle.x > -100);
        
        // Limit the number of obstacles if we have too many
        if (updated.length > maxObstacles) {
          // Keep obstacles closer to the player
          updated = updated.sort((a, b) => a.x - b.x).slice(0, maxObstacles);
        }
        
        return updated;
      });
      
      // Update platforms with current game speed
      setPlatforms(prev => {
        // Apply a maximum limit to the number of platforms to prevent performance issues
        const maxPlatforms = difficultyLevel >= 8 ? 10 : 20;
        
        // Map and filter platforms
        let updated = prev
          .map(platform => ({
            ...platform,
            x: platform.x - gameSpeed
          }))
          .filter(platform => platform.x > -200);
        
        // Limit the number of platforms if we have too many
        if (updated.length > maxPlatforms) {
          // Keep platforms closer to the player
          updated = updated.sort((a, b) => a.x - b.x).slice(0, maxPlatforms);
        }
        
        return updated;
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
          // Update score when passing an obstacle
          if (!obstacle.passed && charPos.x > obstacle.x + obstacle.width) {
            obstacle.passed = true;
            scoreIncreased = true;
          }

          // Different collision detection for different obstacle types
          if (obstacle.type === 'triangle') {
            // Triangle hit box is smaller than visual representation
            const triangleHitbox = {
              x: obstacle.x + 15, // Adjusted for larger size
              y: obstacle.y + 30, // Adjusted for larger size
              width: 30, // Adjusted for larger size
              height: 30  // Adjusted for larger size
            };
            
            // Only check collision if not invincible
            if (checkCollision(charPos, triangleHitbox) && !isInvincible) {
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
            
            // Only check collision if not invincible
            if (checkCollision(charPos, spikeHitbox) && !isInvincible) {
              setGameOver(true);
            }
          } else {
            // Standard rectangular collision for blocks
            // Only check collision if not invincible
            if (checkCollision(charPos, obstacle) && !isInvincible) {
              setGameOver(true);
            }
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
              
              // Find the index of the "Insane" difficulty level
              const insaneIndex = DIFFICULTY_LEVELS.findIndex(level => level.name === "Insane");
              const hellIndex = DIFFICULTY_LEVELS.findIndex(level => level.name === "Hell");
              
              // Enable reduced effects for performance at Hell level and above
              if (newDifficulty >= hellIndex) {
                setUseReducedEffects(true);
              }
              
              // Switch to nightmare music when reaching 'Insane' difficulty level or above through score increases
              if (newDifficulty >= insaneIndex && 
                  (musicTrack === normalMusic || musicTrack === alternateMusic)) {
                const randomNightmareTrack = Math.random() > 0.5 ? nightmareMusic1 : nightmareMusic2;
                setMusicTrack(randomNightmareTrack);
              }
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
  }, [gameOver, characterPosition.x, characterPosition.y, platforms, gameSpeed, difficultyLevel, score, windowDimensions, musicTrack, isInvincible]);

  // Helper function for collision detection
  const checkCollision = (rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  // Helper function to check if in nightmare mode
  const isInNightmareMode = () => {
    return musicTrack === nightmareMusic1 || musicTrack === nightmareMusic2;
  };

  // Helper function to get extreme mode message based on difficulty level
  const getExtremeMessage = () => {
    // Find indices of specific difficulty levels
    const insaneIndex = DIFFICULTY_LEVELS.findIndex(level => level.name === "Insane");
    const nightmareIndex = DIFFICULTY_LEVELS.findIndex(level => level.name === "Nightmare");
    const hellIndex = DIFFICULTY_LEVELS.findIndex(level => level.name === "Hell");
    const godzillaIndex = DIFFICULTY_LEVELS.findIndex(level => level.name === "Godzilla");
    const burningCrapIndex = DIFFICULTY_LEVELS.findIndex(level => level.name === "Burning Crap");
    
    if (difficultyLevel >= burningCrapIndex) return "🔥💩 BURNING CRAP MODE 💩🔥";
    if (difficultyLevel >= godzillaIndex) return "🔥👹 GODZILLA MODE 👹🔥";
    if (difficultyLevel >= hellIndex) return "🔥👿 HELL MODE 👿🔥";
    if (difficultyLevel >= nightmareIndex) return "🔥😱 NIGHTMARE MODE 😱🔥";
    if (difficultyLevel >= insaneIndex) return "🔥 INSANE MODE 🔥";
    return "🔥 EXTREME MODE 🔥";
  };

  const restartGame = () => {
    setGameOver(false);
    setScore(0);
    
    // TEMPORARY: Use start level based on our testing flag
    const startLevel = startAtInsane ? insaneIndex : 0;
    setDifficultyLevel(startLevel);
    setGameSpeed(INITIAL_OBSTACLE_SPEED * DIFFICULTY_LEVELS[startLevel].speedMultiplier);
    
    // Keep reduced effects enabled
    // setUseReducedEffects(startLevel >= 8);
    
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
    
    // TEMPORARY: Select appropriate music based on difficulty
    if (startAtInsane) {
      setMusicTrack(Math.random() > 0.5 ? nightmareMusic1 : nightmareMusic2);
    } else {
      setMusicTrack(Math.random() > 0.5 ? normalMusic : alternateMusic);
    }
    
    lastTimeRef.current = 0;
  };

  // Effect to handle nightmare music and scream sound
  useEffect(() => {
    // Create audio element for nightmare scream
    let screamSound = null;
    
    // When entering nightmare mode, play a scream (only in full effects mode)
    if (isInNightmareMode() && !isMuted && !useReducedEffects) {
      // Create and play scream sound
      screamSound = new Audio();
      screamSound.src = 'https://www.fesliyanstudios.com/play-mp3/6382'; // Evil laugh sound effect
      screamSound.volume = 0.7;
      screamSound.play().catch(error => {
        console.log("Scream sound play failed:", error);
      });
    }
    
    return () => {
      if (screamSound) {
        screamSound.pause();
      }
    };
  }, [musicTrack, isMuted, useReducedEffects, isInNightmareMode]);

  // Effect to hide mobile tip after a few seconds
  useEffect(() => {
    if (showMobileTip) {
      const tipTimer = setTimeout(() => {
        setShowMobileTip(false);
      }, 5000); // Hide after 5 seconds
      
      return () => clearTimeout(tipTimer);
    }
  }, [showMobileTip]);

  return (
    <div 
      className={`game-area ${isInNightmareMode() && !useReducedEffects ? 'screen-shake' : ''}`}
      style={{ 
        width: '100vw', 
        height: '100vh', 
        background: isInNightmareMode() ? 
          `url(${skullGif}) repeat` : 
          `url(${capybaraPattern})`,
        backgroundSize: isInNightmareMode() ? '300px 300px' : 'cover',
        overflow: 'hidden',
        touchAction: 'manipulation' // Prevent browser handling of touch events
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
      
      {/* Nightmare mode effects */}
      {isInNightmareMode() && (
        <>
          {/* Dark overlay for better contrast with skull pattern */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 5
            }}
          />
          
          {/* Blood drips - only in full effects mode */}
          {!useReducedEffects && <div className="blood-drips" />}
          
          {/* Centered large skull */}
          <div 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: useReducedEffects ? '500px' : '800px',
              height: useReducedEffects ? '500px' : '800px',
              backgroundImage: `url(${skullGif})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              opacity: useReducedEffects ? 0.6 : 0.8,
              zIndex: 6,
              filter: useReducedEffects ? 
                'drop-shadow(0 0 15px red)' : 
                'drop-shadow(0 0 30px red) brightness(1.2)',
              animation: useReducedEffects ? 'none' : 'pulsate 2s infinite alternate'
            }}
          />
          
          {/* Multiple floating skulls - reduced number in performance mode */}
          {[...Array(useReducedEffects ? 3 : 8)].map((_, i) => (
            <div 
              key={`skull-${i}`}
              className={`floating-skull skull-${i}`}
              style={{
                position: 'fixed',
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 80}%`,
                width: `${80 + Math.random() * 120}px`,
                height: `${80 + Math.random() * 120}px`,
                backgroundImage: `url(${skullGif})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                opacity: 0.5,
                zIndex: 6,
                filter: useReducedEffects ? 'none' : 'drop-shadow(0 0 10px red)',
                // Disable animations in reduced effects mode
                animation: useReducedEffects ? 'none' : undefined
              }}
            />
          ))}
          
          {/* Red vignette effect - only in full effects mode */}
          {!useReducedEffects && <div className="vignette" />}
          
          {/* Only include nightmare background in full effects mode */}
          {!useReducedEffects && <div className="nightmare-background" />}
        </>
      )}
      
      {/* Mobile tap indicator */}
      {showMobileTip && !gameOver && (
        <div className="mobile-tip">
          👆 Tap to Jump! 👆
        </div>
      )}
      
      <div className="score">Score: {score}</div>
      <div className="difficulty-indicator">
        Level: {DIFFICULTY_LEVELS[difficultyLevel].name} (x{DIFFICULTY_LEVELS[difficultyLevel].speedMultiplier.toFixed(1)})
      </div>
      
      {/* Mute button */}
      <button 
        className="mute-button"
        onClick={() => setIsMuted(!isMuted)}
      >
        {isMuted ? "🔇 Unmute" : "🔊 Mute"}
      </button>
      

      
      {/* Debug controls - only visible in debug mode */}
      {debugMode && (
        <>
          {/* Invincibility toggle */}
          <button 
            className={`invincible-toggle ${isInvincible ? 'active' : ''}`}
            onClick={() => setIsInvincible(!isInvincible)}
          >
            {isInvincible ? "🛡️ Invincible ON" : "⚔️ Invincible OFF"}
          </button>
          
          {/* Difficulty selector */}
          <div style={{
            position: 'absolute',
            top: 200,
            right: 10,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}>
            {DIFFICULTY_LEVELS.map((level, index) => (
              <button 
                key={level.name}
                style={{
                  backgroundColor: difficultyLevel === index ? 'rgba(255, 215, 0, 0.8)' : 'rgba(100, 100, 100, 0.8)',
                  border: `2px solid ${difficultyLevel === index ? '#b8860b' : '#444'}`,
                  borderRadius: '8px',
                  color: difficultyLevel === index ? 'black' : 'white',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  opacity: difficultyLevel === index ? 1 : 0.8
                }}
                onClick={() => {
                  setDifficultyLevel(index);
                  setGameSpeed(INITIAL_OBSTACLE_SPEED * DIFFICULTY_LEVELS[index].speedMultiplier);
                  // Switch music based on difficulty
                  if (index >= insaneIndex) {
                    setMusicTrack(Math.random() > 0.5 ? nightmareMusic1 : nightmareMusic2);
                  } else {
                    setMusicTrack(Math.random() > 0.5 ? normalMusic : alternateMusic);
                  }
                }}
              >
                {level.name}
              </button>
            ))}
          </div>
        </>
      )}
      
      {/* Nightmare mode indicator */}
      {isInNightmareMode() && 
        <div className="nightmare-mode">
          {getExtremeMessage()}
        </div>
      }
      
      <Character 
        position={characterPosition} 
        isJumping={characterPosition.isJumping}
        jumpCount={characterPosition.jumpCount}
        size={CHARACTER_SIZE}
        isNightmareMode={isInNightmareMode()}
      />
      
      {/* Render Platforms */}
      {platforms.map(platform => (
        <div 
          key={platform.id}
          className={`platform ${platform.type} ${isInNightmareMode() ? 'nightmare-platform' : ''}`}
          style={{
            left: platform.x,
            top: platform.y,
            width: platform.width,
            height: platform.height
          }}
        >
          {platform.hasRing && (
            <div className={`ring ${isInNightmareMode() ? 'nightmare-ring' : ''}`}></div>
          )}
        </div>
      ))}
      
      {obstacles.map(obstacle => (
        <Obstacle 
          key={obstacle.id} 
          obstacle={obstacle} 
          isNightmareMode={isInNightmareMode()}
        />
      ))}
      
      <div 
        className={`ground ${isInNightmareMode() ? 'nightmare-ground' : ''}`} 
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