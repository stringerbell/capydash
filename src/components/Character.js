import React from 'react';

const Character = ({ position, isJumping, jumpCount }) => {
  return (
    <div 
      className={`character ${isJumping ? 'jumping' : ''} ${jumpCount > 0 ? 'double-jumping' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        transform: isJumping ? (jumpCount > 0 ? 'rotate(90deg)' : 'rotate(45deg)') : 'rotate(0deg)'
      }}
    />
  );
};

export default Character; 