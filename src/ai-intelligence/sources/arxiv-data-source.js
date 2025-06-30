/**
 * arXiv Data Source - Research Paper Monitoring
 * 
 * Purpose: Fetch latest AI research papers from arXiv
 * Architecture: RSS/API integration for academic research
 * Context: Track cutting-edge AI research developments
 */

const { getLogger } = require('../../utils/logger');

/**
 * ArxivDataSource - arXiv research paper monitoring
 * 
 * Features:
 * - Latest AI/ML paper tracking
 * - Subject area filtering
 * - Author and citation analysis
 * - Abstract processing for relevance
 */
class ArxivDataSource {
  constructor(options = {}) {
    this.name = 'arxiv-data-source';
    this.config = {
      baseUrl: 'http://export.arxiv.org/api/query',
      categories: [
        'cs.AI',  // Artificial Intelligence
        'cs.LG',  // Machine Learning
        'cs.CL',  // Computation and Language
        'cs.CV',  // Computer Vision
        'stat.ML' // Machine Learning (Statistics)
      ],
      maxResults: 50,
      timeout: 30000,
      ...options
    };
    
    this.logger = getLogger('ArxivDataSource');
  }
  
  /**
   * Build arXiv API query URL
   * @param {Object} params - Query parameters
   * @returns {string} API URL
   */
  buildQueryUrl(params) {
    const {
      searchQuery = '',
      categories = this.config.categories,
      maxResults = this.config.maxResults,
      sortBy = 'submittedDate',
      sortOrder = 'descending'
    } = params;
    
    let query = '';
    
    // Add category filters
    if (categories.length > 0) {
      const categoryQuery = categories.map(cat => `cat:${cat}`).join(' OR ');
      query = `(${categoryQuery})`;
    }
    
    // Add search terms
    if (searchQuery) {
      const searchTerms = searchQuery.split(' ').map(term => 
        `(ti:"${term}" OR abs:"${term}")`
      ).join(' AND ');
      
      query = query ? `${query} AND ${searchTerms}` : searchTerms;
    }
    
    const params_str = new URLSearchParams({
      search_query: query,
      start: 0,
      max_results: maxResults,
      sortBy: sortBy,
      sortOrder: sortOrder
    });
    
    return `${this.config.baseUrl}?${params_str}`;
  }
  
  /**
   * Parse arXiv XML response
   * @param {string} xmlText - XML response from arXiv
   * @returns {Array} Parsed paper entries
   */
  parseArxivXML(xmlText) {
    // Simple XML parsing for demonstration
    // In production, use a proper XML parser like 'xml2js'
    const papers = [];
    
    try {
      // Extract entry blocks
      const entryMatches = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
      
      entryMatches.forEach(entryXml => {
        const paper = {};
        
        // Extract basic fields
        const extractField = (fieldName, regex) => {
          const match = entryXml.match(regex);
          return match ? match[1].trim() : '';
        };
        
        paper.id = extractField('id', /<id>([^<]+)<\/id>/);
        paper.title = extractField('title', /<title>([^<]+)<\/title>/);
        paper.summary = extractField('summary', /<summary>([\s\S]*?)<\/summary>/);
        paper.published = extractField('published', /<published>([^<]+)<\/published>/);
        paper.updated = extractField('updated', /<updated>([^<]+)<\/updated>/);
        
        // Extract authors
        const authorMatches = entryXml.match(/<author><name>([^<]+)<\/name><\/author>/g) || [];
        paper.authors = authorMatches.map(match => 
          match.match(/<name>([^<]+)<\/name>/)[1]
        );
        
        // Extract categories
        const categoryMatches = entryXml.match(/term="([^"]+)"/g) || [];
        paper.categories = categoryMatches.map(match => 
          match.match(/term="([^"]+)"/)[1]
        );
        
        // Clean up summary
        paper.summary = paper.summary.replace(/\s+/g, ' ').trim();
        
        papers.push(paper);
      });
      
    } catch (error) {
      this.logger.error('Error parsing arXiv XML:', error.message);
    }
    
    return papers;
  }
  
  /**
   * Fetch latest papers from arXiv
   * @param {Object} params - Search parameters
   * @returns {Array} Latest research papers
   */
  async getLatestPapers(params = {}) {
    try {
      const url = this.buildQueryUrl(params);
      this.logger.debug(`Fetching arXiv papers: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(url, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status} ${response.statusText}`);
      }
      
      const xmlText = await response.text();
      const papers = this.parseArxivXML(xmlText);
      
      // Transform to our standard format
      return papers.map(paper => ({
        id: paper.id,
        title: paper.title,
        content: paper.summary,
        authors: paper.authors,
        categories: paper.categories,
        publishedAt: paper.published,
        updatedAt: paper.updated,
        url: paper.id, // arXiv ID is the URL
        source: 'arXiv',
        type: 'research_paper'
      }));
      
    } catch (error) {
      this.logger.error(`Failed to fetch arXiv papers: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Analyze paper relevance to AI development
   * @param {Object} paper - Paper to analyze
   * @returns {number} Relevance score (0-1)
   */
  analyzeRelevance(paper) {
    const relevantKeywords = [
      'llm', 'large language model', 'transformer', 'attention',
      'agent', 'rag', 'retrieval', 'embedding', 'vector',
      'deployment', 'inference', 'optimization', 'fine-tuning',
      'multimodal', 'vision', 'audio', 'safety', 'alignment'
    ];
    
    const text = `${paper.title} ${paper.content}`.toLowerCase();
    const matches = relevantKeywords.filter(keyword => text.includes(keyword));
    
    return Math.min(matches.length / relevantKeywords.length * 2, 1);
  }
  
  /**
   * Get trending AI topics from recent papers
   * @param {number} days - Days to look back
   * @returns {Array} Trending topics
   */
  async getTrendingTopics(days = 7) {
    try {
      const papers = await this.getLatestPapers({ maxResults: 100 });
      
      // Filter papers from last N days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentPapers = papers.filter(paper => 
        new Date(paper.publishedAt) > cutoffDate
      );
      
      // Extract and count keywords
      const topicCounts = {};
      const extractKeywords = (text) => {
        const keywords = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
        return keywords.filter(word => 
          !['that', 'with', 'this', 'from', 'they', 'have', 'been', 'were', 'when'].includes(word)
        );
      };
      
      recentPapers.forEach(paper => {
        const keywords = extractKeywords(`${paper.title} ${paper.content}`);
        keywords.forEach(keyword => {
          topicCounts[keyword] = (topicCounts[keyword] || 0) + 1;
        });
      });
      
      // Return top trending topics
      return Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([topic, count]) => ({ topic, count, papers: recentPapers.length }));
        
    } catch (error) {
      this.logger.error(`Failed to get trending topics: ${error.message}`);
      return [];
    }
  }
}

module.exports = { ArxivDataSource };