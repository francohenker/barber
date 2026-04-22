import Link from 'next/link';
import { api } from '@/lib/api';

async function getActivePromotions() {
  try {
    return await api.getActivePromotions();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const promotions = await getActivePromotions();

  return (
    <main className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[80dvh] px-6 text-center overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,169,110,0.15) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-sm w-full mx-auto">
          {/* Logo / Brand */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-4xl">✂️</span>
            <span
              className="text-2xl font-bold tracking-widest uppercase"
              style={{ color: 'var(--color-primary)' }}
            >
              Barbería
            </span>
          </div>

          <h1
            className="text-4xl font-bold leading-tight mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Tu look,
            <br />
            <span style={{ color: 'var(--color-primary)' }}>tu turno.</span>
          </h1>

          <p className="text-base mb-10" style={{ color: 'var(--color-text-muted)' }}>
            Reservá en segundos, sin llamadas. Elegí el servicio, el día y la hora que más te
            convenga.
          </p>

          <Link
            href="/book"
            className="block w-full py-4 rounded-xl text-center font-semibold text-base transition-all active:scale-95"
            style={{
              background: 'var(--color-primary)',
              color: '#0a0a0a',
            }}
          >
            Reservar turno
          </Link>

          <Link
            href="/promotions"
            className="block w-full py-3 rounded-xl text-center font-medium text-sm mt-3 transition-all"
            style={{
              color: 'var(--color-primary)',
              border: '1px solid var(--color-primary)',
            }}
          >
            Ver promociones
          </Link>
        </div>
      </section>

      {/* Promotions strip */}
      {promotions.length > 0 && (
        <section className="px-6 pb-12">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            🔥 Promociones activas
          </h2>
          <div className="flex flex-col gap-3">
            {promotions.map((promo: any) => (
              <div
                key={promo.id}
                className="p-4 rounded-2xl"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {promo.title}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {promo.description}
                </p>
                {promo.discountPercent && (
                  <span
                    className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--color-primary)' }}
                  >
                    {promo.discountPercent}% OFF
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        className="border-t py-6 px-6 text-center text-sm"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
        }}
      >
        <Link
          href="/admin"
          className="underline underline-offset-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Panel de administración
        </Link>
      </footer>
    </main>
  );
}
