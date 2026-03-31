export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'kiosk' | 'parent';
  class_id: number | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface Grade {
  id: number;
  student_id: number;
  subject_id: number;
  subject_name?: string;
  topic_id?: number;
  topic_name?: string;
  value: number;
  grade_type: 'СОЧ' | 'СОР' | 'текущая' | 'экзамен';
  date: string;
  quarter?: number;
}

export interface SubjectSummary {
  subject_id: number;
  subject_name: string;
  average: number;
  trend_score: number;
  trend_slope: number;
  risk_score: number;
  gap_topic_ids: number[];
  recommendations: { title: string; url: string }[];
  grades_count?: number;
}

export interface StudentAnalytics {
  student_id: number;
  student_name: string;
  subjects: SubjectSummary[];
  overall_risk: number;
  high_risk_subjects: string[];
  recommendations: { title: string; url: string }[];
}

export interface ScheduleSlot {
  id: number;
  class_id: number;
  group_id?: number;
  subject_id: number;
  subject_name?: string;
  teacher_id: number;
  teacher_name?: string;
  room_id: number;
  room_name?: string;
  class_name?: string;
  day_of_week: number;
  period_num: number;
  week_type: string;
  slot_type: string;
  is_substitution: boolean;
}

export interface NewsItem {
  id: number;
  title: string;
  body: string;
  author_id: number;
  published_at: string;
  is_published: boolean;
  image_url?: string;
  is_announcement: boolean;
}

export interface Notification {
  id: number;
  text: string;
  is_read: boolean;
  notification_type: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  student_id: number;
  student_name: string;
  total_points: number;
  class_name?: string;
}

export interface PortfolioItem {
  id: number;
  student_id: number;
  item_type: string;
  title: string;
  description?: string;
  file_url?: string;
  verified_by?: number;
  created_at: string;
}

export interface ShopItem {
  id: number;
  name: string;
  description?: string;
  cost: number;
  image_url?: string;
  is_available: boolean;
  stock: number;
}
