// ── Raw option shape from Supabase join ─────────────────────────

export type OptionRaw = {
  id: string
  text: string
  is_correct: boolean
}

// ── Raw question shape from Supabase join ───────────────────────

export type QuestionRaw = {
  id: string
  question: string
  source: string | null
  marks: number
  position: number
  options: OptionRaw[]
}

// ── Answer map: question_id → selected_option_id | null ─────────

export type AnswerMap = Record<string, string | null>

// ── Leaderboard entry with computed fields ──────────────────────

export type LeaderboardEntry = {
  id: string
  score: number
  total_marks: number
  submitted_at: string
  users: {
    id: string
    name: string | null
    avatar: string | null
  }
  rank: number
  scorePercent: number
  isCurrentUser: boolean
}

// ── Per-question result with correctness info ───────────────────

export type QuestionResult = QuestionRaw & {
  selectedOptionId: string | null
  selectedOption: OptionRaw | null
  correctOption: OptionRaw
  isCorrect: boolean
  isSkipped: boolean
  earnedMarks: number
}

// ── Attempt metadata with all computed display values ───────────

export type AttemptMeta = {
  id: string
  score: number
  total_marks: number
  status: 'in_progress' | 'submitted' | 'timed_out'
  started_at: string
  submitted_at: string | null
  scorePercent: number
  passingPercent: number
  isPassed: boolean
  timeTakenLabel: string
  quizTitle: string
  quizType: 'practice' | 'graded' | 'final'
  quizDescription: string | null
  passing_marks: number
  courseName: string
  courseSlug: string
}
