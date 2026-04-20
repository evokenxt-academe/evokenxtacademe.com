export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          email: string
          avatar: string | null
          phone: string | null
          role: "student" | "instructor" | "admin"
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          avatar?: string | null
          phone?: string | null
          role?: "student" | "instructor" | "admin"
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          avatar?: string | null
          phone?: string | null
          role?: "student" | "instructor" | "admin"
          created_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          level: "knowledge" | "skills" | "professional"
          thumbnail_url: string | null
          instructor_id: string
          price: number
          discount_price: number | null
          status: "draft" | "published" | "archived"
          total_duration_sec: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          level?: "knowledge" | "skills" | "professional"
          thumbnail_url?: string | null
          instructor_id: string
          price?: number
          discount_price?: number | null
          status?: "draft" | "published" | "archived"
          total_duration_sec?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          level?: "knowledge" | "skills" | "professional"
          thumbnail_url?: string | null
          instructor_id?: string
          price?: number
          discount_price?: number | null
          status?: "draft" | "published" | "archived"
          total_duration_sec?: number
          created_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          course_id: string
          title: string
          position: number
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          position?: number
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          position?: number
        }
      }
      lectures: {
        Row: {
          id: string
          section_id: string
          title: string
          video_url: string | null
          description: string | null
          duration_sec: number
          position: number
          is_preview: boolean
        }
        Insert: {
          id?: string
          section_id: string
          title: string
          video_url?: string | null
          description?: string | null
          duration_sec?: number
          position?: number
          is_preview?: boolean
        }
        Update: {
          id?: string
          section_id?: string
          title?: string
          video_url?: string | null
          description?: string | null
          duration_sec?: number
          position?: number
          is_preview?: boolean
        }
      }
      resources: {
        Row: {
          id: string
          lecture_id: string
          title: string
          file_url: string
        }
        Insert: {
          id?: string
          lecture_id: string
          title: string
          file_url: string
        }
        Update: {
          id?: string
          lecture_id?: string
          title?: string
          file_url?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          section_id: string
          title: string
          description: string | null
          type: "practice" | "graded" | "final"
          total_marks: number
          passing_marks: number
          time_limit_sec: number | null
          is_published: boolean
          created_at: string
        }
        Insert: {
           id?: string
           section_id: string
           title: string
           description?: string | null
           type?: "practice" | "graded" | "final"
           total_marks?: number
           passing_marks?: number
           time_limit_sec?: number | null
           is_published?: boolean
           created_at?: string
        }
        Update: {
           id?: string
           section_id?: string
           title?: string
           description?: string | null
           type?: "practice" | "graded" | "final"
           total_marks?: number
           passing_marks?: number
           time_limit_sec?: number | null
           is_published?: boolean
           created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          question: string
          source: string | null
          marks: number
          position: number
        }
        Insert: { id?: string; quiz_id: string; question: string; source?: string | null; marks?: number; position?: number }
        Update: { id?: string; quiz_id?: string; question?: string; source?: string | null; marks?: number; position?: number }
      }
      options: {
        Row: { id: string; question_id: string; text: string; is_correct: boolean }
        Insert: { id?: string; question_id: string; text: string; is_correct?: boolean }
        Update: { id?: string; question_id?: string; text?: string; is_correct?: boolean }
      }
      live_streams: {
        Row: { id: string; title: string; course_id: string; yt_video_id: string | null; stream_key: string | null; status: "scheduled" | "live" | "ended" | "cancelled"; scheduled_at: string | null; started_at: string | null; ended_at: string | null }
        Insert: { id?: string; title: string; course_id: string; yt_video_id?: string | null; stream_key?: string | null; status?: "scheduled" | "live" | "ended" | "cancelled"; scheduled_at?: string | null; started_at?: string | null; ended_at?: string | null }
        Update: { id?: string; title?: string; course_id?: string; yt_video_id?: string | null; stream_key?: string | null; status?: "scheduled" | "live" | "ended" | "cancelled"; scheduled_at?: string | null; started_at?: string | null; ended_at?: string | null }
      }
    }
  }
}
