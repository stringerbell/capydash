import React from 'react';

const Obstacle = ({ obstacle }) => {
  if (obstacle.type === 'triangle') {
    return (
      <div
        className="obstacle triangle"
        style={{
          left: obstacle.x,
          bottom: obstacle.height < 45 ? 50 : 60, // Adjust bottom based on obstacle size
          width: 0,
          height: 0,
          position: 'absolute',
          borderLeftWidth: obstacle.width / 2,
          borderRightWidth: obstacle.width / 2,
          borderBottomWidth: obstacle.height
        }}
      />
    );
  } else if (obstacle.type === 'spike') {
    return (
      <div
        className="obstacle spike"
        style={{
          left: obstacle.x,
          bottom: 60, // Ground height
          width: 0,
          height: 0,
          position: 'absolute',
          borderLeftWidth: obstacle.width / 3,
          borderRightWidth: obstacle.width / 3,
          borderBottomWidth: obstacle.height
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
        backgroundColor: '#116611'
      }}
    />
  );
};

export default Obstacle; 