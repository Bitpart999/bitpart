# Replit.md

## Overview

This is a Node.js Express API server that provides AI-powered functionality through OpenAI integration. The application serves as a backend service with CORS support, rate limiting, and request logging capabilities. It's designed to be a simple, lightweight API server that can handle AI-related requests.

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

### 1. Express Server (server.js)
- Main application entry point
- Configures middleware stack
- Handles HTTP request/response lifecycle
- Implements custom rate limiting logic

### 2. OpenAI Integration
- **Client**: OpenAI SDK v5.9.0 for AI functionality
- **Authentication**: API key-based authentication via environment variables
- **Purpose**: Provides AI-powered features through OpenAI's API

### 3. Middleware Components
- **CORS**: Cross-origin resource sharing for frontend communication
- **Body Parser**: JSON parsing with 10MB limit for file uploads
- **Rate Limiting**: Custom in-memory implementation (60 requests/minute per IP)
- **Request Logging**: Timestamped request logging for debugging

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