import api from './client';
import type { Grade, StudentAnalytics, ScheduleSlot, NewsItem, LeaderboardEntry, PortfolioItem, ShopItem } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  refresh: (refresh_token: string) =>
    api.post('/auth/refresh', { refresh_token }),
};

export const gradesApi = {
  myGrades: (quarter?: number, subject_id?: number) =>
    api.get<Grade[]>('/grades/my', { params: { quarter, subject_id } }),
  myAnalytics: () => api.get<StudentAnalytics>('/grades/analytics/me'),
  classAnalytics: (classId: number) =>
    api.get(`/grades/analytics/class/${classId}`),
  mockSubjects: () => api.get('/grades/mock/subjects'),
  mockStudentGrades: (studentId: number) =>
    api.get(`/grades/mock/student/${studentId}`),
  addGrade: (data: { student_id: number; subject_id: number; value: number; grade_type: string; quarter: number; topic?: string }) =>
    api.post('/grades/', data),
};

export const scheduleApi = {
  mySchedule: () => api.get<ScheduleSlot[]>('/schedule/my'),
  classSchedule: (classId: number) =>
    api.get<ScheduleSlot[]>(`/schedule/class/${classId}`),
  generate: (class_ids: number[]) =>
    api.post('/schedule/generate', { class_ids }),
  createSubstitution: (data: { slot_id: number; new_teacher_id: number; new_room_id?: number; reason?: string }) =>
    api.post('/schedule/substitution', data),
  latestSubstitutions: () => api.get('/schedule/substitutions/latest'),
  rooms: () => api.get('/schedule/rooms'),
};

export const gamificationApi = {
  myPoints: () => api.get('/gamification/my-points'),
  classLeaderboard: () => api.get<LeaderboardEntry[]>('/gamification/leaderboard/class'),
  schoolLeaderboard: () => api.get<LeaderboardEntry[]>('/gamification/leaderboard/school'),
  shop: () => api.get<ShopItem[]>('/gamification/shop'),
  buy: (item_id: number) => api.post('/gamification/shop/buy', { item_id }),
  portfolio: () => api.get<PortfolioItem[]>('/gamification/portfolio'),
  addPortfolioItem: (data: { item_type: string; title: string; description?: string; file_url?: string }) =>
    api.post('/gamification/portfolio', data),
};

export const newsApi = {
  list: () => api.get<NewsItem[]>('/news/'),
  announcements: () => api.get<NewsItem[]>('/news/announcements'),
  create: (data: { title: string; body: string; image_url?: string; is_announcement: boolean }) =>
    api.post('/news/', data),
  update: (id: number, data: any) => api.put(`/news/${id}`, data),
  delete: (id: number) => api.delete(`/news/${id}`),
  notifications: () => api.get('/news/notifications'),
  markRead: (id: number) => api.post(`/news/notifications/${id}/read`),
};

export const aiApi = {
  studentAnalytics: (studentId: number) =>
    api.get(`/ai/student/${studentId}/analytics`),
  generateReport: (quarter?: number) =>
    api.get('/ai/report/generate', { params: { quarter } }),
};

export const kioskApi = {
  feed: () => api.get('/kiosk/feed'),
};

export { parentApi } from './modules';
