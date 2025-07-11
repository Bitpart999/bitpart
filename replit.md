# Replit.md

## Overview

This is a full-stack code generation application that uses OpenAI's GPT-4o model to generate code from natural language descriptions. The application consists of a Node.js Express backend API server and a clean, modern frontend interface. Users can input natural language prompts and receive complete, functional code with explanations and setup instructions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Express.js (v5.1.0) - Modern Node.js web framework
- **Runtime**: Node.js server-side JavaScript
- **API Design**: RESTful API structure with JSON communication
- **Middleware Stack**: CORS, body parsing, custom rate limiting, and request logging

### Key Design Decisions
- **Express v5**: Chosen for its stability and extensive ecosystem
- **Custom Rate Limiting**: Implemented in-memory rate limiting instead of external services for simplicity
- **Environment-based Configuration**: Uses dotenv for flexible deployment across environments

## Key Components

### 1. Backend Server (server.js)
- **Express Server**: Main application entry point with middleware stack
- **API Endpoint**: `/api/compile` - Accepts natural language prompts and returns generated code
- **OpenAI Integration**: Uses GPT-4o model for code generation with structured JSON responses
- **Static File Serving**: Serves frontend files from `public/` directory
- **Rate Limiting**: Custom in-memory implementation (60 requests/minute per IP)
- **Error Handling**: Comprehensive error responses for API failures

### 2. Frontend Interface (public/)
- **index.html**: Clean, responsive web interface for code generation
- **script.js**: JavaScript client that handles API communication and UI interactions
- **style.css**: Modern CSS styling with gradient design and responsive layout
- **Features**: Real-time code generation, syntax highlighting, copy functionality, error handling

### 3. OpenAI Integration
- **Model**: GPT-4o (latest model) for high-quality code generation
- **Response Format**: Structured JSON with code, explanation, dependencies, and instructions
- **Temperature**: 0.7 for balanced creativity and accuracy
- **Authentication**: API key-based authentication via environment variables

## Data Flow

1. **Incoming Request**: Client sends HTTP request to Express server
2. **CORS Check**: Server validates origin and allowed methods
3. **Rate Limiting**: Checks IP-based request limits
4. **Body Parsing**: Parses JSON request body (up to 10MB)
5. **Request Logging**: Logs request details with timestamp
6. **Route Handling**: Processes request through defined endpoints
7. **OpenAI Integration**: Makes API calls to OpenAI when needed
8. **Response**: Returns JSON response to client

## External Dependencies

### Core Dependencies
- **express**: Web framework for Node.js
- **cors**: Cross-origin resource sharing middleware
- **dotenv**: Environment variable management
- **openai**: Official OpenAI SDK for API integration

### Configuration Requirements
- `OPENAI_API_KEY`: Required for OpenAI API access
- `PORT`: Server port (defaults to 8000)
- `FRONTEND_URL`: CORS origin configuration (defaults to '*')

## Deployment Strategy

### Environment Configuration
- Uses environment variables for sensitive data (API keys)
- Flexible port configuration for different deployment environments
- CORS origin can be configured per environment

### Scalability Considerations
- **Rate Limiting**: Currently uses in-memory storage (not suitable for multi-instance deployments)
- **Session Management**: Stateless design for easy horizontal scaling
- **Database**: No persistent storage currently implemented

### Production Readiness
- **Logging**: Basic request logging implemented
- **Error Handling**: Needs enhancement for production use
- **Security**: Rate limiting provides basic DDoS protection
- **Monitoring**: No health checks or metrics currently implemented

## Notes for Development

- The application is in early development stage
- Rate limiting uses in-memory storage and won't persist across restarts
- No database layer is currently implemented
- API endpoints are not fully defined in the current codebase
- Error handling and validation need to be enhanced for production use