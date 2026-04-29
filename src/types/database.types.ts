export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = "student" | "instructor" | "admin"
export type CourseLevel = "knowledge" | "skills" | "professional"
export type CourseStatus = "draft" | "published" | "archived"
export type EnrollStatus = "active" | "expired" | "refunded"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"
export type StreamStatus = "scheduled" | "live" | "ended" | "cancelled"
export type QuizType = "practice" | "graded" | "final"
export type AttemptStatus = "in_progress" | "submitted" | "timed_out"

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
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          avatar?: string | null
          phone?: string | null
          role?: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          avatar?: string | null
          phone?: string | null
          role?: UserRole
          created_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          level: CourseLevel
          thumbnail_url: string | null
          instructor_id: string
          price: number
          discount_price: number | null
          status: CourseStatus
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          level?: CourseLevel
          thumbnail_url?: string | null
          instructor_id: string
          price?: number
          discount_price?: number | null
          status?: CourseStatus
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          level?: CourseLevel
          thumbnail_url?: string | null
          instructor_id?: string
          price?: number
          discount_price?: number | null
          status?: CourseStatus
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
      enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          status: EnrollStatus
          enrolled_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          status?: EnrollStatus
          enrolled_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          status?: EnrollStatus
          enrolled_at?: string
          expires_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          amount: number
          currency: string
          status: PaymentStatus
          gateway: string
          gateway_order_id: string | null
          gateway_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          amount: number
          currency?: string
          status?: PaymentStatus
          gateway?: string
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          amount?: number
          currency?: string
          status?: PaymentStatus
          gateway?: string
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          created_at?: string
        }
      }
      lecture_progress: {
        Row: {
          id: string
          user_id: string
          lecture_id: string
          is_completed: boolean
          watched_seconds: number
          last_watched_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          lecture_id: string
          is_completed?: boolean
          watched_seconds?: number
          last_watched_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          lecture_id?: string
          is_completed?: boolean
          watched_seconds?: number
          last_watched_at?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          course_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      certificates: {
        Row: {
          id: string
          user_id: string
          course_id: string
          cert_url: string
          issued_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          cert_url: string
          issued_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          cert_url?: string
          issued_at?: string
        }
      }
      live_streams: {
        Row: {
          id: string
          title: string
          course_id: string
          yt_video_id: string | null
          stream_key: string | null
          status: StreamStatus
          scheduled_at: string | null
          started_at: string | null
          ended_at: string | null
        }
        Insert: {
          id?: string
          title: string
          course_id: string
          yt_video_id?: string | null
          stream_key?: string | null
          status?: StreamStatus
          scheduled_at?: string | null
          started_at?: string | null
          ended_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          course_id?: string
          yt_video_id?: string | null
          stream_key?: string | null
          status?: StreamStatus
          scheduled_at?: string | null
          started_at?: string | null
          ended_at?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          live_stream_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          live_stream_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          live_stream_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          section_id: string
          title: string
          description: string | null
          type: QuizType
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
          type?: QuizType
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
          type?: QuizType
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
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          user_id: string
          score: number
          total_marks: number
          status: AttemptStatus
          started_at: string
          submitted_at: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          user_id: string
          score?: number
          total_marks?: number
          status?: AttemptStatus
          started_at?: string
          submitted_at?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          user_id?: string
          score?: number
          total_marks?: number
          status?: AttemptStatus
          started_at?: string
          submitted_at?: string | null
        }
      }
      quiz_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_option_id: string | null
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_option_id?: string | null
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          selected_option_id?: string | null
        }
      }
    }
  }
}

// ─── Convenience Row aliases ───────────────────────────────────────
export type UserRow = Database["public"]["Tables"]["users"]["Row"]
export type CourseRow = Database["public"]["Tables"]["courses"]["Row"]
export type SectionRow = Database["public"]["Tables"]["sections"]["Row"]
export type LectureRow = Database["public"]["Tables"]["lectures"]["Row"]
export type EnrollmentRow = Database["public"]["Tables"]["enrollments"]["Row"]
export type LectureProgressRow = Database["public"]["Tables"]["lecture_progress"]["Row"]
export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"]
export type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"]
export type LiveStreamRow = Database["public"]["Tables"]["live_streams"]["Row"]
export type LiveChatMessageRow = Database["public"]["Tables"]["chat_messages"]["Row"]
