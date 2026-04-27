import { api } from '@/lib/api';

async function getPromotions() {
  try {
    return await api.getActivePromotions();
  } catch {
    return [];
  }
}

export const metadata = {
  title: 'Promociones — Barbería',
  description: 'Descubrí las mejores promociones de nuestra barbería.',
};

export default async function PromotionsPage() {
  const promotions = await getPromotions();

  return (
    <main className="min-h-dvh px-6 py-8" style={{ background: 'var(--color-bg)' }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        🏷️ Promociones
      </h1>

      {promotions.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
        >
          <p className="text-4xl mb-3">🎁</p>
          <p>No hay promociones activas en este momento.</p>
          <p className="text-sm mt-1">¡Volvé pronto!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {promotions.map((promo: any) => (
            <div
              key={promo.id}
              className="p-5 rounded-2xl"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {promo.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={promo.imageUrl}
                  alt={promo.title}
                  className="w-full h-40 object-cover rounded-xl mb-4"
                />
              )}
              <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>
                {promo.title}
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {promo.description}
              </p>
               {promo.discountPercent && (
                <span
                  className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(188, 25, 235, 0.15)', color: 'var(--color-primary)' }}
                >
                  {promo.discountPercent}% OFF
                </span>
              )}
               {promo.discountAmount && (
                <span
                  className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(188, 25, 235, 0.15)', color: 'var(--color-primary)' }}
                >
                  ${promo.discountAmount} de descuento
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
