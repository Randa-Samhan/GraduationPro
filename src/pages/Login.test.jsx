import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { login as apiLogin } from '../services/api';
import Login from './Login';

const navigateSpy = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateSpy };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('../components/LanguageSwitcher', () => ({
  default: () => null,
}));

vi.mock('../services/api', () => ({
  login: vi.fn(),
}));

beforeEach(() => {
  navigateSpy.mockReset();
  apiLogin.mockReset();
});

describe('Login (integration)', () => {
  it('positive: logs in and navigates to the role dashboard', async () => {
    const user = userEvent.setup();
    apiLogin.mockResolvedValue({ idNumber: '123', role: 'driver', name: 'Test User' });

    const onLogin = vi.fn();
    render(
      <MemoryRouter>
        <Login onLogin={onLogin} />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('auth.enterIdNumber'), '123');
    await user.type(screen.getByPlaceholderText('auth.enterPassword'), 'secret');
    await user.click(screen.getByRole('button', { name: 'common.login' }));

    await waitFor(() => {
      expect(apiLogin).toHaveBeenCalledWith('123', 'secret');
      expect(onLogin).toHaveBeenCalledWith(
        expect.objectContaining({ idNumber: '123', role: 'driver' }),
        'driver',
      );
      expect(navigateSpy).toHaveBeenCalledWith('/driver/dashboard');
    });
  });

  it('negative: shows an error message when credentials are invalid', async () => {
    const user = userEvent.setup();
    apiLogin.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <Login onLogin={vi.fn()} />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('auth.enterIdNumber'), '123');
    await user.type(screen.getByPlaceholderText('auth.enterPassword'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'common.login' }));

    expect(await screen.findByText('auth.loginError')).toBeInTheDocument();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});

