import React from 'react';
import characterImage from '../assets/character-optimized.png';

const Character = ({ position, isJumping, jumpCount }) => {
  return (
    <div 
      className={`character ${isJumping ? 'jumping' : ''} ${jumpCount > 0 ? 'double-jumping' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        transform: isJumping ? (jumpCount > 0 ? 'rotate(90deg)' : 'rotate(45deg)') : 'rotate(0deg)',
        backgroundImage: `url(${characterImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    />
  );
};

export default Character; 