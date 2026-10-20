// API Configuration for CareMend Application

// Determine the backend URL based on environment
const getBackendUrl = (): string => {
  // Check if VITE_API_URL is explicitly set (environment variable)
  if (import.meta.env.VITE_API_URL) {
    console.log(`[API Config] Using VITE_API_URL: ${import.meta.env.VITE_API_URL}`);
    return import.meta.env.VITE_API_URL;
  }
  
  // In development (via Vite dev server), use localhost
  if (import.meta.env.DEV) {
    console.log('[API Config] Using local development backend URL');
    return 'http://localhost:5000';
  }
  
  // Default to production backend URL
  console.log('[API Config] Using production backend URL');
  return 'https://caremend-1pc6.onrender.com';
};

export const API_CONFIG = {
  // Backend API Base URL
  BASE_URL: getBackendUrl(),
  
  // API Endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout'
    },
    USER: {
      PROFILE: '/user/profile',
      UPDATE: '/user/update'
    },
    ASSESSMENT: {
      SUBMIT: '/assessment/submit',
      HISTORY: '/assessment/history'
    },
    PREDICT: {
      RISK: '/predict/risk'
    },
    NUTRITION: {
      PLAN: '/nutrition/plan',
      RECOMMENDATIONS: '/nutrition/recommendations'
    },
    CARECONNECT: {
      CHAT: '/careconnect/chat'
    }
  },
  
  // Request Configuration
  TIMEOUT: 35000, // 35 seconds (backend timeout is 30s, this gives buffer)
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
};

// API Helper Functions
export class ApiService {
  private static async makeRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const response = await this.makeRequest(API_CONFIG.ENDPOINTS.HEALTH, {
        method: 'GET'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  static async get(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, { ...options, method: 'GET' });
  }

  static async post(endpoint: string, data: any, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async put(endpoint: string, data: any, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async delete(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, { ...options, method: 'DELETE' });
  }
}

export default ApiService;