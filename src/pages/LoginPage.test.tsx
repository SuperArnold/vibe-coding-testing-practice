import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockClearAuthExpiredMessage = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Default auth context values
let mockAuthContext = {
    login: mockLogin,
    isAuthenticated: false,
    authExpiredMessage: '',
    clearAuthExpiredMessage: mockClearAuthExpiredMessage,
};

vi.mock('../context/AuthContext', () => ({
    useAuth: () => mockAuthContext,
}));

describe('LoginPage 測試', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuthContext = {
            login: mockLogin,
            isAuthenticated: false,
            authExpiredMessage: '',
            clearAuthExpiredMessage: mockClearAuthExpiredMessage,
        };
    });

    const renderLoginPage = () => render(
        <MemoryRouter>
            <LoginPage />
        </MemoryRouter>
    );

    describe('前端元素', () => {
        it('渲染登入頁面基本元素', () => {
            renderLoginPage();
            expect(screen.getByRole('heading', { name: /歡迎回來/i })).toBeInTheDocument();
            expect(screen.getByLabelText(/電子郵件/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/密碼/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /登入/i })).toBeInTheDocument();
        });
    });

    describe('function 邏輯', () => {
        it('Email 格式驗證：為空字串', async () => {
            const user = userEvent.setup();
            renderLoginPage();

            const loginButton = screen.getByRole('button', { name: /登入/i });
            await user.click(loginButton);

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('Email 格式驗證：無效格式', async () => {
            const user = userEvent.setup();
            renderLoginPage();

            const emailInput = screen.getByLabelText(/電子郵件/i);
            await user.type(emailInput, 'invalid-email');

            const loginButton = screen.getByRole('button', { name: /登入/i });
            await user.click(loginButton);

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('密碼格式驗證：長度不足 8 碼', async () => {
            const user = userEvent.setup();
            renderLoginPage();

            const emailInput = screen.getByLabelText(/電子郵件/i);
            await user.type(emailInput, 'test@example.com');

            const passwordInput = screen.getByLabelText(/密碼/i);
            await user.type(passwordInput, '1234567');

            const loginButton = screen.getByRole('button', { name: /登入/i });
            await user.click(loginButton);

            expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('密碼格式驗證：未包含英文字母和數字', async () => {
            const user = userEvent.setup();
            renderLoginPage();

            const emailInput = screen.getByLabelText(/電子郵件/i);
            await user.type(emailInput, 'test@example.com');

            const passwordInput = screen.getByLabelText(/密碼/i);
            await user.type(passwordInput, '12345678'); // only numbers

            const loginButton = screen.getByRole('button', { name: /登入/i });
            await user.click(loginButton);

            expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();

            // test only letters scenario
            await user.clear(passwordInput);
            await user.type(passwordInput, 'abcdefgh'); // only letters
            await user.click(loginButton);

            expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });
    });

    describe('Mock API', () => {
        it('登入成功：導向 dashboard', async () => {
            const user = userEvent.setup();
            mockLogin.mockResolvedValueOnce(undefined);

            renderLoginPage();

            const emailInput = screen.getByLabelText(/電子郵件/i);
            await user.type(emailInput, 'test@example.com');

            const passwordInput = screen.getByLabelText(/密碼/i);
            await user.type(passwordInput, 'password123');

            const loginButton = screen.getByRole('button', { name: /登入/i });
            await user.click(loginButton);

            // Using waitFor to wait for the async login to finish and navigate to be called
            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
            });
        });

        it('登入失敗：顯示錯誤訊息', async () => {
            const user = userEvent.setup();
            // Mocking axios error structure handled in catch block
            mockLogin.mockRejectedValueOnce({
                response: {
                    data: {
                        message: '密碼錯誤'
                    }
                }
            });

            renderLoginPage();

            const emailInput = screen.getByLabelText(/電子郵件/i);
            await user.type(emailInput, 'test@example.com');

            const passwordInput = screen.getByLabelText(/密碼/i);
            await user.type(passwordInput, 'wrongpassword123');

            const loginButton = screen.getByRole('button', { name: /登入/i });
            await user.click(loginButton);

            await waitFor(() => {
                expect(screen.getByText('密碼錯誤')).toBeInTheDocument();
                // Check if it's within the banner based on role or classes
                expect(screen.getByRole('alert')).toHaveTextContent(/密碼錯誤/);
            });
        });
    });

    describe('驗證權限', () => {
        it('已登入狀態：自動導向 dashboard', async () => {
            mockAuthContext.isAuthenticated = true;

            renderLoginPage();

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
            });
        });

        it('登入過期：顯示過期訊息', async () => {
            mockAuthContext.authExpiredMessage = '登入已過期，請重新登入';

            renderLoginPage();

            await waitFor(() => {
                expect(screen.getByText('登入已過期，請重新登入')).toBeInTheDocument();
                expect(mockClearAuthExpiredMessage).toHaveBeenCalled();
            });
        });
    });
});
