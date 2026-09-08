import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dittopdf Public API',
      version: '1.0.0',
      description: 'Public REST API for Dittopdf Enterprise',
    },
    servers: [
      {
        url: '/api/public',
      },
    ],
  },
  apis: ['./src/app/api/public/*.ts'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);
