'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function WhatsappAdminPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.getWhatsappLogs(token).then(setLogs).finally(() => setLoading(false));
  }, [token]);

  return (
    <main className="px-5 py-6">
      <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>💬 WhatsApp Bot</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        Historial de mensajes del bot (Meta WhatsApp Business API)
      </p>

      {/* Status card */}
      <div className="p-4 rounded-2xl mb-6"
        style={{ background: 'var(--color-surface)', border: '1px solid rgba(76,175,125,0.3)' }}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#4caf7d' }} />
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
              Meta WhatsApp Business API
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Webhook: /api/whatsapp/webhook
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 rounded-2xl"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
          <p className="text-3xl mb-2">📭</p>
          <p>No hay mensajes registrados</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {logs.map((log) => (
            <div key={log.id}
              className={`p-4 rounded-2xl ${log.direction === 'IN' ? 'mr-6' : 'ml-6'}`}
              style={{
                background: log.direction === 'IN' ? 'var(--color-surface)' : 'rgba(201,169,110,0.1)',
                border: `1px solid ${log.direction === 'IN' ? 'var(--color-border)' : 'rgba(201,169,110,0.3)'}`,
              }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium"
                  style={{ color: log.direction === 'IN' ? 'var(--color-text-muted)' : 'var(--color-primary)' }}>
                  {log.direction === 'IN' ? `📱 ${log.phone}` : '🤖 Bot'}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {new Date(log.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                {log.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
