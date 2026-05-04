'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const mainNavItems = [
  { href: '/admin', label: '📊 Dashboard', exact: true },
  { href: '/admin/appointments', label: '📅 Turnos' },
  { href: '/admin/barbers', label: '💈 Barberos' },
  { href: '/admin/whatsapp', label: '💬 WhatsApp' },
];

const moreNavItems = [
  { href: '/admin/promotions', label: '🏷️ Promociones' },
  { href: '/admin/services', label: '✂️ Servicios' },
  { href: '/admin/schedule', label: '🕐 Horarios' },
  { href: '/admin/clients', label: '👥 Clientes' },
  { href: '/admin/users', label: '👤 Usuarios' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, handleOAuthToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const oauthHandled = useRef(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

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
    if (!isLoading) {
      if (!user && !hasTokenInUrl) {
        router.replace('/login');
      } else if (user && user.role !== 'ADMIN') {
        router.replace('/');
      }
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


      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 relative">
        {children}
        
        {/* Backdrop for dropdown menu */}
        {isMoreMenuOpen && (
          <div 
            className="absolute inset-0 z-20 bg-black/20"
            onClick={() => setIsMoreMenuOpen(false)}
          />
        )}
      </div>

      {/* Bottom navigation (mobile) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: 'rgba(10,10,10,0.97)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div className="grid relative" style={{ gridTemplateColumns: `repeat(${mainNavItems.length + 1}, 1fr)` }}>
          {mainNavItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex flex-col items-center justify-center py-3 gap-0.5 text-[10px] font-medium transition-all"
                style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
              >
                <span className="text-lg leading-none">{item.label.split(' ')[0]}</span>
                <span>{item.label.split(' ').slice(1).join(' ')}</span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="flex flex-col items-center justify-center py-3 gap-0.5 text-[10px] font-medium transition-all"
            style={{ color: isMoreMenuOpen || moreNavItems.some(i => pathname.startsWith(i.href)) ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <span className="text-lg leading-none">⚙️</span>
            <span>Más</span>
          </button>
        </div>

        {/* More Menu Dropdown */}
        {isMoreMenuOpen && (
          <div className="absolute bottom-[calc(100%+8px)] right-2 w-48 p-2 rounded-xl flex flex-col gap-1 shadow-xl border animate-in fade-in slide-in-from-bottom-2"
               style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            {moreNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
                  style={{ 
                    background: isActive ? 'rgba(188, 25, 235, 0.1)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                  }}
                >
                  <span className="text-lg">{item.label.split(' ')[0]}</span>
                  <span>{item.label.split(' ').slice(1).join(' ')}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </div>
  );
}
