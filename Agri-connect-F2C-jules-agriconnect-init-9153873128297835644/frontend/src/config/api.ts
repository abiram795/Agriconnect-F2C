const ENV_API_URL = import.meta.env.VITE_API_BASE_URL || 'https://agriconnect-f2c.onrender.com';

export const API_BASE_URL = (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
) ? '' : ENV_API_URL.replace(/\/$/, '');

export function getApiUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
