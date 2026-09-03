import { describe, it, expect, beforeEach } from 'vitest';
import { setToken, getToken, clearToken } from '../lib/api';
import { authService } from '../lib/authService';

describe('API & Token Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores, retrieves, and clears auth tokens in localStorage', () => {
    expect(getToken()).toBeNull();
    setToken('jwt_mock_token_xyz');
    expect(getToken()).toBe('jwt_mock_token_xyz');

    clearToken();
    expect(getToken()).toBeNull();
  });

  it('authService.isAuthenticated returns correct status', () => {
    expect(authService.isAuthenticated()).toBe(false);
    setToken('jwt_mock_token_xyz');
    expect(authService.isAuthenticated()).toBe(true);
    authService.logout();
    expect(authService.isAuthenticated()).toBe(false);
  });
});
