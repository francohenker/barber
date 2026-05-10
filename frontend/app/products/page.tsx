'use client';

import { useState, useEffect } from 'react';
import { api, Product } from '@/lib/api';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProducts()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="relative pt-12 pb-8 px-6 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        <h1 className="text-4xl font-black mb-4 tracking-tight" style={{ color: 'var(--color-text)' }}>
          Nuestros <span style={{ color: 'var(--color-primary)' }}>Productos</span>
        </h1>
        <p className="max-w-md mx-auto text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Descubre nuestra selección exclusiva de productos premium para el cuidado personal. 
          Consúltanos en tu próxima visita.
        </p>
      </div>

      <main className="max-w-6xl mx-auto px-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl h-[400px] bg-surface" style={{ background: 'var(--color-surface)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div 
                key={product.id}
                className="group relative flex flex-col rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                {/* Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={`${API_BASE}/${product.imageUrl}`} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-2 text-6xl">📦</div>
                  )}
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  
                  {/* Price Tag */}
                  <div className="absolute top-5 right-5 px-4 py-2 rounded-2xl font-black text-lg shadow-2xl backdrop-blur-md"
                       style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
                    ${product.price}
                  </div>
                </div>

                {/* Info */}
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-3 transition-colors group-hover:text-primary" style={{ color: 'var(--color-text)' }}>
                    {product.name}
                  </h3>
                  <p className="text-sm line-clamp-3 mb-6 flex-1" style={{ color: 'var(--color-text-muted)' }}>
                    {product.description}
                  </p>
                  
                  <div className="pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                      Disponible para venta física
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Consulta disponibilidad en el local
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="py-32 text-center">
            <div className="text-6xl mb-6">✨</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Próximamente más productos</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Estamos renovando nuestro stock. ¡Vuelve pronto!</p>
            <Link 
              href="/"
              className="inline-block mt-8 px-8 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
              style={{ background: 'var(--color-primary)', color: '#ffffff' }}>
              Volver al inicio
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
