'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api, User } from '@/lib/api';

export default function UsersAdminPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const data = await api.getAllUsers(token);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!token) return;
    
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    
    try {
      await api.updateUserRole(userId, newRole, token);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el rol');
      // Revert on failure
      fetchUsers();
    }
  };

  if (!isAdmin) return <div className="p-6 text-center text-white">No tienes permisos.</div>;

  return (
    <main className="px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>👤 Usuarios</h1>
      </div>

      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <div key={u.id} className="p-4 rounded-2xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                opacity: u.isActive ? 1 : 0.6,
              }}>
              <div className="flex-1">
                <p className="font-semibold text-base flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  {u.avatar && <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full" />}
                  {u.name}
                  {!u.isActive && <span className="text-xs text-red-400 font-normal">(Inactivo)</span>}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{u.email}</p>
                {u.phone && <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{u.phone}</p>}
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Rol:</label>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  disabled={u.id === user?.id} // Don't let admin change their own role to avoid lockout
                  className="p-2 rounded-xl text-xs outline-none font-semibold transition-all disabled:opacity-50"
                  style={{ 
                    background: 'var(--color-bg)', 
                    border: '1px solid var(--color-border)', 
                    color: u.role === 'ADMIN' ? 'var(--color-primary)' : u.role === 'BARBER' ? '#F59E0B' : 'var(--color-text)'
                  }}
                >
                  <option value="USER">Usuario</option>
                  <option value="BARBER">Barbero</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
              No hay usuarios registrados.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
