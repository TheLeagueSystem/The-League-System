const configs = {
  development: {
    baseURL: 'http://localhost:8000',
  },
  production: {
    baseURL: process.env.REACT_APP_API_URL || 'https://league-system-backend.onrender.com',
  },
};

const environment = process.env.NODE_ENV || 'development';
export const apiConfig = configs[environment as keyof typeof configs];