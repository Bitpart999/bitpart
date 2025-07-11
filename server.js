const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rate limiting store (simple in-memory implementation)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

// Rate limiting middleware
const rateLimit = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitStore.has(clientIp)) {
    rateLimitStore.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = rateLimitStore.get(clientIp);
  
  if (now > clientData.resetTime) {
    // Reset the counter
    rateLimitStore.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
};

// Validation middleware for compile endpoint
const validateCompileRequest = (req, res, next) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Prompt is required in request body'
    });
  }
  
  if (typeof prompt !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Prompt must be a string'
    });
  }
  
  if (prompt.trim().length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Prompt cannot be empty'
    });
  }
  
  if (prompt.length > 50000) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Prompt too long. Maximum length is 50,000 characters'
    });
  }
  
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Main compile endpoint
app.post('/api/compile', rateLimit, validateCompileRequest, async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }
    
    console.log(`Processing code generation request - Prompt length: ${prompt.length}`);
    
    // Prepare the system message for code generation
    const systemMessage = `You are a skilled software engineer that generates complete, working code based on user requirements. 
    
    Guidelines:
    - Generate complete, functional code that can be executed immediately
    - Include proper error handling and validation
    - Follow best practices for the requested technology stack
    - Provide clear, well-commented code
    - Ensure security best practices are followed
    - Return the response in JSON format with the following structure:
    {
      "code": "generated code here",
      "language": "programming language",
      "explanation": "brief explanation of the code",
      "dependencies": ["list of required dependencies"],
      "instructions": "setup and run instructions"
    }`;
    
    // Prepare OpenAI request
    const openaiRequest = {
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
      response_format: { type: "json_object" }
    };
    
    // Make request to OpenAI
    const startTime = Date.now();
    const response = await openai.chat.completions.create(openaiRequest);
    const endTime = Date.now();
    
    // Log the response time
    console.log(`OpenAI API response time: ${endTime - startTime}ms`);
    
    // Parse the response
    const result = response.choices[0].message.content;
    let parsedResult;
    
    try {
      parsedResult = JSON.parse(result);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // If JSON parsing fails, return the raw content
      parsedResult = {
        code: result,
        language: "unknown",
        explanation: "Generated code (JSON parsing failed)",
        dependencies: [],
        instructions: "Run the generated code according to the language requirements"
      };
    }
    
    // Return formatted response
    res.json({
      success: true,
      data: parsedResult,
      meta: {
        model: response.model,
        usage: response.usage,
        responseTime: endTime - startTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in /api/compile:', error);
    
    // Handle different types of errors
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({
        error: 'Quota Exceeded',
        message: 'OpenAI API quota exceeded. Please check your billing details.'
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Invalid OpenAI API key. Please check your configuration.'
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: 'OpenAI API rate limit exceeded. Please try again later.'
      });
    }
    
    if (error.code === 'context_length_exceeded') {
      return res.status(400).json({
        error: 'Content Too Long',
        message: 'The prompt is too long for the model to process. Please shorten your request.'
      });
    }
    
    // Generic error handling
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing your request. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`OpenAI API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
  console.log(`Compile endpoint available at: http://localhost:${PORT}/api/compile`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});
