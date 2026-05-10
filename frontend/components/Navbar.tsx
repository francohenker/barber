'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdminPage = pathname?.startsWith('/admin');


  return (
    <nav className="sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300"
      style={{
        backgroundColor: 'rgba(10, 10, 10, 0.7)',
        borderColor: 'var(--color-border)'
      }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border transition-all group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(188,25,235,0.4)]"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-2)' }}>
                <Image
                  src="/favicon.svg"
                  alt="Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-xl font-bold tracking-tight transition-colors group-hover:text-[var(--color-primary)]">
                BARBER<span className="text-[var(--color-primary)]">ÍA</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8 ml-10">
              <Link href="/products" className="text-sm font-medium transition-colors hover:text-[var(--color-primary)]">
                Productos
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            {user ? (
              <>
                <span className="text-xs px-2 py-1 rounded-full hidden sm:block font-medium"
                  style={{ background: 'rgba(188, 25, 235, 0.15)', color: 'var(--color-primary)' }}>
                  {user.role}
                </span>
                {user.role === 'ADMIN' && !isAdminPage && (
                  <Link href="/admin" className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all hover:bg-[var(--color-surface-2)]">
                    Panel
                  </Link>
                )}
                <button onClick={() => logout().then(() => router.replace('/login'))}
                  className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all text-red-400 hover:bg-red-500/10">
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all hover:bg-[var(--color-surface-2)]">
                  Login
                </Link>
                <Link href="/login" className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-[var(--color-primary)] text-xs md:text-sm font-semibold text-white shadow-lg transition-all hover:bg-[var(--color-primary-dark)] active:scale-95">
                  Admin
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
