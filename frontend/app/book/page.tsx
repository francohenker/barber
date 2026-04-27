'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type Step = 1 | 2 | 3 | 4;

export default function BookPage() {
  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [slots, setSlots] = useState<string[]>([]);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getServices().then(setServices).catch(() => {});
    // Fetch barbers (users endpoint is admin-only, so we mock or call public endpoint)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setBarbers)
      .catch(() => setBarbers([]));
  }, []);

  useEffect(() => {
    if (selectedDate && selectedBarber && selectedService) {
      api
        .getSlots(selectedDate, selectedBarber.id, selectedService.duration)
        .then(setSlots)
        .catch(() => setSlots([]));
    }
  }, [selectedDate, selectedBarber, selectedService]);

  const handleBook = async () => {
    setLoading(true);
    setError('');
    try {
      const client = await api.findOrCreateClient({ name: clientName, phone: clientPhone });
      await api.createAppointment({
        date: selectedDate,
        startTime: selectedSlot,
        clientId: client.id,
        serviceId: selectedService.id,
        barberId: selectedBarber.id,
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Error al reservar');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (success) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#000000' }}>
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>¡Turno reservado!</h1>
        <p className="text-sm mb-8" style={{ color: '#ffffff' }}>
          {selectedService?.name} el {selectedDate} a las {selectedSlot}
        </p>
          <Link href="/" className="block w-full max-w-xs py-4 rounded-xl text-center font-semibold"
            style={{ background: '#bc19eb', color: '#ffffff' }}>
            Volver al inicio
          </Link>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-6 py-8 max-w-sm mx-auto" style={{ background: '#000000' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" style={{ color: '#ffffff' }}>←</Link>
        <h1 className="text-xl font-bold" style={{ color: '#ffffff' }}>Reservar turno</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="h-1 flex-1 rounded-full transition-all"
            style={{ background: s <= step ? '#bc19eb' : '#e0e0e0' }} />
        ))}
      </div>

      {/* Step 1: Choose service */}
      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>
            1. Elegí el servicio
          </h2>
          <div className="flex flex-col gap-3">
            {services.map((svc) => (
              <button key={svc.id} onClick={() => { setSelectedService(svc); setStep(2); }}
                className="w-full p-4 rounded-2xl text-left transition-all active:scale-95"
                style={{
                  background: selectedService?.id === svc.id ? '#bc19eb' : '#1a1a1a',
                  border: `2px solid ${selectedService?.id === svc.id ? '#bc19eb' : '#333333'}`,
                  color: selectedService?.id === svc.id ? '#ffffff' : '#ffffff',
                }}>
                <p className="font-semibold">{svc.name}</p>
                <div className="flex gap-4 mt-1">
                  <span className="text-sm" style={{ color: selectedService?.id === svc.id ? '#ffffff' : '#bc19eb' }}>${svc.price}</span>
                  <span className="text-sm" style={{ color: selectedService?.id === svc.id ? '#ffffff' : '#aaaaaa' }}>{svc.duration} min</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Choose date */}
      {step === 2 && (
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>
            2. Elegí la fecha
          </h2>
          <input
            type="date"
            min={today}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-4 rounded-2xl text-base outline-none"
            style={{
              background: '#1a1a1a',
              border: '1px solid #333333',
              color: '#ffffff',
            }}
          />
          {barbers.length > 0 && (
            <div className="mt-4">
              <p className="text-sm mb-2" style={{ color: '#ffffff' }}>Barbero</p>
                <div className="flex flex-col gap-2">
                {barbers.map((b: any) => (
                  <button key={b.id} onClick={() => setSelectedBarber(b)}
                    className="w-full p-3 rounded-xl text-left"
                    style={{
                      background: selectedBarber?.id === b.id ? '#bc19eb' : '#1a1a1a',
                      border: `2px solid ${selectedBarber?.id === b.id ? '#bc19eb' : '#333333'}`,
                      color: selectedBarber?.id === b.id ? '#ffffff' : '#ffffff',
                    }}>
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}
            <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-medium"
              style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #333333' }}>
              Atrás
            </button>
            <button onClick={() => setStep(3)} disabled={!selectedDate}
              className="flex-1 py-3 rounded-xl font-semibold disabled:opacity-40"
              style={{ background: '#bc19eb', color: '#ffffff' }}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Choose time slot */}
      {step === 3 && (
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>
            3. Elegí el horario
          </h2>
          {slots.length === 0 ? (
            <p className="text-center py-8" style={{ color: '#aaaaaa' }}>
              No hay horarios disponibles para ese día.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button key={slot} onClick={() => setSelectedSlot(slot)}
                  className="py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
                   style={{
                    background: selectedSlot === slot ? '#bc19eb' : '#1a1a1a',
                    color: selectedSlot === slot ? '#ffffff' : '#ffffff',
                    border: `2px solid ${selectedSlot === slot ? '#bc19eb' : '#333333'}`,
                  }}>
                  {slot}
                </button>
              ))}
            </div>
          )}
            <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-medium"
              style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #333333' }}>
              Atrás
            </button>
            <button onClick={() => setStep(4)} disabled={!selectedSlot}
              className="flex-1 py-3 rounded-xl font-semibold disabled:opacity-40"
              style={{ background: '#bc19eb', color: '#ffffff' }}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Personal data + confirm */}
      {step === 4 && (
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>
            4. Tus datos
          </h2>

          {/* Summary */}
          <div className="p-4 rounded-2xl mb-6"
            style={{ background: '#1a1a1a', border: '1px solid #333333' }}>
            <p className="text-sm" style={{ color: '#aaaaaa' }}>Resumen</p>
            <p className="font-semibold mt-1" style={{ color: '#ffffff' }}>{selectedService?.name}</p>
            <p className="text-sm mt-0.5" style={{ color: '#aaaaaa' }}>
              {selectedDate} a las {selectedSlot}
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <input
              type="text"
              placeholder="Tu nombre"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full p-4 rounded-2xl text-base outline-none"
              style={{ background: '#1a1a1a', border: '1px solid #333333', color: '#ffffff' }}
            />
            <input
              type="tel"
              placeholder="Tu WhatsApp (ej: 1122334455)"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full p-4 rounded-2xl text-base outline-none"
              style={{ background: '#1a1a1a', border: '1px solid #333333', color: '#ffffff' }}
            />
          </div>

          {error && (
            <p className="text-sm mb-4 p-3 rounded-xl"
              style={{ background: '#3a1a1a', color: '#ff6b6b' }}>
              {error}
            </p>
          )}

            <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl font-medium"
              style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #333333' }}>
              Atrás
            </button>
            <button
              onClick={handleBook}
              disabled={loading || !clientName || !clientPhone}
              className="flex-1 py-3 rounded-xl font-semibold disabled:opacity-40"
              style={{ background: '#bc19eb', color: '#ffffff' }}>
              {loading ? 'Reservando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
