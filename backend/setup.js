#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Civic Reporter Backend Setup\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
} else {
  console.log('❌ .env file not found');
  console.log('💡 Copy .env.example to .env and update the values');
  process.exit(1);
}

// Check required directories
const requiredDirs = ['controllers', 'middleware', 'models', 'routes'];
const missingDirs = [];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`✅ ${dir}/ directory found`);
  } else {
    console.log(`❌ ${dir}/ directory missing`);
    missingDirs.push(dir);
  }
});

if (missingDirs.length > 0) {
  console.log('\n❌ Missing required directories. Please ensure project structure is complete.');
  process.exit(1);
}

// Check package.json
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`✅ package.json found (v${packageJson.version})`);
  
  // Check if node_modules exists
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules found');
  } else {
    console.log('❌ node_modules not found');
    console.log('💡 Run: npm install');
    process.exit(1);
  }
} else {
  console.log('❌ package.json not found');
  process.exit(1);
}

// Load environment variables
require('dotenv').config();

console.log('\n📋 Environment Configuration:');
console.log(`• NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`• PORT: ${process.env.PORT || 'not set (will use 5000)'}`);
console.log(`• MONGODB_URI: ${process.env.MONGODB_URI ? '✅ configured' : '❌ not set'}`);
console.log(`• JWT_SECRET: ${process.env.JWT_SECRET ? '✅ configured' : '❌ not set'}`);
console.log(`• CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloudinary-cloud-name' ? '✅ configured' : '⚠️  using placeholder'}`);
console.log(`• OPENAI_API_KEY: ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key' ? '✅ configured' : '⚠️  using placeholder'}`);

console.log('\n🚀 Setup complete! You can now run:');
console.log('• npm run dev  (development with nodemon)');
console.log('• npm start   (production)');

console.log('\n💡 Tips:');
console.log('• MongoDB: Install locally or use MongoDB Atlas');
console.log('• Cloudinary: Sign up at cloudinary.com for image storage');
console.log('• OpenAI: Get API key from platform.openai.com for AI features');
console.log('• Server will start even without MongoDB/external services');