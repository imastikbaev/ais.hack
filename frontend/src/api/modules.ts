import api from './client';

export const kundelikApi = {
  today: () => api.get('/kundelik/today'),
  currentLesson: () => api.get('/kundelik/current-lesson'),
  dayProgress: () => api.get('/kundelik/day-progress'),
  homework: (days?: number) => api.get('/kundelik/homework', { params: { days_ahead: days } }),
  sync: () => api.post('/kundelik/sync'),
};

export const nisgramApi = {
  feed: (tag?: string) => api.get('/nisgram/feed', { params: { tag } }),
  createPost: (data: any) => api.post('/nisgram/posts', data),
  pendingPosts: () => api.get('/nisgram/moderation'),
  moderate: (id: number, action: string, reason?: string) =>
    api.post(`/nisgram/moderation/${id}`, { action, reason }),
  like: (id: number) => api.post(`/nisgram/posts/${id}/like`),
  tags: () => api.get('/nisgram/tags'),
};

export const wellnessApi = {
  tests: () => api.get('/wellness/tests'),
  test: (id: number) => api.get(`/wellness/tests/${id}`),
  submitTest: (id: number, answers: Record<string, number>) =>
    api.post(`/wellness/tests/${id}/submit`, { answers }),
  myResults: () => api.get('/wellness/tests/results/my'),
  journal: () => api.get('/wellness/journal'),
  addJournal: (data: { encrypted_content: string; iv: string; auth_tag?: string }) =>
    api.post('/wellness/journal', data),
  updateJournal: (id: number, data: any) => api.put(`/wellness/journal/${id}`, data),
  deleteJournal: (id: number) => api.delete(`/wellness/journal/${id}`),
  bookConsult: (requested_date: string, topic?: string) =>
    api.post('/wellness/consultation', { requested_date, topic }),
  myConsults: () => api.get('/wellness/consultation/my'),
};

export const currencyApi = {
  balance: () => api.get('/currency/balance'),
  cafeteria: () => api.get('/currency/cafeteria'),
  order: (item_id: number) => api.post('/currency/cafeteria/order', { item_id }),
  myOrders: () => api.get('/currency/cafeteria/orders/my'),
  redeem: (qr_token: string) => api.post(`/currency/cafeteria/redeem/${qr_token}`),
};

export const securityApi = {
  auditLog: () => api.get('/security/audit-log'),
  myChildren: () => api.get('/security/parent/my-children'),
  curatorAlerts: (class_id: number) => api.get('/security/curator/class-alerts', { params: { class_id } }),
};

export const parentApi = {
  myChildren: () => api.get('/security/parent/my-children'),
  childGrades: (studentId: number) => api.get(`/security/parent/child/${studentId}/grades`),
  childSchedule: (studentId: number) => api.get(`/security/parent/child/${studentId}/schedule`),
};
