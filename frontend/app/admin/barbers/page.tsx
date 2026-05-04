'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api, Barber } from '@/lib/api';

export default function BarbersAdminPage() {
  const { token, user } = useAuth();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    isActive: true,
  });

  const isAdmin = user?.role === 'ADMIN';

  const fetchBarbers = async () => {
    if (!token) return;
    try {
      const data = await api.getAllBarbers(token);
      setBarbers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbers();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        isActive: formData.isActive,
      };
      
      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingId) {
        await api.updateBarber(editingId, payload, token);
      } else {
        await api.createBarber(payload, token);
      }
      
      setIsModalOpen(false);
      fetchBarbers();
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este barbero? Sus turnos futuros seran cancelados y los clientes seran notificados.')) return;
    if (!token) return;

    try {
      await api.deleteBarber(id, token);
      fetchBarbers();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const openModal = (barber?: Barber) => {
    if (barber) {
      setEditingId(barber.id);
      setFormData({
        name: barber.name,
        email: barber.email,
        phone: barber.phone || '',
        password: '',
        isActive: barber.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  if (!isAdmin) return <div className="p-6 text-center text-white">No tienes permisos.</div>;

  return (
    <main className="px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>💈 Barberos</h1>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: 'var(--color-primary)', color: '#ffffff' }}
        >
          + Nuevo
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {barbers.map((barber) => (
            <div key={barber.id} className="p-4 rounded-2xl flex items-center justify-between"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                opacity: barber.isActive ? 1 : 0.6,
              }}>
              <div>
                <p className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
                  {barber.name}
                  {!barber.isActive && <span className="ml-2 text-xs text-red-400 font-normal">(Inactivo)</span>}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{barber.email} | {barber.phone}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(barber)}
                  className="p-2 rounded-xl text-sm"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(barber.id)}
                  className="p-2 rounded-xl text-sm"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-error)' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {barbers.length === 0 && (
            <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
              No hay barberos registrados.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm p-6 rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              {editingId ? 'Editar Barbero' : 'Nuevo Barbero'}
            </h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Nombre Completo</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Email</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>WhatsApp (con prefijo, ej: +54911...)</label>
                <input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 rounded-xl text-sm outline-none"
                  placeholder="+5491122334455"
                  pattern="^\+\d{10,15}$"
                  title="Debe incluir el codigo de pais, ej: +5491123456789"
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Contraseña {editingId && '(Dejar vacia para no cambiar)'}</label>
                <input type="password" required={!editingId} minLength={6} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-purple-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  Activo
                </label>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--color-primary)', color: '#ffffff' }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
