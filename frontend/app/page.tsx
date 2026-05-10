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
    <main className="min-h-dvh" style={{ background: '#000000' }}>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[80dvh] px-6 text-center overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(188, 25, 235, 0.2) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-sm w-full mx-auto">



          <h1
            className="text-4xl font-bold leading-tight mb-4"
            style={{ color: '#ffffff' }}
          >
            Tu look,
            <br />
            <span style={{ color: '#bc19eb' }}>tu turno.</span>
          </h1>

          <p className="text-base mb-10" style={{ color: '#aaaaaa' }}>
            Reserva en segundos, sin llamadas.
            <br />
            Elegi el servicio, el dia y la hora que mas te convenga.
          </p>

          <Link
            href="/book"
            className="block w-full py-4 rounded-xl text-center font-semibold text-base transition-all active:scale-95"
            style={{
              background: '#bc19eb',
              color: '#ffffff',
            }}
          >
            Reservar turno
          </Link>

          <Link
            href="/promotions"
            className="block w-full py-3 rounded-xl text-center font-medium text-sm mt-3 transition-all"
            style={{
              color: '#bc19eb',
              border: '1px solid #bc19eb',
            }}
          >
            Ver promociones
          </Link>

          <Link
            href="/products"
            className="block w-full py-3 rounded-xl text-center font-medium text-sm mt-3 transition-all"
            style={{
              color: '#bc19eb',
              border: '1px solid #bc19eb',
            }}
          >
            Ver productos
          </Link>

        </div>
      </section>

      {/* Promotions strip */}
      {promotions.length > 0 && (
        <section className="px-6 pb-12">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>
            ⭐ Promociones activas
          </h2>
          <div className="flex flex-col gap-3">
            {promotions.map((promo: any) => (
              <div
                key={promo.id}
                className="p-4 rounded-2xl"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333333',
                }}
              >
                <p className="font-semibold" style={{ color: '#bc19eb' }}>
                  {promo.title}
                </p>
                <p className="text-sm mt-1" style={{ color: '#aaaaaa' }}>
                  {promo.description}
                </p>
                {promo.discountPercent && (
                  <span
                    className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: '#bc19eb', color: '#ffffff' }}
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
        className="border-t py-8 px-6 text-center"
        style={{
          borderColor: '#333333',
          color: '#aaaaaa',
        }}
      >

        <div className="flex items-center justify-center gap-2">
          <img
            src="/indoor.svg"
            alt="Interior de la barberia"
            className="w-37 h-15 opacity-80"
          />
        </div>
        {/* <div className="flex flex-col items-center gap-4"> */}
          <Link
            href="/admin"
            className="underline underline-offset-2"
            style={{ color: '#aaaaaa' }}
          >
            Panel de administracion
          </Link>
          {/* <Link
            href="/privacy"
            className="text-xs hover:underline"
            style={{ color: '#555555' }}
          >
            Política de Privacidad
          </Link>
        </div> */}
      </footer>
    </main>
  );
}
