import React from 'react';

const Obstacle = ({ obstacle }) => {
  if (obstacle.type === 'triangle') {
    return (
      <div
        className="obstacle triangle"
        style={{
          left: obstacle.x,
          bottom: 50, // Ground height
          width: 0,
          height: 0,
          position: 'absolute'
        }}
      />
    );
  } else if (obstacle.type === 'spike') {
    return (
      <div
        className="obstacle spike"
        style={{
          left: obstacle.x,
          bottom: 50, // Ground height
          width: 0,
          height: 0,
          position: 'absolute'
        }}
      />
    );
  }

  return (
    <div
      className="obstacle"
      style={{
        left: obstacle.x,
        top: obstacle.y,
        width: obstacle.width,
        height: obstacle.height,
        backgroundColor: 'white'
      }}
    />
  );
};

export default Obstacle; 