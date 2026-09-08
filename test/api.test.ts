import { describe, it, expect, beforeEach } from 'vitest';
import { setToken, getToken, clearToken } from '../lib/api';
import { authService } from '../lib/authService';
import { isDirectGroup, getMemberCount } from '../lib/firebaseApi';

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

  it('correctly identifies direct 1-on-1 ledgers vs group ledgers', () => {
    expect(isDirectGroup({ icon: 'user' })).toBe(true);
    expect(isDirectGroup({ groupType: 'direct' })).toBe(true);
    expect(isDirectGroup({ group_type: 'khatabook' })).toBe(true);
    expect(isDirectGroup({ is_direct: true })).toBe(true);
    expect(isDirectGroup({ isDirect: true })).toBe(true);
    expect(isDirectGroup({ emoji: '👤' })).toBe(true);

    expect(isDirectGroup({ icon: 'trip', groupType: 'other' })).toBe(false);
    expect(isDirectGroup({ name: 'Bday Party', icon: 'food' })).toBe(false);
  });

  it('correctly counts group members from object or memberIds array', () => {
    expect(getMemberCount({ memberIds: ['u1', 'u2', 'u3'] })).toBe(3);
    expect(getMemberCount({ members: { u1: {}, u2: {}, u3: {} } })).toBe(3);
    expect(getMemberCount({ memberIds: [], members: { u1: {}, u2: {} } })).toBe(2);
    expect(getMemberCount({})).toBe(1);
  });
});
