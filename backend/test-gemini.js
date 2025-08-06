const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

async function testGemini() {
  console.log('🔑 Gemini API Key:', GEMINI_API_KEY ? 'Set ✅' : 'Missing ❌');
  console.log('🌐 Base URL:', GEMINI_BASE_URL);
  
  if (!GEMINI_API_KEY) {
    console.error('❌ Gemini API key not found in environment variables');
    return;
  }

  try {
    console.log('🧪 Testing simple text generation...');
    
    const response = await axios.post(
      `${GEMINI_BASE_URL}/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ 
          parts: [{ text: 'Hello, respond with just "Gemini is working correctly"' }] 
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50,
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    console.log('✅ Gemini API Response:', response.data);
    console.log('📝 Generated text:', response.data.candidates[0]?.content?.parts[0]?.text);
    
  } catch (error) {
    console.error('❌ Gemini API Error:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', error.response?.data);
    console.error('Full Error:', error.message);
  }
}

testGemini();