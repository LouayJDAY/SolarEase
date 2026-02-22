import axios from 'axios';

// Create an Axios instance with base URL for local development via proxy
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Project API Calls
export const ProjectService = {
  getAllProjects: async () => {
    const response = await api.get('/projects');
    return response.data.map((p: any) => ({ ...p, title: p.name }));
  },
  getProjectById: async (id: number) => {
    const response = await api.get(`/projects/${id}`);
    return { ...response.data, title: response.data.name };
  },
  createProject: async (projectData: any) => {
    const payload = { ...projectData, name: projectData.title };
    const response = await api.post('/projects', payload);
    return { ...response.data, title: response.data.name };
  },
  updateProject: async (id: number, projectData: any) => {
    const payload = { ...projectData, name: projectData.title };
    const response = await api.put(`/projects/${id}`, payload);
    return { ...response.data, title: response.data.name };
  },
  deleteProject: async (id: number) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  }
};

// Client API Calls
export const ClientService = {
  getAllClients: async () => {
    const response = await api.get('/clients');
    return response.data;
  },
  createClient: async (clientData: any) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },
  getClientById: async (id: number) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  }
};

// Dimensioning API Calls
export const DimensioningService = {
  calculate: async (dimensioningData: any) => {
    const response = await api.post('/dimensioning/calculate', dimensioningData);
    return response.data;
  },
  getByProject: async (projectId: number) => {
    const response = await api.get(`/dimensioning/project/${projectId}`);
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/dimensioning/${id}`);
    return response.data;
  }
};

// Auth API Calls
export const AuthService = {
    login: async (credentials: any) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    register: async (userData: any) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    verifyOtp: async (data: any) => {
        const response = await api.post('/auth/verify-otp', data);
        return response.data;
    }
};
