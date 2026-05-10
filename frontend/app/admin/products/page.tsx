'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { api, Product } from '@/lib/api';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  isActive: true,
};

export default function ProductsAdminPage() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!token) return;
    api.getAllProducts(token)
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('isActive', String(form.isActive));
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editId) {
        const updated = await api.updateProduct(editId, formData, token);
        setProducts((prev) => prev.map((p) => (p.id === editId ? updated : p)));
      } else {
        const created = await api.createProduct(formData, token);
        setProducts((prev) => [created, ...prev]);
      }

      resetForm();
      setShowForm(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      isActive: product.isActive,
    });
    setEditId(product.id);
    setImagePreview(product.imageUrl ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}/${product.imageUrl}` : null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('¿Eliminar este producto?')) return;
    try {
      await api.deleteProduct(id, token);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <main className="px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>🛒 Productos</h1>
        {isAdmin && (
          <button
            onClick={() => { if (showForm) resetForm(); setShowForm(!showForm); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'var(--color-primary)', color: '#ffffff' }}>
            {showForm ? 'Cancelar' : '+ Nuevo'}
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && isAdmin && (
        <div className="mb-8 p-6 rounded-2xl animate-in fade-in slide-in-from-top-2"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="font-semibold mb-6 text-lg" style={{ color: 'var(--color-text)' }}>
            {editId ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Imagen del producto</label>
              <div 
                className="relative w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors hover:border-primary/50"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <span className="text-3xl mb-2 block">📸</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Haz clic para subir una imagen</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium ml-1" style={{ color: 'var(--color-text-muted)' }}>Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej: Cera Modeladora"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full p-3 rounded-xl text-sm outline-none transition-all focus:ring-1 focus:ring-primary"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium ml-1" style={{ color: 'var(--color-text-muted)' }}>Precio ($) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full p-3 rounded-xl text-sm outline-none transition-all focus:ring-1 focus:ring-primary"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium ml-1" style={{ color: 'var(--color-text-muted)' }}>Descripción *</label>
              <textarea
                placeholder="Describe el producto..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full p-3 rounded-xl text-sm outline-none resize-none transition-all focus:ring-1 focus:ring-primary"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-5 h-5 rounded-md accent-primary cursor-pointer"
              />
              <label htmlFor="isActive" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--color-text)' }}>
                Producto visible para clientes
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.description || !form.price}
              className="w-full py-4 rounded-xl font-bold text-sm disabled:opacity-40 mt-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-primary)', color: '#ffffff' }}>
              {saving ? 'Guardando...' : editId ? 'Actualizar Producto' : 'Crear Producto'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Cargando inventario...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group flex flex-col rounded-2xl overflow-hidden transition-all hover:translate-y-[-4px]"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              
              <div className="relative aspect-square bg-black/5 overflow-hidden">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}/${product.imageUrl}`} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-2 text-4xl">📦</div>
                )}
                {!product.isActive && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">OCULTO</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold shadow-lg"
                     style={{ background: 'rgba(0,0,0,0.6)', color: '#ffffff', backdropFilter: 'blur(4px)' }}>
                  ${product.price}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-base mb-1 line-clamp-1" style={{ color: 'var(--color-text)' }}>{product.name}</h3>
                <p className="text-xs line-clamp-2 flex-1 mb-4" style={{ color: 'var(--color-text-muted)' }}>{product.description}</p>
                
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-primary/10"
                      style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-3 py-2.5 rounded-xl text-xs transition-all hover:bg-error/10"
                      style={{ border: '1px solid var(--color-error)', color: 'var(--color-error)' }}>
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
            <div className="col-span-full py-20 text-center rounded-3xl border-2 border-dashed"
                 style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <div className="text-4xl mb-4">✨</div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>No hay productos registrados aún.</p>
              {isAdmin && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-xs font-bold underline" 
                  style={{ color: 'var(--color-primary)' }}>
                  Crear mi primer producto
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
