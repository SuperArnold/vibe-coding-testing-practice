import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminPage } from './AdminPage';
import { MemoryRouter } from 'react-router-dom';

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
    user: { role: 'admin' },
    logout: mockLogout,
};

vi.mock('../context/AuthContext', () => ({
    useAuth: () => mockAuthContext,
}));

describe('AdminPage 測試', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuthContext = {
            user: { role: 'admin' },
            logout: mockLogout,
        };
    });

    const renderAdminPage = () => render(
        <MemoryRouter>
            <AdminPage />
        </MemoryRouter>
    );

    describe('前端元素', () => {
        it('渲染管理後台基本元素', () => {
            renderAdminPage();
            expect(screen.getByRole('heading', { name: /管理後台/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /返回/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /登出/i })).toBeInTheDocument();
            expect(screen.getByText('管理員專屬頁面')).toBeInTheDocument();
        });

        it('根據角色顯示 Badge：Admin', () => {
            mockAuthContext.user = { role: 'admin' };
            renderAdminPage();
            
            const badge = screen.getByText('管理員');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('admin');
        });

        it('根據角色顯示 Badge：User', () => {
            mockAuthContext.user = { role: 'user' };
            renderAdminPage();
            
            const badge = screen.getByText('一般用戶');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('user');
        });
    });

    describe('function 邏輯', () => {
        it('點擊返回連結導向 Dashboard', async () => {
            const user = userEvent.setup();
            renderAdminPage();
            
            const backLink = screen.getByRole('link', { name: /返回/i });
            // Since it's a Link from react-router using MemoryRouter, the default action is prevented 
            // by react-router and it updates the history. 
            // For checking routing within tests, we can verify that the Link corresponds to "/dashboard".
            expect(backLink).toHaveAttribute('href', '/dashboard');
        });

        it('點擊登出按鈕', async () => {
            const user = userEvent.setup();
            renderAdminPage();
            
            const logoutButton = screen.getByRole('button', { name: /登出/i });
            await user.click(logoutButton);
            
            expect(mockLogout).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });
});
