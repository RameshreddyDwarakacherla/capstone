const axios = require('axios');

class AIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.openaiBaseUrl = 'https://api.openai.com/v1';
    this.geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    
    // Determine which AI service to use
    this.activeService = this.geminiApiKey ? 'gemini' : (this.openaiApiKey ? 'openai' : null);
    console.log(`🤖 AI Service initialized: ${this.activeService || 'none'}`);
  }

  // Analyze image using AI Vision API (OpenAI or Gemini)
  async analyzeImage(imageUrl, customPrompt = null) {
    if (!this.isAvailable()) {
      console.warn('No AI API key configured, skipping AI analysis');
      return null;
    }

    if (this.activeService === 'gemini') {
      return this.analyzeImageWithGemini(imageUrl, customPrompt);
    } else {
      return this.analyzeImageWithOpenAI(imageUrl, customPrompt);
    }
  }

  // Analyze image using Gemini Vision API
  async analyzeImageWithGemini(imageUrl, customPrompt = null) {
    try {
      const prompt = customPrompt || `
        Analyze this civic infrastructure image and provide:
        1. A detailed description of what you see
        2. Identify any infrastructure issues (potholes, broken lights, drainage problems, etc.)
        3. Assess the severity level (low, medium, high)
        4. Suggest the most appropriate category from: pothole, street_light, drainage, traffic_signal, road_damage, sidewalk, graffiti, garbage, water_leak, park_maintenance, noise_complaint, other
        5. Provide a confidence score (0-1) for your analysis

        Respond in JSON format with keys: description, issues, severity, suggestedCategory, confidence
      `;

      // First, we need to fetch the image and convert it to base64
      const imageResponse = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000 
      });
      const base64Image = Buffer.from(imageResponse.data).toString('base64');
      const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';

      const response = await axios.post(
        `${this.geminiBaseUrl}/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 1,
            maxOutputTokens: 500,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const aiResponse = response.data.candidates[0]?.content?.parts[0]?.text;
      
      if (!aiResponse) {
        throw new Error('No response from Gemini API');
      }
      
      // Try to parse JSON response
      try {
        const parsedResponse = JSON.parse(aiResponse);
        return {
          description: parsedResponse.description || 'AI analysis completed',
          issues: parsedResponse.issues || [],
          severity: parsedResponse.severity || 'medium',
          suggestedCategory: parsedResponse.suggestedCategory || 'other',
          confidence: parsedResponse.confidence || 0.5,
          processedAt: new Date(),
          provider: 'gemini-1.5-pro'
        };
      } catch (parseError) {
        // If JSON parsing fails, return the raw response
        return {
          description: aiResponse,
          severity: 'medium',
          suggestedCategory: 'other',
          confidence: 0.3,
          processedAt: new Date(),
          provider: 'gemini-1.5-pro'
        };
      }
    } catch (error) {
      console.error('Gemini Vision API error:', error.response?.data || error.message);
      
      // Return fallback analysis
      return {
        description: 'AI analysis unavailable - manual review required',
        severity: 'medium',
        suggestedCategory: 'other',
        confidence: 0.1,
        processedAt: new Date(),
        provider: 'fallback',
        error: error.message
      };
    }
  }

  // Analyze image using OpenAI Vision API
  async analyzeImageWithOpenAI(imageUrl, customPrompt = null) {
    try {
      const prompt = customPrompt || `
        Analyze this civic infrastructure image and provide:
        1. A detailed description of what you see
        2. Identify any infrastructure issues (potholes, broken lights, drainage problems, etc.)
        3. Assess the severity level (low, medium, high)
        4. Suggest the most appropriate category from: pothole, street_light, drainage, traffic_signal, road_damage, sidewalk, graffiti, garbage, water_leak, park_maintenance, noise_complaint, other
        5. Provide a confidence score (0-1) for your analysis

        Respond in JSON format with keys: description, issues, severity, suggestedCategory, confidence
      `;

      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      
      // Try to parse JSON response
      try {
        const parsedResponse = JSON.parse(aiResponse);
        return {
          description: parsedResponse.description || 'AI analysis completed',
          issues: parsedResponse.issues || [],
          severity: parsedResponse.severity || 'medium',
          suggestedCategory: parsedResponse.suggestedCategory || 'other',
          confidence: parsedResponse.confidence || 0.5,
          processedAt: new Date(),
          provider: 'openai-gpt4-vision'
        };
      } catch (parseError) {
        // If JSON parsing fails, return the raw response
        return {
          description: aiResponse,
          severity: 'medium',
          suggestedCategory: 'other',
          confidence: 0.3,
          processedAt: new Date(),
          provider: 'openai-gpt4-vision'
        };
      }
    } catch (error) {
      console.error('OpenAI Vision API error:', error.response?.data || error.message);
      
      // Return fallback analysis
      return {
        description: 'AI analysis unavailable - manual review required',
        severity: 'medium',
        suggestedCategory: 'other',
        confidence: 0.1,
        processedAt: new Date(),
        provider: 'fallback',
        error: error.message
      };
    }
  }

  // Generate image description using AI (OpenAI or Gemini)
  async generateImageDescription(imageUrl) {
    if (!this.isAvailable()) {
      return 'Image description unavailable - AI service not configured';
    }

    if (this.activeService === 'gemini') {
      return this.generateImageDescriptionWithGemini(imageUrl);
    } else {
      return this.generateImageDescriptionWithOpenAI(imageUrl);
    }
  }

  // Generate image description using Gemini
  async generateImageDescriptionWithGemini(imageUrl) {
    try {
      // Fetch and convert image to base64
      const imageResponse = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000 
      });
      const base64Image = Buffer.from(imageResponse.data).toString('base64');
      const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';

      const response = await axios.post(
        `${this.geminiBaseUrl}/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [
              { text: 'Provide a clear, concise description of this civic infrastructure image. Focus on what infrastructure elements are visible and any issues that need attention.' },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 1,
            maxOutputTokens: 200,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.candidates[0]?.content?.parts[0]?.text || 'Image description unavailable';
    } catch (error) {
      console.error('Gemini description generation error:', error.response?.data || error.message);
      return 'Image description unavailable';
    }
  }

  // Generate image description using OpenAI
  async generateImageDescriptionWithOpenAI(imageUrl) {

    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Provide a clear, concise description of this civic infrastructure image. Focus on what infrastructure elements are visible and any issues that need attention.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 200,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI description generation error:', error.response?.data || error.message);
      return 'Image description unavailable';
    }
  }

  // Categorize issue based on text description
  async categorizeIssue(title, description) {
    if (!this.isAvailable()) {
      return 'other';
    }

    if (this.activeService === 'gemini') {
      return this.categorizeIssueWithGemini(title, description);
    } else {
      return this.categorizeIssueWithOpenAI(title, description);
    }
  }

  // Categorize issue using Gemini
  async categorizeIssueWithGemini(title, description) {
    try {
      const response = await axios.post(
        `${this.geminiBaseUrl}/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: `You are a civic issue categorization system. Based on the issue title and description, classify it into one of these categories: pothole, street_light, drainage, traffic_signal, road_damage, sidewalk, graffiti, garbage, water_leak, park_maintenance, noise_complaint, other. Respond with only the category name.\n\nTitle: ${title}\nDescription: ${description}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 10,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const category = response.data.candidates[0]?.content?.parts[0]?.text?.trim().toLowerCase();
      
      // Validate category
      const validCategories = [
        'pothole', 'street_light', 'drainage', 'traffic_signal', 
        'road_damage', 'sidewalk', 'graffiti', 'garbage', 
        'water_leak', 'park_maintenance', 'noise_complaint', 'other'
      ];
      
      return validCategories.includes(category) ? category : 'other';
    } catch (error) {
      console.error('Gemini categorization error:', error.response?.data || error.message);
      return 'other';
    }
  }

  // Categorize issue using OpenAI
  async categorizeIssueWithOpenAI(title, description) {
    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a civic issue categorization system. Based on the issue title and description, classify it into one of these categories: pothole, street_light, drainage, traffic_signal, road_damage, sidewalk, graffiti, garbage, water_leak, park_maintenance, noise_complaint, other. Respond with only the category name.`
            },
            {
              role: 'user',
              content: `Title: ${title}\nDescription: ${description}`
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const category = response.data.choices[0].message.content.trim().toLowerCase();
      
      // Validate category
      const validCategories = [
        'pothole', 'street_light', 'drainage', 'traffic_signal', 
        'road_damage', 'sidewalk', 'graffiti', 'garbage', 
        'water_leak', 'park_maintenance', 'noise_complaint', 'other'
      ];
      
      return validCategories.includes(category) ? category : 'other';
    } catch (error) {
      console.error('OpenAI categorization error:', error.response?.data || error.message);
      return 'other';
    }
  }

  // Estimate issue priority based on description and category
  async estimatePriority(category, description, aiAnalysis = null) {
    const urgentKeywords = ['emergency', 'dangerous', 'unsafe', 'hazard', 'urgent', 'critical'];
    const highKeywords = ['major', 'severe', 'broken', 'damaged', 'flooding'];
    const mediumKeywords = ['minor', 'small', 'slight', 'cosmetic'];

    const text = `${description} ${aiAnalysis?.description || ''}`.toLowerCase();

    // Check for urgent keywords
    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      return 'urgent';
    }

    // Category-based priority rules
    if (['water_leak', 'traffic_signal', 'drainage'].includes(category)) {
      if (highKeywords.some(keyword => text.includes(keyword))) {
        return 'high';
      }
    }

    if (['pothole', 'road_damage', 'street_light'].includes(category)) {
      if (highKeywords.some(keyword => text.includes(keyword))) {
        return 'high';
      }
      if (mediumKeywords.some(keyword => text.includes(keyword))) {
        return 'low';
      }
      return 'medium';
    }

    // Default priorities by category
    const categoryPriorities = {
      'water_leak': 'high',
      'traffic_signal': 'high',
      'drainage': 'medium',
      'pothole': 'medium',
      'road_damage': 'medium',
      'street_light': 'medium',
      'sidewalk': 'low',
      'graffiti': 'low',
      'garbage': 'low',
      'park_maintenance': 'low',
      'noise_complaint': 'low',
      'other': 'medium'
    };

    return categoryPriorities[category] || 'medium';
  }

  // Check if AI service is available
  isAvailable() {
    return !!(this.geminiApiKey || this.openaiApiKey);
  }

  // Get service status
  getStatus() {
    return {
      available: this.isAvailable(),
      provider: this.activeService === 'gemini' ? 'Google Gemini' : 
                 this.activeService === 'openai' ? 'OpenAI' : 'None',
      activeService: this.activeService,
      features: {
        imageAnalysis: this.isAvailable(),
        textClassification: this.isAvailable(),
        descriptionGeneration: this.isAvailable()
      }
    };
  }
}

// Create singleton instance
const aiService = new AIService();

module.exports = aiService;