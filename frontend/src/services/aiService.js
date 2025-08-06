import api from './api';

class AIService {
  constructor() {
    this.isEnabled = true; // Can be controlled via environment variables
  }

  /**
   * Analyze an image using AI to generate description and categorization
   * @param {File} file - The image file to analyze
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeImage(file) {
    if (!this.isEnabled) {
      return this.getFallbackAnalysis();
    }

    try {
      // Convert file to base64 for API transmission
      const base64Image = await this.fileToBase64(file);
      
      const response = await api.post('/ai/analyze-image', {
        image: base64Image,
        filename: file.name,
        fileType: file.type
      });

      return response.data.data;
    } catch (error) {
      console.error('AI image analysis error:', error);
      
      // Return fallback analysis if AI service fails
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Analyze multiple images in batch
   * @param {File[]} files - Array of image files
   * @returns {Promise<Object[]>} Array of analysis results
   */
  async analyzeImages(files) {
    try {
      const analyses = await Promise.all(
        files.map(file => this.analyzeImage(file))
      );
      
      // Combine analyses for better context
      return this.combineAnalyses(analyses);
    } catch (error) {
      console.error('Batch image analysis error:', error);
      return files.map(() => this.getFallbackAnalysis());
    }
  }

  /**
   * Generate issue categorization based on description and image analysis
   * @param {string} description - User provided description
   * @param {Object[]} imageAnalyses - Results from image analysis
   * @returns {Promise<Object>} Categorization results
   */
  async categorizeIssue(description, imageAnalyses = []) {
    if (!this.isEnabled) {
      return this.getFallbackCategorization(description);
    }

    try {
      const response = await api.post('/ai/categorize-issue', {
        description,
        imageAnalyses,
        context: 'civic_infrastructure'
      });

      return response.data.data;
    } catch (error) {
      console.error('AI categorization error:', error);
      return this.getFallbackCategorization(description);
    }
  }

  /**
   * Generate smart suggestions for issue resolution
   * @param {Object} issue - The issue object
   * @returns {Promise<Object>} Resolution suggestions
   */
  async generateResolutionSuggestions(issue) {
    if (!this.isEnabled) {
      return this.getFallbackSuggestions();
    }

    try {
      const response = await api.post('/ai/resolution-suggestions', {
        category: issue.category,
        description: issue.description,
        imageAnalyses: issue.aiAnalysis?.imageAnalyses || [],
        priority: issue.priority,
        location: issue.location
      });

      return response.data.data;
    } catch (error) {
      console.error('AI suggestions error:', error);
      return this.getFallbackSuggestions();
    }
  }

  /**
   * Convert file to base64 string
   * @param {File} file - The file to convert
   * @returns {Promise<string>} Base64 encoded string
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/...;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Combine multiple image analyses for better context
   * @param {Object[]} analyses - Array of individual analyses
   * @returns {Object} Combined analysis
   */
  combineAnalyses(analyses) {
    if (analyses.length === 0) return this.getFallbackAnalysis();
    if (analyses.length === 1) return analyses[0];

    // Extract common themes and create combined description
    const descriptions = analyses.map(a => a.description).filter(Boolean);
    const categories = analyses.map(a => a.suggestedCategory).filter(Boolean);
    const confidenceScores = analyses.map(a => a.confidence || 0);

    // Find most common category
    const categoryCount = {};
    categories.forEach(cat => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    const mostCommonCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, categories[0]
    );

    // Average confidence
    const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;

    return {
      description: descriptions.join('. '),
      suggestedCategory: mostCommonCategory,
      confidence: avgConfidence,
      imageCount: analyses.length,
      individualAnalyses: analyses
    };
  }

  /**
   * Fallback analysis when AI is unavailable
   * @returns {Object} Basic analysis structure
   */
  getFallbackAnalysis() {
    return {
      description: 'Image uploaded successfully. AI analysis is currently unavailable.',
      suggestedCategory: 'other',
      confidence: 0,
      source: 'fallback',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fallback categorization based on keywords
   * @param {string} description - The issue description
   * @returns {Object} Basic categorization
   */
  getFallbackCategorization(description) {
    const keywords = {
      pothole: ['pothole', 'hole', 'road damage', 'asphalt', 'pavement'],
      street_light: ['light', 'lamp', 'lighting', 'dark', 'bulb'],
      drainage: ['drain', 'water', 'flood', 'sewer', 'drainage'],
      traffic_signal: ['traffic', 'signal', 'light', 'intersection', 'stop'],
      sidewalk: ['sidewalk', 'walkway', 'pedestrian', 'path'],
      graffiti: ['graffiti', 'vandalism', 'spray', 'tag'],
      garbage: ['garbage', 'trash', 'litter', 'waste', 'dump']
    };

    const descLower = description.toLowerCase();
    
    for (const [category, terms] of Object.entries(keywords)) {
      if (terms.some(term => descLower.includes(term))) {
        return {
          suggestedCategory: category,
          confidence: 0.7,
          reasoning: `Detected keywords: ${terms.filter(term => descLower.includes(term)).join(', ')}`,
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
   * Fallback resolution suggestions
   * @returns {Object} Basic suggestions
   */
  getFallbackSuggestions() {
    return {
      estimatedTime: 'varies',
      department: 'Public Works',
      priority: 'standard',
      steps: [
        'Issue will be reviewed by relevant department',
        'Assessment will be conducted if necessary',
        'Appropriate action will be taken based on severity',
        'Updates will be provided as work progresses'
      ],
      source: 'fallback'
    };
  }

  /**
   * Check if AI services are available
   * @returns {Promise<boolean>} Service availability
   */
  async checkServiceHealth() {
    try {
      const response = await api.get('/ai/health');
      return response.data.success && response.data.data.status === 'healthy';
    } catch (error) {
      console.warn('AI service health check failed:', error);
      return false;
    }
  }

  /**
   * Get AI service statistics
   * @returns {Promise<Object>} Service statistics
   */
  async getServiceStats() {
    try {
      const response = await api.get('/ai/stats');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get AI service stats:', error);
      return {
        analysisCount: 0,
        accuracy: 0,
        averageResponseTime: 0,
        lastUpdate: null
      };
    }
  }

  /**
   * Enable or disable AI services
   * @param {boolean} enabled - Whether to enable AI
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Get current AI service configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return {
      enabled: this.isEnabled,
      supportedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxBatchSize: 5,
      features: {
        imageAnalysis: true,
        categorization: true,
        resolutionSuggestions: true,
        batchProcessing: true
      }
    };
  }
}

// Export singleton instance
const aiService = new AIService();

// Export individual functions for convenience
export const analyzeImage = (file) => aiService.analyzeImage(file);
export const analyzeImages = (files) => aiService.analyzeImages(files);
export const categorizeIssue = (description, imageAnalyses) => aiService.categorizeIssue(description, imageAnalyses);
export const generateResolutionSuggestions = (issue) => aiService.generateResolutionSuggestions(issue);

export default aiService;