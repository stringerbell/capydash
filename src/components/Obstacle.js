import React from 'react';

const Obstacle = ({ obstacle, isNightmareMode = false }) => {
  // Common nightmare mode styles
  const nightmareStyle = isNightmareMode ? {
    filter: 'drop-shadow(0 0 8px #ff0000)',
    animation: 'obstacle-pulse 0.5s infinite alternate'
  } : {};
  
  if (obstacle.type === 'triangle') {
    return (
      <div
        className={`obstacle triangle ${isNightmareMode ? 'nightmare-obstacle' : ''}`}
        style={{
          left: obstacle.x,
          bottom: obstacle.height < 45 ? 50 : 60, // Adjust bottom based on obstacle size
          width: 0,
          height: 0,
          position: 'absolute',
          borderLeftWidth: obstacle.width / 2,
          borderRightWidth: obstacle.width / 2,
          borderBottomWidth: obstacle.height,
          ...nightmareStyle
        }}
      />
    );
  } else if (obstacle.type === 'spike') {
    return (
      <div
        className={`obstacle spike ${isNightmareMode ? 'nightmare-obstacle' : ''}`}
        style={{
          left: obstacle.x,
          bottom: 60, // Ground height
          width: 0,
          height: 0,
          position: 'absolute',
          borderLeftWidth: obstacle.width / 3,
          borderRightWidth: obstacle.width / 3,
          borderBottomWidth: obstacle.height,
          ...nightmareStyle
        }}
      />
    );
  }

  return (
    <div
      className={`obstacle ${isNightmareMode ? 'nightmare-obstacle' : ''}`}
      style={{
        left: obstacle.x,
        top: obstacle.y,
        width: obstacle.width,
        height: obstacle.height,
        backgroundColor: isNightmareMode ? '#ff0000' : '#116611',
        ...nightmareStyle
      }}
    />
  );
};

export default Obstacle; 