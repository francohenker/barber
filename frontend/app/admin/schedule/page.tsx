'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
  { value: 0, label: 'Domingo' },
];

interface DaySchedule {
  dayOfWeek: number;
  label: string;
  id: string | null;
  startTime: string;
  endTime: string;
  isClosed: boolean;
}

export default function ScheduleAdminPage() {
  const { token, user } = useAuth();
  const [days, setDays] = useState<DaySchedule[]>(() =>
    DAYS.map((d) => ({
      dayOfWeek: d.value,
      label: d.label,
      id: null,
      startTime: '09:00',
      endTime: '19:00',
      isClosed: false,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [applyTime, setApplyTime] = useState({ startTime: '09:00', endTime: '19:00', isClosed: false });

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!token) return;
    api.getSchedules(token)
      .then((data) => {
        const updated = DAYS.map((d) => {
          const found = data.find((s: any) => s.dayOfWeek === d.value);
          if (found) {
            return {
              dayOfWeek: d.value,
              label: d.label,
              id: found.id,
              startTime: found.startTime || '09:00',
              endTime: found.endTime || '19:00',
              isClosed: found.isClosed,
            };
          }
          return {
            dayOfWeek: d.value,
            label: d.label,
            id: null,
            startTime: '09:00',
            endTime: '19:00',
            isClosed: false,
          };
        });
        setDays(updated);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const updateDay = (dayOfWeek: number, field: keyof DaySchedule, value: any) => {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)),
    );
  };

  const handleApplyToSelected = () => {
    setDays((prev) =>
      prev.map((d) =>
        selectedDays.includes(d.dayOfWeek)
          ? { ...d, startTime: applyTime.startTime, endTime: applyTime.endTime, isClosed: applyTime.isClosed }
          : d,
      ),
    );
  };

  const toggleDaySelection = (dayOfWeek: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayOfWeek)
        ? prev.filter((d) => d !== dayOfWeek)
        : [...prev, dayOfWeek],
    );
  };

  const handleSave = async () => {
    if (!token || !isAdmin) return;
    setSaving(true);
    try {
      const payload = days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.isClosed ? null : d.startTime,
        endTime: d.isClosed ? null : d.endTime,
        isClosed: d.isClosed,
      }));
      await api.bulkUpdateSchedules(payload, token);
      alert('Horarios guardados correctamente');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>🕐 Horarios</h1>
      </div>

      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
      ) : (
        <>
          {/* Apply to selected */}
          <div className="mb-6 p-4 rounded-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              Aplicar horario a varios dias
            </h2>

            <div className="flex flex-wrap gap-2 mb-3">
              {DAYS.map((d) => {
                const isSelected = selectedDays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    onClick={() => toggleDaySelection(d.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-2)',
                      color: isSelected ? '#fff' : 'var(--color-text-muted)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Hora inicio</label>
                <input
                  type="time"
                  value={applyTime.startTime}
                  onChange={(e) => setApplyTime((a) => ({ ...a, startTime: e.target.value }))}
                  className="w-full p-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Hora fin</label>
                <input
                  type="time"
                  value={applyTime.endTime}
                  onChange={(e) => setApplyTime((a) => ({ ...a, endTime: e.target.value }))}
                  className="w-full p-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <input
                  type="checkbox"
                  id="applyClosed"
                  checked={applyTime.isClosed}
                  onChange={(e) => setApplyTime((a) => ({ ...a, isClosed: e.target.checked }))}
                  className="w-4 h-4 accent-yellow-500"
                />
                <label htmlFor="applyClosed" className="text-xs" style={{ color: 'var(--color-text)' }}>
                  Cerrado
                </label>
              </div>
              <button
                onClick={handleApplyToSelected}
                disabled={selectedDays.length === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                style={{ background: 'var(--color-primary)', color: '#ffffff' }}
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Days list */}
          <div className="flex flex-col gap-3 mb-6">
            {days.map((day) => (
              <div
                key={day.dayOfWeek}
                className="p-4 rounded-2xl"
                style={{
                  background: 'var(--color-surface)',
                  border: `1px solid ${day.isClosed ? 'rgba(224,92,92,0.3)' : 'var(--color-border)'}`,
                  opacity: day.isClosed ? 0.7 : 1,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{day.label}</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`closed-${day.dayOfWeek}`}
                      checked={day.isClosed}
                      onChange={(e) => updateDay(day.dayOfWeek, 'isClosed', e.target.checked)}
                      className="w-4 h-4 accent-yellow-500"
                    />
                    <label htmlFor={`closed-${day.dayOfWeek}`} className="text-xs" style={{ color: 'var(--color-text)' }}>
                      Cerrado
                    </label>
                  </div>
                </div>

                {!day.isClosed && (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Inicio</label>
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => updateDay(day.dayOfWeek, 'startTime', e.target.value)}
                        className="w-full p-2 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Fin</label>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateDay(day.dayOfWeek, 'endTime', e.target.value)}
                        className="w-full p-2 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                      />
                    </div>
                  </div>
                )}

                {day.isClosed && (
                  <p className="text-xs text-center py-2" style={{ color: 'var(--color-error)' }}>
                    Dia cerrado - No se generaran turnos
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Save button */}
          {isAdmin && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-xl font-semibold disabled:opacity-40 transition-all active:scale-95"
              style={{ background: 'var(--color-primary)', color: '#ffffff' }}
            >
              {saving ? 'Guardando...' : 'Guardar horarios'}
            </button>
          )}
        </>
      )}
    </main>
  );
}
