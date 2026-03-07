import { describe, expect, it, vi } from 'vitest';
import { getCitizens, login } from './api';

describe('services/api', () => {
  it('login (positive): calls the API and returns parsed JSON', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ idNumber: '123', role: 'driver' }),
    });

    await expect(login('123', 'secret')).resolves.toEqual({ idNumber: '123', role: 'driver' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:5000/api/citizens/login', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ idNumber: '123', password: 'secret' }),
    });

    fetchSpy.mockRestore();
  });

  it('login (negative): throws API error message when response is not ok', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    await expect(login('123', 'wrong')).rejects.toThrow('Invalid credentials');
    fetchSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('getCitizens (positive): includes role filter in querystring when provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    await getCitizens('driver');
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:5000/api/citizens?role=driver', expect.any(Object));
    fetchSpy.mockRestore();
  });
});
