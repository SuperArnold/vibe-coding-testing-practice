import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '../api/authApi';
import { TOKEN_KEY } from '../api/axiosInstance';
import React from 'react';

// Mock authApi
vi.mock('../api/authApi', () => ({
    authApi: {
        login: vi.fn(),
        getMe: vi.fn(),
    },
}));

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

    describe('Hooks 邏輯', () => {
        it('useAuth 必須在 AuthProvider 內使用', () => {
            // Suppress console.error as React throws an error boundary warning
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
            consoleSpy.mockRestore();
        });

        it('useAuth 在 AuthProvider 內可正常取得 Context 值', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper });

            expect(result.current.user).toBeNull();
            expect(result.current.token).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
            expect(typeof result.current.login).toBe('function');
            expect(typeof result.current.logout).toBe('function');
            expect(typeof result.current.checkAuth).toBe('function');
            expect(typeof result.current.clearAuthExpiredMessage).toBe('function');
            expect(result.current.authExpiredMessage).toBeNull();
            
            // Wait for initial checkAuth to finish handling to avoid act warnings
            await act(async () => {
                await Promise.resolve();
            });
        });
    });

    describe('初始狀態', () => {
        it('未登入時的初始狀態', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper });

            // checkAuth will finish and set isLoading to false
            await act(async () => {
                await Promise.resolve();
            });

            expect(result.current.user).toBeNull();
            expect(result.current.token).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('Mock API', () => {
        it('login 登入成功', async () => {
            const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', role: 'user' };
            const mockToken = 'mock-token';
            (authApi.login as any).mockResolvedValueOnce({ user: mockUser, accessToken: mockToken });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test@example.com', 'password123');
            });

            expect(localStorage.getItem(TOKEN_KEY)).toBe(mockToken);
            expect(result.current.token).toBe(mockToken);
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
        });

        it('login 登入失敗', async () => {
            const mockError = new Error('Login failed');
            (authApi.login as any).mockRejectedValueOnce(mockError);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await expect(result.current.login('test@example.com', 'wrongpassword')).rejects.toThrow('Login failed');
            });

            expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('checkAuth 驗證有效 Token 成功', async () => {
            const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', role: 'user' };
            const storedToken = 'valid-token';
            localStorage.setItem(TOKEN_KEY, storedToken);
            (authApi.getMe as any).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useAuth(), { wrapper });

            let isValid;
            await act(async () => {
                isValid = await result.current.checkAuth();
            });

            expect(isValid).toBe(true);
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.token).toBe(storedToken);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.isAuthenticated).toBe(true);
        });

        it('checkAuth 驗證無效 Token 失敗', async () => {
            const storedToken = 'invalid-token';
            localStorage.setItem(TOKEN_KEY, storedToken);
            (authApi.getMe as any).mockRejectedValue(new Error('Unauthorized'));

            const { result } = renderHook(() => useAuth(), { wrapper });

            let isValid;
            await act(async () => {
                isValid = await result.current.checkAuth();
            });

            expect(isValid).toBe(false);
            expect(result.current.user).toBeNull();
            expect(result.current.token).toBeNull();
            expect(result.current.isLoading).toBe(false);
            expect(result.current.isAuthenticated).toBe(false);
            expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
        });
    });

    describe('function 邏輯', () => {
        it('logout 登出成功', async () => {
            const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', role: 'user' };
            const mockToken = 'mock-token';
            (authApi.login as any).mockResolvedValueOnce({ user: mockUser, accessToken: mockToken });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test@example.com', 'password123');
            });

            expect(result.current.isAuthenticated).toBe(true);
            expect(localStorage.getItem(TOKEN_KEY)).toBe(mockToken);

            act(() => {
                result.current.logout();
            });

            expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
            expect(result.current.token).toBeNull();
            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('clearAuthExpiredMessage 清除過期訊息', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper });

            act(() => {
                window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: '登入已過期' }));
            });

            expect(result.current.authExpiredMessage).toBe('登入已過期');

            act(() => {
                result.current.clearAuthExpiredMessage();
            });

            expect(result.current.authExpiredMessage).toBeNull();
        });
    });

    describe('Event 監聽', () => {
        it('接收到 auth:unauthorized 事件', async () => {
            const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', role: 'user' };
            const mockToken = 'mock-token';
            (authApi.login as any).mockResolvedValueOnce({ user: mockUser, accessToken: mockToken });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('test@example.com', 'password123');
            });

            expect(result.current.isAuthenticated).toBe(true);

            act(() => {
                window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: '登入已過期' }));
            });

            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.authExpiredMessage).toBe('登入已過期');
            expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
        });
    });
});
