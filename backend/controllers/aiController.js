const axios = require('axios');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');
const aiService = require('../utils/aiService');

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Categories mapping for civic issues
const CIVIC_CATEGORIES = {
  'pothole': 'Road surface damage including potholes, cracks, and uneven pavement',
  'street_light': 'Street lighting issues including broken bulbs, damaged fixtures, or inadequate lighting',
  'drainage': 'Water drainage problems including blocked drains, flooding, or poor water management',
  'traffic_signal': 'Traffic control systems including broken signals, timing issues, or missing signs',
  'road_damage': 'General road infrastructure damage excluding potholes',
  'sidewalk': 'Pedestrian walkway issues including cracks, obstacles, or accessibility problems',
  'graffiti': 'Vandalism and unauthorized markings on public property',
  'garbage': 'Waste management issues including litter, overflowing bins, or illegal dumping',
  'water_leak': 'Water infrastructure problems including leaks, burst pipes, or water waste',
  'park_maintenance': 'Public space maintenance including damaged equipment or overgrown vegetation',
  'noise_complaint': 'Noise pollution from construction, traffic, or other sources',
  'other': 'Issues that don\'t fit into other categories'
};

/**
 * Generate a weekly report of civic issues using AI analysis
 */
const generateWeeklyReport = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw new AppError('Only administrators can generate reports', 403);
  }

  // Get date range from request or default to last 7 days
  const { startDate, endDate } = req.query;

  const reportStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const reportEndDate = endDate ? new Date(endDate) : new Date();

  // Validate date range
  if (reportStartDate > reportEndDate) {
    throw new AppError('Start date must be before end date', 400);
  }

  // Check if AI service is available
  if (!aiService.isAvailable()) {
    throw new AppError('AI service is not available', 503);
  }

  // Generate the report
  const report = await aiService.generateWeeklyReport(reportStartDate, reportEndDate);

  if (!report.success) {
    throw new AppError(report.error || 'Failed to generate report', 500);
  }

  res.status(200).json({
    success: true,
    data: report
  });
});

/**
 * Analyze an image using OpenAI Vision API
 */
