const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'Error en la solicitud');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: (token: string) => request<any>('/auth/me', {}, token),
  logout: (token: string) =>
    request<void>('/auth/logout', { method: 'POST' }, token),

  // Services (public)
  getServices: () => request<any[]>('/services'),
  getService: (id: string) => request<any>(`/services/${id}`),
  createService: (data: any, token: string) =>
    request<any>('/services', { method: 'POST', body: JSON.stringify(data) }, token),
  updateService: (id: string, data: any, token: string) =>
    request<any>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  deleteService: (id: string, token: string) =>
    request<void>(`/services/${id}`, { method: 'DELETE' }, token),

  // Appointments
  getSlots: (date: string, barberId: string, duration: number) =>
    request<string[]>(`/appointments/slots?date=${date}&barberId=${barberId}&duration=${duration}`),
  createAppointment: (data: any) =>
    request<any>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  getAppointments: (token: string, date?: string) =>
    request<any[]>(`/appointments${date ? `?date=${date}` : ''}`, {}, token),
  updateAppointmentStatus: (id: string, status: string, token: string) =>
    request<any>(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token),

  // Clients
  findOrCreateClient: (data: any) =>
    request<any>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  getClients: (token: string) => request<any[]>('/clients', {}, token),

  // Promotions
  getActivePromotions: () => request<any[]>('/promotions/active'),
  getAllPromotions: (token: string) => request<any[]>('/promotions', {}, token),
  createPromotion: (data: any, token: string) =>
    request<any>('/promotions', { method: 'POST', body: JSON.stringify(data) }, token),
  updatePromotion: (id: string, data: any, token: string) =>
    request<any>(`/promotions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  deletePromotion: (id: string, token: string) =>
    request<void>(`/promotions/${id}`, { method: 'DELETE' }, token),
  sendPromotionNow: (id: string, token: string) =>
    request<any>(`/promotions/${id}/send-now`, { method: 'POST' }, token),

  // WhatsApp
  getWhatsappLogs: (token: string) => request<any[]>('/whatsapp/logs', {}, token),
};
