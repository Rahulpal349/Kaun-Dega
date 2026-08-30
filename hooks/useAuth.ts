import { useState, useEffect } from 'react';
import { User, AuthResponse } from '../lib/types';
import { authService } from '../lib/authService';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                if (authService.isAuthenticated()) {
                    const currentUser = await authService.getCurrentUser();
                    setUser(currentUser);
                }
            } catch (err: any) {
                console.error("Auth init failed", err);
                authService.logout();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const data: AuthResponse = await authService.login(email, password);
            setUser(data.user);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, password: string, name: string, phone?: string): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const data: AuthResponse = await authService.register(email, password, name, phone);
            setUser(data.user);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return { user, loading, error, login, register, logout, isAuthenticated: !!user };
};
