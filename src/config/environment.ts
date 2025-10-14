// Environment Configuration
// This file handles different environments (local, production)

interface EnvironmentConfig {
  apiBaseUrl: string;
  appEnv: string;
  appName: string;
  appVersion: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

// Local development configuration
const localConfig: EnvironmentConfig = {
  apiBaseUrl: 'http://localhost:3000/api',
  appEnv: 'development',
  appName: 'Swift Supply Link',
  appVersion: '1.0.0',
  isDevelopment: true,
  isProduction: false,
};

// Production configuration
const productionConfig: EnvironmentConfig = {
  apiBaseUrl: process.env.VITE_API_BASE_URL || 'https://your-backend-domain.vercel.app/api',
  appEnv: 'production',
  appName: 'Swift Supply Link',
  appVersion: '1.0.0',
  isDevelopment: false,
  isProduction: true,
};

// Determine which environment to use
const getEnvironment = (): EnvironmentConfig => {
  // Check if we're in production (Vercel deployment)
  if (import.meta.env.PROD) {
    return productionConfig;
  }
  
  // Check for environment variable override
  if (import.meta.env.VITE_APP_ENV === 'production') {
    return productionConfig;
  }
  
  // Default to local development
  return localConfig;
};

export const environment = getEnvironment();

// Export individual configs for easy access
export const { apiBaseUrl, appEnv, appName, appVersion, isDevelopment, isProduction } = environment;

// Helper functions
export const isLocal = () => environment.isDevelopment;
export const isProd = () => environment.isProduction;

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: environment.apiBaseUrl,
  CUSTOMERS: `${environment.apiBaseUrl}/customers`,
  ORDERS: `${environment.apiBaseUrl}/orders`,
  RIDERS: `${environment.apiBaseUrl}/riders`,
  DASHBOARD: `${environment.apiBaseUrl}/dashboard`,
  PAYMENTS: `${environment.apiBaseUrl}/payments`,
} as const;
