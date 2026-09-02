import { config } from './env.config';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'InstaVibe Backend Architecture API',
    version: '1.0.0',
    description: `Scalable Enterprise-grade RESTful API specification for InstaVibe.
    
### Architectural Highlights:
- **Modular Layering**: Controllers -> Services -> Repositories -> Database Pool with Transactions
- **Security**: JWT Authentication (Access + Refresh tokens), sliding-window Rate Limiting
- **Resilience**: Redis & In-Memory caching, Async background job queues with exponential backoff
- **Observability**: Structured JSON logging, Request Correlation IDs (\`x-request-id\`), Performance metrics
- **Validation**: Strict schema validation powered by Zod`,
    contact: {
      name: 'InstaVibe Engineering Team',
      url: config.app.clientUrl,
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API Version 1 (Current Primary)',
    },
    {
      url: '/api',
      description: 'Backward-compatible alias',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication, registration, sessions, and tokens' },
    { name: 'Users', description: 'User profiles, social graph, following/followers, and discovery' },
    { name: 'Posts', description: 'Feed generation, post creation, multi-media uploads, likes, and comments' },
    { name: 'Stories', description: '24-hour ephemeral stories, view tracking, highlights, and archives' },
    { name: 'Reels', description: 'Short-form high-bitrate video engine, watch history, and interactions' },
    { name: 'Messages', description: 'Direct messaging and real-time chat threads' },
    { name: 'Notifications', description: 'Social activity alerts, batch mark read, and simulations' },
    { name: 'AI & Gemini', description: 'Generative AI captioning, smart comment suggestions, and search' },
    { name: 'System', description: 'Health probes, queue metrics, and cache statistics' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'System and database health check',
        responses: {
          '200': {
            description: 'System healthy',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'name', 'email', 'password'],
                properties: {
                  username: { type: 'string', example: 'alex_visuals' },
                  name: { type: 'string', example: 'Alex Morgan' },
                  email: { type: 'string', example: 'alex@example.com' },
                  password: { type: 'string', example: 'Secr3tP@ssword' },
                  avatar: { type: 'string' },
                  bio: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User registered and tokens issued' },
          '409': { description: 'Username or email already exists' },
        },
      },
    },
    '/auth/signin': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate with username/email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['login', 'password'],
                properties: {
                  login: { type: 'string', example: 'alex_visuals' },
                  password: { type: 'string', example: 'Secr3tP@ssword' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authentication successful' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/posts': {
      get: {
        tags: ['Posts'],
        summary: 'Retrieve paginated feed posts with like and comment aggregations',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'currentUserId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'List of posts' } },
      },
      post: {
        tags: ['Posts'],
        summary: 'Create a new media post',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'media'],
                properties: {
                  userId: { type: 'string' },
                  caption: { type: 'string' },
                  location: { type: 'string' },
                  media: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        url: { type: 'string' },
                        type: { type: 'string', enum: ['image', 'video'] },
                        aspectRatio: { type: 'string' },
                      },
                    },
                  },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Post created' } },
      },
    },
    '/reels': {
      get: {
        tags: ['Reels'],
        summary: 'Retrieve video reels by category',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['for_you', 'following', 'trending', 'saved'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'List of reels' } },
      },
    },
    '/gemini/generate-caption': {
      post: {
        tags: ['AI & Gemini'],
        summary: 'Generate viral AI caption with tags and tone selection',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  topic: { type: 'string', example: 'Sunset over Tokyo skyline' },
                  tone: { type: 'string', enum: ['aesthetic', 'witty', 'travel', 'minimalist'] },
                  keywords: { type: 'string', example: 'golden hour, rooftop, fujifilm' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Generated caption and source model' } },
      },
    },
  },
};
