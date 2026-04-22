'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

const empty = { name: '', description: '', price: '', duration: '', isActive: true };

export default function ServicesAdminPage() {
  const { token, user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!token) return;
    api.getServices().then(setServices).finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        duration: Number(form.duration),
        isActive: form.isActive,
      };
      if (editId) {
        const updated = await api.updateService(editId, payload, token);
        setServices((prev) => prev.map((s) => (s.id === editId ? updated : s)));
      } else {
        const created = await api.createService(payload, token);
        setServices((prev) => [...prev, created]);
      }
      setForm(empty);
      setEditId(null);
      setShowForm(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (svc: any) => {
    setForm({
      name: svc.name, description: svc.description || '',
      price: String(svc.price), duration: String(svc.duration), isActive: svc.isActive,
    });
    setEditId(svc.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('¿Eliminar este servicio?')) return;
    try {
      await api.deleteService(id, token);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  return (
    <main className="px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>✂️ Servicios</h1>
        {isAdmin && (
          <button onClick={() => { setForm(empty); setEditId(null); setShowForm(!showForm); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-primary)', color: '#0a0a0a' }}>
            {showForm ? 'Cancelar' : '+ Nuevo'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="mb-6 p-4 rounded-2xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            {editId ? 'Editar servicio' : 'Nuevo servicio'}
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { key: 'name', label: 'Nombre *', type: 'text' },
              { key: 'description', label: 'Descripción', type: 'text' },
              { key: 'price', label: 'Precio ($) *', type: 'number' },
              { key: 'duration', label: 'Duración (minutos) *', type: 'number' },
            ].map(({ key, label, type }) => (
              <input key={key} type={type} placeholder={label}
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full p-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            ))}
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 accent-yellow-500"
              />
              <label htmlFor="isActive" className="text-sm" style={{ color: 'var(--color-text)' }}>
                Activo (visible para clientes)
              </label>
            </div>
            <button onClick={handleSave} disabled={saving || !form.name || !form.price || !form.duration}
              className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
              style={{ background: 'var(--color-primary)', color: '#0a0a0a' }}>
              {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear servicio'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {services.map((svc) => (
            <div key={svc.id} className="p-4 rounded-2xl"
              style={{
                background: 'var(--color-surface)',
                border: `1px solid ${svc.isActive ? 'var(--color-border)' : 'rgba(224,92,92,0.3)'}`,
                opacity: svc.isActive ? 1 : 0.6,
              }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{svc.name}</p>
                  {svc.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{svc.description}</p>
                  )}
                  <div className="flex gap-3 mt-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>${svc.price}</span>
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{svc.duration} min</span>
                    {!svc.isActive && (
                      <span className="text-xs px-2 rounded-full"
                        style={{ background: 'rgba(224,92,92,0.15)', color: 'var(--color-error)' }}>
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(svc)}
                      className="p-2 rounded-lg text-sm"
                      style={{ background: 'rgba(201,169,110,0.1)', color: 'var(--color-primary)' }}>
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(svc.id)}
                      className="p-2 rounded-lg text-sm"
                      style={{ background: 'rgba(224,92,92,0.1)', color: 'var(--color-error)' }}>
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
