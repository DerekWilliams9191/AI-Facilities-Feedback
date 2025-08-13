const fs = require('fs');
const path = require('path');
const axios = require('axios');

class AIService {
  constructor() {
    this.workRequestCategories = this.loadWorkRequestCategories();
  }

  loadWorkRequestCategories() {
    try {
      const filePath = path.join(__dirname, '..', 'work-requests.json');
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading work request categories:', error);
      return [];
    }
  }

  async classifyRequest(description, location) {
    try {
      console.log(`[AI Classification] Processing request: "${description}" at location: ${location}`);
      
      const prompt = `You are a facilities management AI assistant. Classify the following maintenance request into one of the predefined categories.

Available Categories:
${this.workRequestCategories.map(cat => `- ${cat}`).join('\n')}

Maintenance Request: "${description}"
Location: ${location}

Respond with ONLY the exact category name from the list above that best matches this request. If no category is a good match, respond with "NO_MATCH".

Category:`;

      const response = await this.callOllamaAPI(prompt);
      
      if (!response) {
        console.log('[AI Classification] No response from AI - flagging for manual review');
        return {
          success: true,
          category: null,
          needsManualReview: true,
          reason: 'AI service unavailable'
        };
      }

      const category = response.trim();
      
      if (category === 'NO_MATCH' || !this.workRequestCategories.includes(category)) {
        console.log('[AI Classification] No matching category found - flagging for manual review');
        return {
          success: true,
          category: null,
          needsManualReview: true,
          reason: 'No matching category found'
        };
      }

      console.log(`[AI Classification] Matched category: ${category}`);
      return {
        success: true,
        category: category,
        needsManualReview: false
      };
    } catch (error) {
      console.error('[AI Classification] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async callOllamaAPI(prompt) {
    try {
      console.log('[Ollama API] Making request to Ollama...');
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
      const model = process.env.OLLAMA_MODEL || 'gemma2:2b';
      const response = await axios.post(`${ollamaUrl}/api/generate`, {
        model: model,
        prompt: prompt,
        stream: false
      });
      
      console.log('[Ollama API] Request successful');
      return response.data.response;
    } catch (error) {
      console.error('[Ollama API] Error calling Ollama:', error.response?.status, error.response?.statusText);
      console.error('[Ollama API] Error details:', error.message);
      if (error.response?.data) {
        console.error('[Ollama API] Response data:', error.response.data);
      }
      return null;
    }
  }

  async checkForDuplicates(description, location, category, existingTickets = []) {
    try {
      console.log(`[Duplicate Check] Checking for duplicates in building: ${location}`);
      
      const buildingTickets = existingTickets.filter(ticket => 
        ticket.location === location
      );
      
      console.log(`[Duplicate Check] Found ${buildingTickets.length} existing tickets in building`);
      
      if (buildingTickets.length === 0) {
        return {
          isDuplicate: false,
          duplicateTickets: []
        };
      }
      
      const duplicates = buildingTickets.filter(ticket => 
        this.isSimilarRequest(description, ticket.description, category, ticket.category)
      );
      
      if (duplicates.length > 0) {
        console.log(`[Duplicate Check] Found ${duplicates.length} potential duplicates`);
        return {
          isDuplicate: true,
          duplicateTickets: duplicates
        };
      }
      
      console.log('[Duplicate Check] No duplicates found');
      return {
        isDuplicate: false,
        duplicateTickets: []
      };
    } catch (error) {
      console.error('[Duplicate Check] Error:', error);
      return {
        isDuplicate: false,
        duplicateTickets: [],
        error: error.message
      };
    }
  }

  isSimilarRequest(description1, description2, category1, category2) {
    if (category1 && category2 && category1 === category2) {
      const similarity = this.calculateTextSimilarity(description1, description2);
      return similarity > 0.7;
    }
    return false;
  }

  calculateTextSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  }
}

module.exports = AIService;