const analyzeImage = asyncHandler(async (req, res) => {
  const { image, filename, fileType } = req.body;

  if (!image) {
    throw new AppError('Image data is required', 400);
  }

  // Check if Gemini API key is configured
  if (!GEMINI_API_KEY) {
    return res.status(200).json({
      success: true,
      data: {
        description: 'Image uploaded successfully. AI analysis is currently unavailable - Gemini API key not configured.',
        suggestedCategory: 'other',
        confidence: 0,
        source: 'fallback',
        timestamp: new Date().toISOString()
      }
    });
  }

  try {
    const prompt = `Analyze this civic infrastructure image and provide a clear, helpful analysis.

Please examine the image and provide:
1. A detailed, user-friendly description of what you observe
2. Identify any infrastructure problems, damage, or safety concerns
3. Suggest the most appropriate category from: ${Object.keys(CIVIC_CATEGORIES).join(', ')}
4. Rate the severity (1=minor, 5=urgent)
5. List key features or problems visible
6. Your confidence in this analysis (0-1)

Respond in JSON format with these exact fields:
{
  "description": "Clear, detailed description in plain English",
  "suggestedCategory": "category_name",
  "severity": number_1_to_5,
  "confidence": decimal_0_to_1,
  "keyFeatures": ["feature1", "feature2", "feature3"]
}`;

    const response = await axios.post(
      `${GEMINI_BASE_URL}/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: fileType,
                data: image
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
        timeout: 15000
      }
    );

    const aiResponse = response.data.candidates[0]?.content?.parts[0]?.text;

    try {
      // Clean the response - remove any markdown formatting or extra text
      let cleanResponse = aiResponse.trim();

      // Extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = cleanResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[1];
      }

      // Try to parse the JSON response
      const analysisData = JSON.parse(cleanResponse);

      // Validate and format the response with user-friendly formatting
      const analysis = {
        description: analysisData.description || 'Image analyzed successfully',
        suggestedCategory: analysisData.suggestedCategory || 'other',
        severity: Math.min(Math.max(analysisData.severity || 1, 1), 5),
        confidence: Math.min(Math.max(analysisData.confidence || 0.5, 0), 1),
        keyFeatures: Array.isArray(analysisData.keyFeatures) ? analysisData.keyFeatures : [],
        source: 'gemini_vision',
        timestamp: new Date().toISOString(),
        model: 'gemini-2.0-flash-exp',
        // Add user-friendly formatting
        severityText: getSeverityText(Math.min(Math.max(analysisData.severity || 1, 1), 5)),
        confidenceText: getConfidenceText(Math.min(Math.max(analysisData.confidence || 0.5, 0), 1)),
        categoryDescription: CIVIC_CATEGORIES[analysisData.suggestedCategory] || CIVIC_CATEGORIES.other
      };

      res.status(200).json({
        success: true,
        data: analysis
      });

    } catch (parseError) {
      console.log('JSON parse error, using text extraction:', parseError.message);

      // If JSON parsing fails, create a user-friendly response from the text
      const cleanText = aiResponse.replace(/```json|```/g, '').trim();

      const analysis = {
        description: extractDescriptionFromText(cleanText),
        suggestedCategory: extractCategoryFromText(cleanText),
        severity: extractSeverityFromText(cleanText),
        confidence: 0.7,
        keyFeatures: extractKeyFeaturesFromText(cleanText),
        source: 'gemini_vision_text',
        timestamp: new Date().toISOString(),
        model: 'gemini-2.0-flash-exp',
        severityText: getSeverityText(extractSeverityFromText(cleanText)),
        confidenceText: getConfidenceText(0.7),
        categoryDescription: CIVIC_CATEGORIES[extractCategoryFromText(cleanText)] || CIVIC_CATEGORIES.other,
        rawResponse: cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '')
      };

      res.status(200).json({
        success: true,
        data: analysis
      });
    }

  } catch (error) {
    console.error('Gemini API error:', error);

    // Provide a more helpful fallback based on file name or basic analysis
    const fallbackDescription = generateSmartFallback(filename, fileType);

    // Return enhanced fallback analysis
    res.status(200).json({
      success: true,
      data: {
        description: fallbackDescription,
        suggestedCategory: extractCategoryFromFilename(filename),
        confidence: 0.3,
        source: 'smart_fallback',
        timestamp: new Date().toISOString(),
        note: 'AI analysis temporarily unavailable - using smart fallback',
        quota_exceeded: error.response?.status === 429
      }
    });
  }
});

/**
 * Categorize an issue based on description and image analyses
 */
const categorizeIssue = asyncHandler(async (req, res) => {
  const { description, imageAnalyses = [], context = 'civic_infrastructure' } = req.body;

  if (!description) {
    throw new AppError('Description is required', 400);
  }

  // If Gemini API is not available, use keyword matching
  if (!GEMINI_API_KEY) {
    const categorization = keywordBasedCategorization(description);
    return res.status(200).json({
      success: true,
      data: categorization
    });
  }

  try {
    // Combine description with image analyses
    const combinedInfo = {
      description,
      imageAnalyses: imageAnalyses.filter(analysis => analysis && analysis.description)
    };

    const prompt = `
    Categorize this civic infrastructure issue:
    
    Description: "${description}"
    
    ${combinedInfo.imageAnalyses.length > 0 ?
        `Image Analysis Results:\n${combinedInfo.imageAnalyses.map((analysis, i) =>
          `Image ${i + 1}: ${analysis.description}`
        ).join('\n')}` : ''
      }
    
    Available categories: ${Object.keys(CIVIC_CATEGORIES).join(', ')}
    
    Provide response as JSON with: suggestedCategory, confidence (0-1), reasoning, priority (low/medium/high/urgent)
    `;

    const response = await axios.post(
      `${GEMINI_BASE_URL}/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 300,
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    const aiResponse = response.data.candidates[0]?.content?.parts[0]?.text;

    try {
      const categorization = JSON.parse(aiResponse);

      res.status(200).json({
        success: true,
        data: {
          suggestedCategory: categorization.suggestedCategory || 'other',
          confidence: Math.min(Math.max(categorization.confidence || 0.5, 0), 1),
          reasoning: categorization.reasoning || 'AI analysis completed',
          priority: categorization.priority || 'medium',
          source: 'gemini_categorization',
          timestamp: new Date().toISOString()
        }
      });

    } catch (parseError) {
      const fallback = keywordBasedCategorization(description);
      fallback.source = 'gemini_parse_error';

      res.status(200).json({
        success: true,
        data: fallback
      });
    }

  } catch (error) {
    console.error('Categorization error:', error);

    const fallback = keywordBasedCategorization(description);
    fallback.source = 'error_fallback';
    fallback.error = error.message;

    res.status(200).json({
      success: true,
      data: fallback
    });
  }
});

/**
 * Generate resolution suggestions for an issue
 */
const generateResolutionSuggestions = asyncHandler(async (req, res) => {
  const { category, description, priority = 'medium', location } = req.body;

  if (!category || !description) {
    throw new AppError('Category and description are required', 400);
  }

  // Fallback suggestions
  const fallbackSuggestions = getFallbackSuggestions(category, priority);

  if (!GEMINI_API_KEY) {
    return res.status(200).json({
      success: true,
      data: fallbackSuggestions
    });
  }

  try {
    const prompt = `
    Generate resolution suggestions for this civic issue:
    
    Category: ${category}
    Description: ${description}
    Priority: ${priority}
    
    Provide suggestions as JSON with:
    - estimatedTime: realistic timeframe for resolution
    - department: which city department should handle this
    - steps: array of specific action steps
    - resources: estimated resources needed
    - priority: recommended priority level
    `;

    const response = await axios.post(
      `${GEMINI_BASE_URL}/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 1,
          maxOutputTokens: 400,
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    const aiResponse = response.data.candidates[0]?.content?.parts[0]?.text;

    try {
      const suggestions = JSON.parse(aiResponse);

      res.status(200).json({
        success: true,
        data: {
          estimatedTime: suggestions.estimatedTime || fallbackSuggestions.estimatedTime,
          department: suggestions.department || fallbackSuggestions.department,
          steps: suggestions.steps || fallbackSuggestions.steps,
          resources: suggestions.resources || fallbackSuggestions.resources,
          priority: suggestions.priority || priority,
          source: 'gemini_suggestions',
          timestamp: new Date().toISOString()
        }
      });

    } catch (parseError) {
      fallbackSuggestions.source = 'gemini_parse_error';
      res.status(200).json({
        success: true,
        data: fallbackSuggestions
      });
    }

  } catch (error) {
    console.error('Resolution suggestions error:', error);

    fallbackSuggestions.source = 'error_fallback';
    fallbackSuggestions.error = error.message;

    res.status(200).json({
      success: true,
      data: fallbackSuggestions
    });
  }
});

/**
 * Health check for AI services
 */
const healthCheck = asyncHandler(async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      gemini: !!GEMINI_API_KEY
    }
  };

  if (GEMINI_API_KEY) {
    try {
      // Quick test call to Gemini
      await axios.post(
        `${GEMINI_BASE_URL}/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: "Test" }] }],
          generationConfig: { maxOutputTokens: 1 }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );
      health.services.gemini = true;
    } catch (error) {
      health.services.gemini = false;
      health.status = 'degraded';
    }
  } else {
    health.status = 'limited';
  }

  res.status(200).json({
    success: true,
    data: health
  });
});

