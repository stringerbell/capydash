const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function optimizeImage(inputPath, outputPath, width) {
  try {
    await sharp(inputPath)
      .resize(width)
      .png({ quality: 95 })
      .toFile(outputPath);
    
    console.log(`Successfully optimized ${inputPath} to ${outputPath}`);
    
    // Get file sizes for comparison
    const originalSize = fs.statSync(inputPath).size / (1024 * 1024); // MB
    const optimizedSize = fs.statSync(outputPath).size / (1024 * 1024); // MB
    
    console.log(`Original size: ${originalSize.toFixed(2)} MB`);
    console.log(`Optimized size: ${optimizedSize.toFixed(2)} MB`);
    console.log(`Reduction: ${((1 - optimizedSize / originalSize) * 100).toFixed(2)}%`);
  } catch (error) {
    console.error('Error optimizing image:', error);
  }
}

// Path to the input PNG file
const inputPNGPath = path.join(__dirname, 'src', 'assets', 'character.png');

// Path to the optimized output PNG file
const outputOptimizedPath = path.join(__dirname, 'src', 'assets', 'character-optimized-xl.png');

// Optimize to 450px width for extra large character
optimizeImage(inputPNGPath, outputOptimizedPath, 450); 