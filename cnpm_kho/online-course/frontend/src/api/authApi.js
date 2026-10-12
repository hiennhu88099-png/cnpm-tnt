import client from './client';

export const authApi = {
  register: (data) => client.post('/api/auth/register', data).then((res) => res.data),
  login: (data) => client.post('/api/auth/login', data).then((res) => res.data),
};

export const userApi = {
  getMe: () => client.get('/api/users/me').then((res) => res.data),
  updateProfile: (data) => client.put('/api/users/me', data).then((res) => res.data),
  changePassword: (data) => client.put('/api/users/me/password', data),
};
