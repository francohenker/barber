'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#8a8a8a', SCHEDULED: '#f0a545', ACTIVE: '#4caf7d', EXPIRED: '#e05c5c',
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador', SCHEDULED: 'Programado', ACTIVE: 'Activo', EXPIRED: 'Expirado',
};

const emptyForm = {
  title: '', description: '', discountPercent: '', discountAmount: '',
  imageUrl: '', sendViaWhatsapp: true, scheduledSendAt: '',
};

export default function PromotionsAdminPage() {
  const { token, user } = useAuth();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!token) return;
    api.getAllPromotions(token).then(setPromotions).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        sendViaWhatsapp: form.sendViaWhatsapp,
        ...(form.discountPercent ? { discountPercent: Number(form.discountPercent) } : {}),
        ...(form.discountAmount ? { discountAmount: Number(form.discountAmount) } : {}),
        ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
        ...(form.scheduledSendAt ? { scheduledSendAt: form.scheduledSendAt } : {}),
      };
      const created = await api.createPromotion(payload, token);
      setPromotions((prev) => [created, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendNow = async (id: string) => {
    if (!token) return;
    setSendingId(id);
    try {
      const updated = await api.sendPromotionNow(id, token);
      setPromotions((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('¿Eliminar esta promoción?')) return;
    try {
      await api.deletePromotion(id, token);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch {}
  };

  return (
    <main className="px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>🏷️ Promociones</h1>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-primary)', color: '#0a0a0a' }}>
            {showForm ? 'Cancelar' : '+ Nueva'}
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && isAdmin && (
        <div className="mb-6 p-4 rounded-2xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Nueva promoción</h2>
          <div className="flex flex-col gap-3">
            {[
              { key: 'title', label: 'Título *', type: 'text' },
              { key: 'imageUrl', label: 'URL de imagen (opcional)', type: 'url' },
              { key: 'discountPercent', label: '% de descuento (opcional)', type: 'number' },
              { key: 'discountAmount', label: '$ de descuento (opcional)', type: 'number' },
            ].map(({ key, label, type }) => (
              <input key={key} type={type} placeholder={label}
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full p-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            ))}
            <textarea placeholder="Descripción *" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} className="w-full p-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />

            <div className="flex items-center gap-3">
              <input type="checkbox" id="sendWa" checked={form.sendViaWhatsapp}
                onChange={(e) => setForm((f) => ({ ...f, sendViaWhatsapp: e.target.checked }))}
                className="w-4 h-4 accent-yellow-500"
              />
              <label htmlFor="sendWa" className="text-sm" style={{ color: 'var(--color-text)' }}>
                Enviar por WhatsApp
              </label>
            </div>

            {form.sendViaWhatsapp && (
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Fecha y hora de envío (dejar vacío para enviar manualmente)
                </p>
                <input type="datetime-local" value={form.scheduledSendAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledSendAt: e.target.value }))}
                  className="w-full p-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            )}

            <button onClick={handleSave} disabled={saving || !form.title || !form.description}
              className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
              style={{ background: 'var(--color-primary)', color: '#0a0a0a' }}>
              {saving ? 'Guardando...' : 'Guardar promoción'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {promotions.map((promo) => (
            <div key={promo.id} className="p-4 rounded-2xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{promo.title}</p>
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{ background: `${STATUS_COLORS[promo.status]}22`, color: STATUS_COLORS[promo.status] }}>
                  {STATUS_LABELS[promo.status]}
                </span>
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>{promo.description}</p>
              {promo.scheduledSendAt && !promo.sentAt && (
                <p className="text-xs mb-2" style={{ color: 'var(--color-warning)' }}>
                  📅 Programado: {new Date(promo.scheduledSendAt).toLocaleString('es-AR')}
                </p>
              )}
              {promo.sentAt && (
                <p className="text-xs mb-2" style={{ color: 'var(--color-success)' }}>
                  ✅ Enviado: {new Date(promo.sentAt).toLocaleString('es-AR')}
                </p>
              )}

              {isAdmin && (
                <div className="flex gap-2 mt-3">
                  {!promo.sentAt && promo.sendViaWhatsapp && (
                    <button onClick={() => handleSendNow(promo.id)}
                      disabled={sendingId === promo.id}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--color-primary)' }}>
                      {sendingId === promo.id ? 'Enviando...' : '📤 Enviar ahora'}
                    </button>
                  )}
                  <button onClick={() => handleDelete(promo.id)}
                    className="py-2 px-3 rounded-xl text-xs"
                    style={{ background: 'rgba(224,92,92,0.1)', color: 'var(--color-error)' }}>
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
