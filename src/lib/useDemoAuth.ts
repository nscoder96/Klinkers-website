'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useDemoAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('demo_token');

    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push('/demo/login');
      return;
    }

    try {
      const response = await fetch('/api/demo/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('demo_token');
        setIsAuthenticated(false);
        router.push('/demo/login');
      }
    } catch (error) {
      console.error('Demo auth check error:', error);
      setIsAuthenticated(false);
      router.push('/demo/login');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('demo_token');
    try {
      await fetch('/api/demo/auth', { method: 'DELETE' });
    } catch (e) {
      console.error('Demo logout error:', e);
    }
    setIsAuthenticated(false);
    router.push('/demo/login');
  };

  return { isAuthenticated, isLoading, logout };
}
