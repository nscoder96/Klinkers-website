'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    console.log('Checking auth, token exists:', !!token);

    if (!token) {
      console.log('No token in localStorage, redirecting to login');
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        credentials: 'include' // Include cookies
      });

      console.log('Auth response status:', response.status);
      const data = await response.json();
      console.log('Auth response data:', data);

      if (response.ok && data.valid) {
        console.log('Auth successful');
        setIsAuthenticated(true);
      } else {
        console.log('Auth failed, clearing token');
        localStorage.removeItem('admin_token');
        setIsAuthenticated(false);
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('admin_token');
    // Also clear server-side cookie
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  return { isAuthenticated, isLoading, logout };
}
