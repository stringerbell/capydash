import React from 'react';
import characterImage from '../assets/character-optimized-xl.png';

const Character = ({ position, isJumping, jumpCount, size = 90, isNightmareMode = false }) => {
  return (
    <div 
      className={`character ${isJumping ? 'jumping' : ''} ${jumpCount > 0 ? 'double-jumping' : ''} ${isNightmareMode ? 'nightmare-character' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        transform: isJumping ? (jumpCount > 0 ? 'rotate(90deg)' : 'rotate(45deg)') : 'rotate(0deg)',
        backgroundImage: `url(${characterImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: isNightmareMode ? 'hue-rotate(300deg) brightness(1.5) drop-shadow(0 0 10px red)' : 'none'
      }}
    />
  );
};

export default Character; 