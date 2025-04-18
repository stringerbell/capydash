const fs = require('fs');
const path = require('path');
const heicConvert = require('heic-convert');

async function convertHEICToPNG(inputPath, outputPath) {
  try {
    // Read the HEIC file
    const inputBuffer = fs.readFileSync(inputPath);
    
    // Convert HEIC to PNG
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'PNG'
    });
    
    // Write the PNG file
    fs.writeFileSync(outputPath, outputBuffer);
    
    console.log(`Successfully converted ${inputPath} to ${outputPath}`);
  } catch (error) {
    console.error('Error converting image:', error);
  }
}

// Path to the input HEIC file
const inputHEICPath = path.join(__dirname, 'src', 'IMG_1249.HEIC');

// Path to the output PNG file
const outputPNGPath = path.join(__dirname, 'src', 'assets', 'character.png');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'src', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Convert the image
convertHEICToPNG(inputHEICPath, outputPNGPath); 