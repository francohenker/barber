'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function ClientsAdminPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token) return;
    api.getClients(token).then(setClients).finally(() => setLoading(false));
  }, [token]);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  return (
    <main className="px-5 py-6">
      <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>👥 Clientes</h1>

      <input type="text" placeholder="Buscar por nombre o teléfono..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 rounded-xl mb-5 text-sm outline-none"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      />

      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 rounded-2xl"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
          No se encontraron clientes
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((client) => (
            <div key={client.id} className="p-4 rounded-2xl flex items-center justify-between"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div>
                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{client.name}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  📱 {client.phone}
                </p>
                {client.email && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{client.email}</p>
                )}
              </div>
              <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noreferrer"
                className="p-3 rounded-xl text-xl"
                style={{ background: 'rgba(76,175,125,0.15)' }}>
                💬
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
