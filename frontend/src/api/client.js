import axios from 'axios';

const TOKEN_KEY = 'accessToken';

export const tokenStorage = {
  get: () => (typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null),
  set: (token) => typeof localStorage !== 'undefined' && localStorage.setItem(TOKEN_KEY, token),
  clear: () => typeof localStorage !== 'undefined' && localStorage.removeItem(TOKEN_KEY),
};

const envBaseUrl = import.meta.env?.VITE_API_BASE_URL;
const resolvedBaseUrl =
  envBaseUrl !== undefined ? (envBaseUrl === '/' ? '' : envBaseUrl) : 'http://localhost:8080';

const client = axios.create({
  baseURL: resolvedBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT to every request when the user is logged in
client.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AuthContext registers what to do when the backend rejects the token (expired, revoked, user blocked)
let unauthorizedHandler = null;
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.startsWith('/api/auth/');
    // A 401 from /api/auth/login just means wrong credentials; anywhere else the session is over
    if (error.response?.status === 401 && !isAuthEndpoint && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

export default client;
