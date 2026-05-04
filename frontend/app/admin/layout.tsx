'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/admin', label: '📊 Dashboard', exact: true },
  { href: '/admin/appointments', label: '📅 Turnos' },
  { href: '/admin/promotions', label: '🏷️ Promociones' },
  { href: '/admin/services', label: '✂️ Servicios' },
  { href: '/admin/schedule', label: '🕐 Horarios' },
  { href: '/admin/clients', label: '👥 Clientes' },
  { href: '/admin/whatsapp', label: '💬 WhatsApp' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, handleOAuthToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const oauthHandled = useRef(false);

  // Handle OAuth token from URL (uses window directly to avoid useSearchParams prerender issue)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token && !oauthHandled.current) {
      oauthHandled.current = true;
      handleOAuthToken(token)
        .catch(() => {
          router.replace('/login');
        })
        .finally(() => {
          window.history.replaceState({}, '', pathname);
        });
    }
  }, [handleOAuthToken, router, pathname]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasTokenInUrl = !!params.get('token');
    if (!isLoading && !user && !hasTokenInUrl) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-2xl animate-pulse" style={{ color: 'var(--color-primary)' }}>✂️</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
        style={{
          background: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="Logo" className="w-6 h-6" />
          <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Admin Panel</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-full"
            style={{ background: 'rgba(188, 25, 235, 0.15)', color: 'var(--color-primary)' }}>
            {user.role}
          </span>
          <button onClick={() => logout().then(() => router.replace('/login'))}
            className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Salir
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {children}
      </div>

      {/* Bottom navigation (mobile) */}
      <nav
        className="fixed bottom-0 left-0 right-0 grid z-10"
        style={{
          gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
          background: 'rgba(10,10,10,0.97)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center py-3 gap-0.5 text-[10px] font-medium transition-all"
              style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
            >
              <span className="text-lg leading-none">{item.label.split(' ')[0]}</span>
              <span>{item.label.split(' ').slice(1).join(' ')}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
