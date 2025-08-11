const axios = require('axios');
const Issue = require('../models/Issue');

class AIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.openaiBaseUrl = 'https://api.openai.com/v1';
    this.geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    
    // Determine which AI service to use
    this.activeService = this.geminiApiKey ? 'gemini' : (this.openaiApiKey ? 'openai' : null);
    console.log(`🤖 AI Service initialized: ${this.activeService || 'none'}`);
    
    // ML model confidence thresholds
    this.DUPLICATE_THRESHOLD = 0.85; // 85% similarity for duplicate detection
    this.CLASSIFICATION_THRESHOLD = 0.7; // 70% confidence for classification
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

  // Estimate issue priority based on description, category, and AI analysis
  async estimatePriority(category, description, aiAnalysis = null) {
    // If AI is available, use enhanced sentiment and urgency analysis
    if (this.isAvailable()) {
      try {
        const sentimentAnalysis = await this.analyzeSentimentAndUrgency(description);
        
        // Combine AI sentiment analysis with category-based priority
        if (sentimentAnalysis.urgency >= 0.8) {
          return 'urgent';
        } else if (sentimentAnalysis.urgency >= 0.6) {
          return 'high';
        } else if (sentimentAnalysis.urgency >= 0.4) {
          return 'medium';
        } else {
          return 'low';
        }
      } catch (error) {
        console.error('Enhanced priority estimation failed, falling back to keyword-based:', error);
        // Fall back to keyword-based approach
      }
    }
    
    // Fallback: Keyword-based priority estimation
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
  
  /**
   * Analyze sentiment and urgency in issue description
   * @param {string} description - Issue description text
   * @returns {Promise<Object>} - Sentiment and urgency analysis
   */
  async analyzeSentimentAndUrgency(description) {
    try {
      if (!this.isAvailable()) {
        return {
          sentiment: 'neutral',
          urgency: 0.5,
          safety: 0.5,
          impact: 0.5
        };
      }
      
      const prompt = `Analyze this civic issue description and provide a JSON response with the following fields:

1. sentiment: The overall sentiment (negative, somewhat_negative, neutral, somewhat_positive, positive)
2. urgency: A score from 0-1 indicating how urgent this issue is (1 = extremely urgent)
3. safety: A score from 0-1 indicating the safety risk (1 = severe safety hazard)
4. impact: A score from 0-1 indicating community impact (1 = affects many people)

Description: ${description}

Respond with ONLY a valid JSON object containing these fields.`;
      
      let response;
      if (this.activeService === 'gemini') {
        response = await axios.post(
          `${this.geminiBaseUrl}/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 150,
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );
        
        const result = response.data.candidates[0]?.content?.parts[0]?.text;
        try {
          const parsedResult = JSON.parse(result);
          return {
            sentiment: parsedResult.sentiment || 'neutral',
            urgency: parseFloat(parsedResult.urgency) || 0.5,
            safety: parseFloat(parsedResult.safety) || 0.5,
            impact: parseFloat(parsedResult.impact) || 0.5
          };
        } catch (parseError) {
          console.error('Failed to parse sentiment analysis result:', parseError);
          return { sentiment: 'neutral', urgency: 0.5, safety: 0.5, impact: 0.5 };
        }
      } else {
        response = await axios.post(
          `${this.openaiBaseUrl}/chat/completions`,
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a sentiment and urgency analyzer for civic issues. Respond with only a valid JSON object.'
              },
              { role: 'user', content: prompt }
            ],
            max_tokens: 150,
            temperature: 0.1
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        const result = response.data.choices[0].message.content;
        try {
          const parsedResult = JSON.parse(result);
          return {
            sentiment: parsedResult.sentiment || 'neutral',
            urgency: parseFloat(parsedResult.urgency) || 0.5,
            safety: parseFloat(parsedResult.safety) || 0.5,
            impact: parseFloat(parsedResult.impact) || 0.5
          };
        } catch (parseError) {
          console.error('Failed to parse sentiment analysis result:', parseError);
          return { sentiment: 'neutral', urgency: 0.5, safety: 0.5, impact: 0.5 };
        }
      }
    } catch (error) {
      console.error('Sentiment and urgency analysis error:', error);
      return { sentiment: 'neutral', urgency: 0.5, safety: 0.5, impact: 0.5 };
    }
  }
  
  /**
   * Estimate damage depth from image
   * @param {string} imageUrl - URL of the image to analyze
   * @param {string} category - Issue category
   * @returns {Promise<Object>} - Damage depth estimation
   */
  async estimateDamageDepth(imageUrl, category) {
    try {
      if (!this.isAvailable() || !imageUrl) {
        return {
          estimatedDepth: null,
          confidence: 0,
          unit: 'cm',
          damageAssessment: null
        };
      }
      
      // Only estimate depth for relevant categories
      const depthRelevantCategories = ['pothole', 'road_damage', 'sidewalk', 'drainage'];
      if (!depthRelevantCategories.includes(category)) {
        return {
          estimatedDepth: null,
          confidence: 0,
          unit: 'cm',
          damageAssessment: null
        };
      }
      
      const prompt = `Analyze this image of a ${category} and estimate:

1. The approximate depth of the damage in centimeters
2. Your confidence in this estimate (0-1)
3. A brief assessment of the damage severity

Respond with ONLY a valid JSON object with fields: estimatedDepth (number), confidence (number), damageAssessment (string)`;
      
      if (this.activeService === 'gemini') {
        // Fetch and convert image to base64
        const imageResponse = await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 15000 
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
              temperature: 0.2,
              maxOutputTokens: 150,
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );
        
        const result = response.data.candidates[0]?.content?.parts[0]?.text;
        try {
          const parsedResult = JSON.parse(result);
          return {
            estimatedDepth: parsedResult.estimatedDepth || null,
            confidence: parsedResult.confidence || 0,
            unit: 'cm',
            damageAssessment: parsedResult.damageAssessment || null
          };
        } catch (parseError) {
          console.error('Failed to parse damage depth result:', parseError);
          return { estimatedDepth: null, confidence: 0, unit: 'cm', damageAssessment: null };
        }
      } else {
        const response = await axios.post(
          `${this.openaiBaseUrl}/chat/completions`,
          {
            model: 'gpt-4-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } }
                ]
              }
            ],
            max_tokens: 150,
            temperature: 0.2
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
        
        const result = response.data.choices[0].message.content;
        try {
          const parsedResult = JSON.parse(result);
          return {
            estimatedDepth: parsedResult.estimatedDepth || null,
            confidence: parsedResult.confidence || 0,
            unit: 'cm',
            damageAssessment: parsedResult.damageAssessment || null
          };
        } catch (parseError) {
          console.error('Failed to parse damage depth result:', parseError);
          return { estimatedDepth: null, confidence: 0, unit: 'cm', damageAssessment: null };
        }
      }
    } catch (error) {
      console.error('Damage depth estimation error:', error);
      return { estimatedDepth: null, confidence: 0, unit: 'cm', damageAssessment: null };
    }
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
        descriptionGeneration: this.isAvailable(),
        duplicateDetection: this.isAvailable(),
        sentimentAnalysis: this.isAvailable(),
        weeklyReportGeneration: this.isAvailable(),
        damageDepthEstimation: this.isAvailable()
      }
    };
  }
  
  /**
   * Generate weekly summary report of civic issues
   * @param {Date} startDate - Start date for the report period
   * @param {Date} endDate - End date for the report period
   * @returns {Promise<Object>} - Weekly report data
   */
  async generateWeeklyReport(startDate, endDate) {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          error: 'AI service not available'
        };
      }
      
      // Get issues from the database for the specified period
      const Issue = require('../models/Issue');
      const issues = await Issue.find({
        createdAt: { $gte: startDate, $lte: endDate }
      }).populate('reportedBy', 'name');
      
      if (!issues || issues.length === 0) {
        return {
          success: true,
          summary: 'No issues were reported during this period.',
          issueCount: 0,
          topCategories: [],
          priorityDistribution: {},
          statusDistribution: {},
          insights: [],
          recommendations: []
        };
      }
      
      // Prepare data for AI analysis
      const issueData = issues.map(issue => ({
        id: issue._id.toString(),
        title: issue.title,
        description: issue.description,
        category: issue.category,
        priority: issue.priority,
        status: issue.status,
        location: issue.address || 'Unknown location',
        reportedBy: issue.reportedBy?.name || 'Anonymous',
        createdAt: issue.createdAt,
        aiAnalysis: issue.aiAnalysis
      }));
      
      // Calculate basic statistics
      const categoryCount = {};
      const priorityCount = {};
      const statusCount = {};
      
      issues.forEach(issue => {
        // Count categories
        categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
        
        // Count priorities
        priorityCount[issue.priority] = (priorityCount[issue.priority] || 0) + 1;
        
        // Count statuses
        statusCount[issue.status] = (statusCount[issue.status] || 0) + 1;
      });
      
      // Sort categories by count
      const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));
      
      // Format date range for the prompt
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Create prompt for AI analysis
      const prompt = `Generate a comprehensive weekly summary report for civic issues reported from ${startDateStr} to ${endDateStr}.

Here is the data for ${issues.length} reported issues:
${JSON.stringify(issueData, null, 2)}

Basic statistics:
- Top categories: ${JSON.stringify(topCategories)}
- Priority distribution: ${JSON.stringify(priorityCount)}
- Status distribution: ${JSON.stringify(statusCount)}

Please provide a JSON response with the following fields:
1. summary: A concise executive summary of the week's civic issues (200-300 words)
2. insights: An array of 3-5 key insights derived from the data
3. recommendations: An array of 3-5 actionable recommendations for city officials
4. trendAnalysis: Brief analysis of any trends compared to previous periods

Respond with ONLY a valid JSON object.`;
      
      let aiResponse;
      if (this.activeService === 'gemini') {
        const response = await axios.post(
          `${this.geminiBaseUrl}/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024,
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );
        
        aiResponse = response.data.candidates[0]?.content?.parts[0]?.text;
      } else {
        const response = await axios.post(
          `${this.openaiBaseUrl}/chat/completions`,
          {
            model: 'gpt-4-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an AI assistant specialized in analyzing civic infrastructure data and generating insightful reports.'
              },
              { role: 'user', content: prompt }
            ],
            max_tokens: 1024,
            temperature: 0.2
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
        
        aiResponse = response.data.choices[0].message.content;
      }
      
      // Parse AI response
      try {
        const parsedResponse = JSON.parse(aiResponse);
        
        return {
          success: true,
          summary: parsedResponse.summary || 'No summary available.',
          issueCount: issues.length,
          topCategories,
          priorityDistribution: priorityCount,
          statusDistribution: statusCount,
          insights: parsedResponse.insights || [],
          recommendations: parsedResponse.recommendations || [],
          trendAnalysis: parsedResponse.trendAnalysis || 'No trend analysis available.'
        };
      } catch (parseError) {
        console.error('Failed to parse weekly report:', parseError);
        return {
          success: false,
          error: 'Failed to generate report',
          rawResponse: aiResponse
        };
      }
    } catch (error) {
      console.error('Weekly report generation error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }
  
  /**
   * Detect potential duplicate issues based on image similarity and geolocation clustering
   * @param {string} imageUrl - URL of the uploaded image
   * @param {string} title - Issue title
   * @param {string} description - Issue description
   * @param {Object} location - Issue location coordinates {lat, lng}
   * @param {string} category - Issue category
   * @returns {Promise<Object>} - Duplicate detection results
   */
  async detectDuplicateIssues(imageUrl, title, description, location, category) {
    try {
      if (!this.isAvailable()) {
        return {
          hasDuplicates: false,
          potentialDuplicates: [],
          confidence: 0
        };
      }
      
      // Define similarity thresholds
      const DUPLICATE_THRESHOLD = 0.75; // Overall similarity threshold to consider as duplicate
      const SIMILAR_THRESHOLD = 0.6;   // Threshold to consider as similar but not duplicate
      
      // Get recent issues from the database (last 30 days)
      const Issue = require('../models/Issue');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Find issues in the same category from the last 30 days
      const recentIssues = await Issue.find({
        category: category,
        createdAt: { $gte: thirtyDaysAgo },
        // Exclude resolved issues
        status: { $ne: 'resolved' }
      }).select('_id title description location images aiAnalysis createdAt status');
      
      if (!recentIssues || recentIssues.length === 0) {
        return {
          hasDuplicates: false,
          potentialDuplicates: [],
          confidence: 0
        };
      }
      
      // Calculate similarity scores for each recent issue
      const similarityResults = await Promise.all(
        recentIssues.map(async (issue) => {
          // Skip comparing with self (for updates)
          if (issue._id.toString() === title) { // Using title as ID for comparison in case of updates
            return null;
          }
          
          // Calculate text similarity between issue descriptions
          const textSimilarity = await this.calculateTextSimilarity(
            `${title} ${description}`,
            `${issue.title} ${issue.description}`
          );
          
          // Calculate image similarity if both issues have images
          let imageSimilarity = 0;
          if (imageUrl && issue.images && issue.images.length > 0) {
            imageSimilarity = await this.calculateImageSimilarity(
              imageUrl,
              issue.images[0].url // Compare with the first image of the existing issue
            );
          }
          
          // Calculate location similarity if both issues have location data
          let locationSimilarity = 0;
          if (location && location.lat && location.lng && 
              issue.location && issue.location.coordinates && 
              issue.location.coordinates.length === 2) {
            
            const distance = this.calculateDistance(
              location.lat,
              location.lng,
              issue.location.coordinates[1], // MongoDB stores as [lng, lat]
              issue.location.coordinates[0]
            );
            
            // Convert distance to similarity score (0-1)
            // 0m = 1.0 similarity, 100m or more = 0.0 similarity
            locationSimilarity = Math.max(0, 1 - (distance / 100));
          }
          
          // Calculate weighted similarity score
          // Text: 40%, Image: 40%, Location: 20%
          const overallSimilarity = (
            (textSimilarity * 0.4) +
            (imageSimilarity * 0.4) +
            (locationSimilarity * 0.2)
          );
          
          return {
            issueId: issue._id.toString(),
            title: issue.title,
            description: issue.description,
            status: issue.status,
            createdAt: issue.createdAt,
            textSimilarity,
            imageSimilarity,
            locationSimilarity,
            overallSimilarity
          };
        })
      );
      
      // Filter out null results and sort by overall similarity (descending)
      const filteredResults = similarityResults
        .filter(result => result !== null)
        .sort((a, b) => b.overallSimilarity - a.overallSimilarity);
      
      // Find potential duplicates (above threshold)
      const potentialDuplicates = filteredResults
        .filter(result => result.overallSimilarity >= SIMILAR_THRESHOLD)
        .map(result => ({
          issueId: result.issueId,
          title: result.title,
          status: result.status,
          createdAt: result.createdAt,
          similarity: result.overallSimilarity,
          isDuplicate: result.overallSimilarity >= DUPLICATE_THRESHOLD
        }));
      
      // Determine if there are any duplicates
      const hasDuplicates = potentialDuplicates.some(dup => dup.isDuplicate);
      
      // Get the highest confidence score
      const confidence = potentialDuplicates.length > 0 
        ? Math.max(...potentialDuplicates.map(dup => dup.similarity))
        : 0;
      
      return {
        hasDuplicates,
        potentialDuplicates,
        confidence
      };
    } catch (error) {
      console.error('Duplicate detection error:', error);
      return {
        hasDuplicates: false,
        potentialDuplicates: [],
        confidence: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Calculate text similarity between two text strings using AI
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {Promise<number>} - Similarity score (0-1)
   */
  async calculateTextSimilarity(text1, text2) {
    try {
      if (!this.isAvailable()) {
        return 0;
      }
      
      const prompt = `Compare the following two civic issue descriptions and rate their similarity on a scale from 0 to 1, where 1 means they are describing the exact same issue and 0 means they are completely unrelated.

Description 1: ${text1}

Description 2: ${text2}

Provide ONLY a number between 0 and 1 representing the similarity score.`;
      
      let response;
      if (this.activeService === 'gemini') {
        response = await axios.post(
          `${this.geminiBaseUrl}/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 10,
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );
        
        const result = response.data.candidates[0]?.content?.parts[0]?.text;
        // Extract number from result
        const similarityScore = parseFloat(result.trim());
        return isNaN(similarityScore) ? 0 : Math.min(1, Math.max(0, similarityScore));
      } else {
        response = await axios.post(
          `${this.openaiBaseUrl}/chat/completions`,
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a text similarity analyzer. Respond with only a number between 0 and 1.'
              },
              { role: 'user', content: prompt }
            ],
            max_tokens: 10,
            temperature: 0.1
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        const result = response.data.choices[0].message.content;
        // Extract number from result
        const similarityScore = parseFloat(result.trim());
        return isNaN(similarityScore) ? 0 : Math.min(1, Math.max(0, similarityScore));
      }
    } catch (error) {
      console.error('Text similarity calculation error:', error);
      return 0;
    }
  }
  
  /**
   * Calculate image similarity between two images using AI
   * @param {string} imageUrl1 - URL of first image
   * @param {string} imageUrl2 - URL of second image
   * @returns {Promise<number>} - Similarity score (0-1)
   */
  async calculateImageSimilarity(imageUrl1, imageUrl2) {
    try {
      if (!this.isAvailable() || !imageUrl1 || !imageUrl2) {
        return 0;
      }
      
      const prompt = `Compare these two images and rate their similarity on a scale from 0 to 1, where 1 means they show the exact same civic issue (same location, same problem) and 0 means they are completely unrelated.

Focus on whether they show the same infrastructure problem in the same location, not just visual similarity.

Provide ONLY a number between 0 and 1 representing the similarity score.`;
      
      if (this.activeService === 'gemini') {
        // Fetch and convert images to base64
        const [imageResponse1, imageResponse2] = await Promise.all([
          axios.get(imageUrl1, { responseType: 'arraybuffer', timeout: 15000 }),
          axios.get(imageUrl2, { responseType: 'arraybuffer', timeout: 15000 })
        ]);
        
        const base64Image1 = Buffer.from(imageResponse1.data).toString('base64');
        const base64Image2 = Buffer.from(imageResponse2.data).toString('base64');
        
        const mimeType1 = imageResponse1.headers['content-type'] || 'image/jpeg';
        const mimeType2 = imageResponse2.headers['content-type'] || 'image/jpeg';
        
        const response = await axios.post(
          `${this.geminiBaseUrl}/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`,
          {
            contents: [{
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType1,
                    data: base64Image1
                  }
                },
                {
                  inline_data: {
                    mime_type: mimeType2,
                    data: base64Image2
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 10,
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );
        
        const result = response.data.candidates[0]?.content?.parts[0]?.text;
        // Extract number from result
        const similarityScore = parseFloat(result.trim());
        return isNaN(similarityScore) ? 0 : Math.min(1, Math.max(0, similarityScore));
      } else {
        const response = await axios.post(
          `${this.openaiBaseUrl}/chat/completions`,
          {
            model: 'gpt-4-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: imageUrl1, detail: 'high' } },
                  { type: 'image_url', image_url: { url: imageUrl2, detail: 'high' } }
                ]
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
            timeout: 30000
          }
        );
        
        const result = response.data.choices[0].message.content;
        // Extract number from result
        const similarityScore = parseFloat(result.trim());
        return isNaN(similarityScore) ? 0 : Math.min(1, Math.max(0, similarityScore));
      }
    } catch (error) {
      console.error('Image similarity calculation error:', error);
      return 0;
    }
  }
  
  /**
   * Calculate distance between two geographical coordinates using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lng1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lng2 - Longitude of second point
   * @returns {number} - Distance in meters
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    // Haversine formula to calculate distance between two points on Earth
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance; // Distance in meters
  }
  
  /**
   * @param {Array} coordinates - [longitude, latitude] coordinates
   * @param {string} description - Issue description
   * @returns {Promise<Array>} - Array of potential duplicate issues with similarity scores
   */
  async detectDuplicateIssues(imageUrl, coordinates, description) {
    try {
      if (!this.isAvailable()) {
        return { duplicates: [], hasPotentialDuplicates: false };
      }
      
      // Step 1: Find nearby issues within 100 meters
      const nearbyIssues = await Issue.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: 100 // 100 meters radius
          }
        },
        status: { $nin: ['resolved', 'rejected'] } // Only consider open issues
      }).limit(10).lean();
      
      if (nearbyIssues.length === 0) {
        return { duplicates: [], hasPotentialDuplicates: false };
      }
      
      // Step 2: For each nearby issue, calculate similarity score
      const duplicateCandidates = [];
      
      for (const issue of nearbyIssues) {
        // Skip if no images to compare
        if (!issue.images || issue.images.length === 0) continue;
        
        // Calculate text similarity score using AI
        const textSimilarityScore = await this.calculateTextSimilarity(
          description,
          issue.description
        );
        
        // Calculate image similarity if the issue has images
        let imageSimilarityScore = 0;
        if (imageUrl && issue.images[0].url) {
          imageSimilarityScore = await this.calculateImageSimilarity(
            imageUrl,
            issue.images[0].url
          );
        }
        
        // Calculate distance-based similarity (closer = more similar)
        const distanceMeters = this.calculateDistance(coordinates, issue.location.coordinates);
        const distanceSimilarity = Math.max(0, 1 - (distanceMeters / 100)); // 0-100m → 1-0 similarity
        
        // Weighted similarity score (text: 40%, image: 40%, location: 20%)
        const overallSimilarity = (
          textSimilarityScore * 0.4 +
          imageSimilarityScore * 0.4 +
          distanceSimilarity * 0.2
        );
        
        if (overallSimilarity > 0.5) { // Only include somewhat similar issues
          duplicateCandidates.push({
            issue: {
              _id: issue._id,
              title: issue.title,
              description: issue.description,
              category: issue.category,
              status: issue.status,
              createdAt: issue.createdAt,
              imageUrl: issue.images[0]?.url
            },
            similarityScore: overallSimilarity,
            textSimilarity: textSimilarityScore,
            imageSimilarity: imageSimilarityScore,
            distanceSimilarity: distanceSimilarity,
            distanceMeters: Math.round(distanceMeters)
          });
        }
      }
      
      // Sort by similarity score (highest first)
      duplicateCandidates.sort((a, b) => b.similarityScore - a.similarityScore);
      
      return {
        duplicates: duplicateCandidates,
        hasPotentialDuplicates: duplicateCandidates.some(d => d.similarityScore >= this.DUPLICATE_THRESHOLD)
      };
    } catch (error) {
      console.error('Duplicate detection error:', error);
      return { duplicates: [], hasPotentialDuplicates: false };
    }
  }
  
  /**
   * Calculate text similarity between two descriptions
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {Promise<number>} - Similarity score (0-1)
   */
  async calculateTextSimilarity(text1, text2) {
    try {
      if (!this.isAvailable()) return 0.5;
      
      const prompt = `Compare these two civic issue descriptions and rate their similarity on a scale from 0 to 1, where 1 means they are describing the exact same issue and 0 means completely different issues. Return only the numeric score.

Description 1: ${text1}

Description 2: ${text2}`;
      
      let response;
      if (this.activeService === 'gemini') {
        response = await axios.post(
          `${this.geminiBaseUrl}/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 10,
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );
        
        const result = response.data.candidates[0]?.content?.parts[0]?.text;
        const score = parseFloat(result);
        return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
      } else {
        response = await axios.post(
          `${this.openaiBaseUrl}/chat/completions`,
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a text similarity analyzer. Return only a number between 0 and 1.'
              },
              { role: 'user', content: prompt }
            ],
            max_tokens: 10,
            temperature: 0.1
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        const result = response.data.choices[0].message.content;
        const score = parseFloat(result);
        return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
      }
    } catch (error) {
      console.error('Text similarity calculation error:', error);
      return 0.5; // Default middle value on error
    }
  }
  
  /**
   * Calculate image similarity between two images
   * @param {string} imageUrl1 - URL of first image
   * @param {string} imageUrl2 - URL of second image
   * @returns {Promise<number>} - Similarity score (0-1)
   */
  async calculateImageSimilarity(imageUrl1, imageUrl2) {
    try {
      if (!this.isAvailable()) return 0.5;
      
      // Use AI vision to compare images
      const prompt = `Compare these two images of civic infrastructure issues. Rate their visual similarity on a scale from 0 to 1, where 1 means they show the exact same issue from different angles and 0 means completely different issues. Focus on the infrastructure problem shown, not general scene similarity. Return only the numeric score.`;
      
      if (this.activeService === 'gemini') {
        // Fetch and convert images to base64
        const [image1Response, image2Response] = await Promise.all([
          axios.get(imageUrl1, { responseType: 'arraybuffer', timeout: 15000 }),
          axios.get(imageUrl2, { responseType: 'arraybuffer', timeout: 15000 })
        ]);
        
        const base64Image1 = Buffer.from(image1Response.data).toString('base64');
        const base64Image2 = Buffer.from(image2Response.data).toString('base64');
        
        const mimeType1 = image1Response.headers['content-type'] || 'image/jpeg';
        const mimeType2 = image2Response.headers['content-type'] || 'image/jpeg';
        
        const response = await axios.post(
          `${this.geminiBaseUrl}/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`,
          {
            contents: [{
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType1,
                    data: base64Image1
                  }
                },
                {
                  inline_data: {
                    mime_type: mimeType2,
                    data: base64Image2
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 10,
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );
        
        const result = response.data.candidates[0]?.content?.parts[0]?.text;
        const score = parseFloat(result);
        return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
      } else if (this.activeService === 'openai') {
        const response = await axios.post(
          `${this.openaiBaseUrl}/chat/completions`,
          {
            model: 'gpt-4-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: imageUrl1 } },
                  { type: 'image_url', image_url: { url: imageUrl2 } }
                ]
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
            timeout: 30000
          }
        );
        
        const result = response.data.choices[0].message.content;
        const score = parseFloat(result);
        return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
      }
    } catch (error) {
      console.error('Image similarity calculation error:', error);
      return 0.5; // Default middle value on error
    }
  }
  
  /**
   * Calculate distance between two coordinates in meters
   * @param {Array} coords1 - [longitude, latitude] of first point
   * @param {Array} coords2 - [longitude, latitude] of second point
   * @returns {number} - Distance in meters
   */
  calculateDistance(coords1, coords2) {
    // Haversine formula to calculate distance between two points on Earth
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distance in meters
  }
}

// Create singleton instance
const aiService = new AIService();

module.exports = aiService;