/**
 * Get AI service statistics
 */
const getStats = asyncHandler(async (req, res) => {
  // In a real application, you would track these metrics in a database
  const stats = {
    analysisCount: 0,
    accuracy: 0.85,
    averageResponseTime: 2500, // milliseconds
    lastUpdate: new Date().toISOString(),
    modelsAvailable: GEMINI_API_KEY ? ['gemini-2.0-flash-exp'] : [],
    supportedFeatures: {
      imageAnalysis: !!GEMINI_API_KEY,
      categorization: true,
      resolutionSuggestions: true
    }
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

// Helper functions

/**
 * Get user-friendly severity text
 */
function getSeverityText(severity) {
  const severityMap = {
    1: 'Minor Issue',
    2: 'Low Priority',
    3: 'Medium Priority',
    4: 'High Priority',
    5: 'Urgent - Immediate Action Required'
  };
  return severityMap[severity] || 'Unknown';
}

/**
 * Get user-friendly confidence text
 */
function getConfidenceText(confidence) {
  if (confidence >= 0.9) return 'Very High Confidence';
  if (confidence >= 0.7) return 'High Confidence';
  if (confidence >= 0.5) return 'Medium Confidence';
  if (confidence >= 0.3) return 'Low Confidence';
  return 'Very Low Confidence';
}

/**
 * Extract description from text response
 */
function extractDescriptionFromText(text) {
  // Look for description patterns in the text
  const descriptionPatterns = [
    /description['":\s]+([^"'\n]+)/i,
    /shows?\s+([^.!?]+[.!?])/i,
    /image\s+(?:shows?|depicts?|contains?)\s+([^.!?]+[.!?])/i
  ];

  for (const pattern of descriptionPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/['"]/g, '');
    }
  }

  // Fallback: use first sentence or first 200 characters
  const sentences = text.split(/[.!?]+/);
  if (sentences.length > 0 && sentences[0].length > 10) {
    return sentences[0].trim() + '.';
  }

  return text.substring(0, 200).trim() + (text.length > 200 ? '...' : '');
}

/**
 * Extract key features from text response
 */
function extractKeyFeaturesFromText(text) {
  const features = [];
  const textLower = text.toLowerCase();

  // Common infrastructure issues to look for
  const featureKeywords = {
    'Multiple potholes': ['multiple', 'several', 'many', 'pothole'],
    'Water damage': ['water', 'wet', 'flood', 'moisture'],
    'Cracked surface': ['crack', 'split', 'broken', 'damaged'],
    'Safety hazard': ['dangerous', 'hazard', 'unsafe', 'risk'],
    'Poor drainage': ['drain', 'standing water', 'pooling'],
    'Structural damage': ['structural', 'foundation', 'support'],
    'Wear and tear': ['worn', 'deteriorated', 'aged', 'old']
  };

  for (const [feature, keywords] of Object.entries(featureKeywords)) {
    if (keywords.some(keyword => textLower.includes(keyword))) {
      features.push(feature);
    }
  }

  return features.length > 0 ? features : ['Infrastructure issue identified'];
}

/**
 * Extract category from text response
 */
function extractCategoryFromText(text) {
  const textLower = text.toLowerCase();

  for (const category of Object.keys(CIVIC_CATEGORIES)) {
    if (textLower.includes(category.replace('_', ' ')) || textLower.includes(category)) {
      return category;
    }
  }

  return 'other';
}

/**
 * Extract severity from text response
 */
function extractSeverityFromText(text) {
  const textLower = text.toLowerCase();

  if (textLower.includes('urgent') || textLower.includes('severe') || textLower.includes('5')) {
    return 5;
  } else if (textLower.includes('high') || textLower.includes('4')) {
    return 4;
  } else if (textLower.includes('medium') || textLower.includes('moderate') || textLower.includes('3')) {
    return 3;
  } else if (textLower.includes('low') || textLower.includes('minor') || textLower.includes('2')) {
    return 2;
  }

  return 1;
}

/**
 * Keyword-based categorization fallback
 */
function keywordBasedCategorization(description) {
  const keywords = {
    pothole: ['pothole', 'hole', 'road damage', 'asphalt', 'pavement', 'crack'],
    street_light: ['light', 'lamp', 'lighting', 'dark', 'bulb', 'illumination'],
    drainage: ['drain', 'water', 'flood', 'sewer', 'drainage', 'runoff'],
    traffic_signal: ['traffic', 'signal', 'light', 'intersection', 'stop', 'yield'],
    road_damage: ['road', 'street', 'damage', 'surface', 'repair'],
    sidewalk: ['sidewalk', 'walkway', 'pedestrian', 'path', 'curb'],
    graffiti: ['graffiti', 'vandalism', 'spray', 'tag', 'defacement'],
    garbage: ['garbage', 'trash', 'litter', 'waste', 'dump', 'rubbish'],
    water_leak: ['leak', 'burst', 'pipe', 'water', 'flooding'],
    park_maintenance: ['park', 'playground', 'equipment', 'bench', 'recreation'],
    noise_complaint: ['noise', 'loud', 'construction', 'disturbance']
  };

  const descLower = description.toLowerCase();

  for (const [category, terms] of Object.entries(keywords)) {
    const matchedTerms = terms.filter(term => descLower.includes(term));
    if (matchedTerms.length > 0) {
      return {
        suggestedCategory: category,
        confidence: Math.min(0.7 + (matchedTerms.length * 0.1), 0.95),
        reasoning: `Detected keywords: ${matchedTerms.join(', ')}`,
        source: 'keyword_matching'
      };
    }
  }

  return {
    suggestedCategory: 'other',
    confidence: 0.3,
    reasoning: 'No specific keywords detected',
    source: 'default'
  };
}

/**
 * Get fallback resolution suggestions
 */
function getFallbackSuggestions(category, priority) {
  const suggestions = {
    pothole: {
      estimatedTime: '3-7 days',
      department: 'Public Works - Street Maintenance',
      steps: [
        'Report will be assessed by street maintenance team',
        'Pothole will be marked for safety',
        'Materials will be prepared for permanent repair',
        'Repair work will be scheduled and completed'
      ]
    },
    street_light: {
      estimatedTime: '1-3 days',
      department: 'Public Works - Electrical',
      steps: [
        'Electrical team will assess the issue',
        'Determine if bulb replacement or fixture repair is needed',
        'Schedule maintenance work',
        'Complete repair and test functionality'
      ]
    },
    drainage: {
      estimatedTime: '2-5 days',
      department: 'Public Works - Water Management',
      steps: [
        'Water management team will inspect the area',
        'Clear blockages if present',
        'Assess infrastructure for damage',
        'Implement repair or improvement measures'
      ]
    },
    default: {
      estimatedTime: '3-10 days',
      department: 'Public Works',
      steps: [
        'Issue will be reviewed by relevant department',
        'On-site assessment will be conducted',
        'Appropriate action will be determined',
        'Work will be scheduled and completed'
      ]
    }
  };

  return {
    ...suggestions[category] || suggestions.default,
    priority: priority,
    source: 'fallback_suggestions'
  };
}

/**
 * Generate a smart fallback description based on filename and file type
 */
function generateSmartFallback(filename, fileType) {
  const name = filename.toLowerCase();
  const timestamp = new Date().toLocaleString();

  // Look for keywords in filename
  if (name.includes('pothole') || name.includes('road') || name.includes('crack')) {
    return `Road infrastructure image uploaded (${filename}). This appears to be related to road surface issues. Photo taken on ${timestamp}. Please provide additional details in the description field for better categorization.`;
  } else if (name.includes('light') || name.includes('lamp') || name.includes('street')) {
    return `Street lighting image uploaded (${filename}). This appears to be related to lighting infrastructure. Photo taken on ${timestamp}. Please describe the specific issue with the lighting in the description field.`;
  } else if (name.includes('drain') || name.includes('water') || name.includes('flood')) {
    return `Drainage/water management image uploaded (${filename}). This appears to be related to water infrastructure. Photo taken on ${timestamp}. Please provide details about the water-related issue.`;
  } else if (name.includes('traffic') || name.includes('signal') || name.includes('sign')) {
    return `Traffic management image uploaded (${filename}). This appears to be related to traffic control systems. Photo taken on ${timestamp}. Please describe the traffic-related issue.`;
  } else if (name.includes('park') || name.includes('playground') || name.includes('bench')) {
    return `Public space image uploaded (${filename}). This appears to be related to park or recreational facilities. Photo taken on ${timestamp}. Please describe the maintenance issue.`;
  } else if (name.includes('garbage') || name.includes('trash') || name.includes('litter')) {
    return `Waste management image uploaded (${filename}). This appears to be related to garbage or litter issues. Photo taken on ${timestamp}. Please provide details about the waste problem.`;
  }

  return `Civic infrastructure image uploaded (${filename}). High-quality ${fileType} image captured on ${timestamp}. AI analysis is temporarily unavailable due to quota limits. Please provide a detailed description of the issue to help with categorization and processing.`;
}

/**
 * Extract likely category from filename
 */
function extractCategoryFromFilename(filename) {
  const name = filename.toLowerCase();

  if (name.includes('pothole') || name.includes('road') || name.includes('crack')) return 'pothole';
  if (name.includes('light') || name.includes('lamp') || name.includes('street')) return 'street_light';
  if (name.includes('drain') || name.includes('water') || name.includes('flood')) return 'drainage';
  if (name.includes('traffic') || name.includes('signal') || name.includes('sign')) return 'traffic_signal';
  if (name.includes('sidewalk') || name.includes('walk') || name.includes('path')) return 'sidewalk';
  if (name.includes('park') || name.includes('playground') || name.includes('bench')) return 'park_maintenance';
  if (name.includes('garbage') || name.includes('trash') || name.includes('litter')) return 'garbage';
  if (name.includes('graffiti') || name.includes('vandal') || name.includes('spray')) return 'graffiti';

  return 'other';
}

module.exports = {
  analyzeImage,
  categorizeIssue,
  generateResolutionSuggestions,
  healthCheck,
  getStats,
  generateWeeklyReport
};