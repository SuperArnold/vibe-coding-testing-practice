import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { MemoryRouter } from 'react-router-dom';
import { productApi } from '../api/productApi';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

let mockAuthContext = {
    user: { role: 'user', username: 'TestUser' },
    logout: mockLogout,
};

vi.mock('../context/AuthContext', () => ({
    useAuth: () => mockAuthContext,
}));

vi.mock('../api/productApi', () => ({
    productApi: {
        getProducts: vi.fn(),
    }
}));

describe('DashboardPage 測試', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuthContext = {
            user: { role: 'user', username: 'TestUser' },
            logout: mockLogout,
        };
        // Mock default successful API response
        (productApi.getProducts as any).mockResolvedValue([]);
    });

    const renderDashboardPage = () => render(
        <MemoryRouter>
            <DashboardPage />
        </MemoryRouter>
    );

    describe('前端元素', () => {
        it('渲染儀表板基本元素', async () => {
            renderDashboardPage();
            
            expect(screen.getByRole('heading', { name: /^儀表板$/i })).toBeInTheDocument();
            expect(screen.getByText(/Welcome, TestUser 👋/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /登出/i })).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: /商品列表/i })).toBeInTheDocument();
        });

        it('商品載入中狀態 (Loading)', async () => {
            // Mock a promise that doesn't resolve immediately
            let resolveApi: any;
            (productApi.getProducts as any).mockReturnValue(new Promise(resolve => {
                resolveApi = resolve;
            }));
            
            renderDashboardPage();
            
            expect(screen.getByText('載入商品中...')).toBeInTheDocument();
            
            // Clean up promise
            resolveApi([]);
        });

        it('根據角色顯示管理後台連結：Admin', async () => {
            mockAuthContext.user = { role: 'admin', username: 'AdminUser' };
            renderDashboardPage();
            
            const adminLink = screen.getByRole('link', { name: /管理後台/i });
            expect(adminLink).toBeInTheDocument();
            expect(adminLink).toHaveAttribute('href', '/admin');
        });

        it('根據角色隱藏管理後台連結：非 Admin', () => {
            mockAuthContext.user = { role: 'user', username: 'TestUser' };
            renderDashboardPage();
            
            // Should not find the link
            const adminLink = screen.queryByRole('link', { name: /管理後台/i });
            expect(adminLink).not.toBeInTheDocument();
        });
    });

    describe('function 邏輯', () => {
        it('點擊登出按鈕', async () => {
            const user = userEvent.setup();
            renderDashboardPage();
            
            const logoutButton = screen.getByRole('button', { name: /登出/i });
            await user.click(logoutButton);
            
            expect(mockLogout).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });

    describe('Mock API', () => {
        it('成功取得商品列表', async () => {
            const mockProducts = [
                { id: '1', name: '測試商品一', description: '這是第一個商品', price: 1000 },
                { id: '2', name: '測試商品二', description: '這是第二個商品', price: 2500 }
            ];
            (productApi.getProducts as any).mockResolvedValue(mockProducts);
            
            renderDashboardPage();
            
            // Wait for products to load and be displayed
            await waitFor(() => {
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            });
            
            expect(screen.getByText('測試商品一')).toBeInTheDocument();
            expect(screen.getByText('測試商品二')).toBeInTheDocument();
            expect(screen.getByText('NT$ 1,000')).toBeInTheDocument();
            expect(screen.getByText('NT$ 2,500')).toBeInTheDocument();
        });

        it('取得商品列表失敗 (非 401)', async () => {
            (productApi.getProducts as any).mockRejectedValue({
                response: {
                    status: 500,
                    data: { message: '系統錯誤' }
                }
            });
            
            renderDashboardPage();
            
            await waitFor(() => {
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
                expect(screen.getByText('系統錯誤')).toBeInTheDocument();
            });
        });
    });
});
