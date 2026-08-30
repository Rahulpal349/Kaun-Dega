import api, { setToken, clearToken, getToken } from './api';
import { User, AuthResponse } from './types';

export const authService = {
    login: async (email: string, password: string):Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', { email, password });
        if (response.data.token) {
            setToken(response.data.token);
        }
        return response.data;
    },

    register: async (email: string, password: string, name: string, phone?: string):Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', { email, password, name, phone });
        if (response.data.token) {
            setToken(response.data.token);
        }
        return response.data;
    },

    logout: () => {
        clearToken();
    },

    getCurrentUser: async ():Promise<User> => {
        const response = await api.get<User>('/auth/me');
        return response.data;
    },

    isAuthenticated: (): boolean => {
        return !!getToken();
    }
};
