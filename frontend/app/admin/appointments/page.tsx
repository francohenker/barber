'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f0a545', CONFIRMED: '#4caf7d', CANCELLED: '#e05c5c', COMPLETED: '#5c9be0',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', CANCELLED: 'Cancelado', COMPLETED: 'Completado',
};

export default function AppointmentsPage() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');

  const fetchAppointments = () => {
    if (!token) return;
    setLoading(true);
    api.getAppointments(token, filterDate || undefined)
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, [token, filterDate]);

  const handleStatus = async (id: string, status: string) => {
    if (!token) return;
    try {
      const updated = await api.updateAppointmentStatus(id, status, token);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch {}
  };

  return (
    <main className="px-5 py-6">
      <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>📅 Turnos</h1>

      <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
        className="w-full p-3 rounded-xl mb-5 text-sm outline-none"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      />

      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-10 rounded-2xl"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
          No hay turnos
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map((appt) => (
            <div key={appt.id} className="p-4 rounded-2xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{appt.client?.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {appt.service?.name} · {appt.date} {appt.startTime}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    📱 {appt.client?.phone} · {appt.source}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: `${STATUS_COLORS[appt.status]}22`, color: STATUS_COLORS[appt.status] }}>
                  {STATUS_LABELS[appt.status]}
                </span>
              </div>

              {appt.status === 'PENDING' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleStatus(appt.id, 'CONFIRMED')}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(76,175,125,0.15)', color: '#4caf7d' }}>
                    Confirmar
                  </button>
                  <button onClick={() => handleStatus(appt.id, 'CANCELLED')}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(224,92,92,0.15)', color: 'var(--color-error)' }}>
                    Cancelar
                  </button>
                </div>
              )}
              {appt.status === 'CONFIRMED' && (
                <button onClick={() => handleStatus(appt.id, 'COMPLETED')}
                  className="w-full mt-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(92,155,224,0.15)', color: 'var(--color-info)' }}>
                  Marcar completado
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
