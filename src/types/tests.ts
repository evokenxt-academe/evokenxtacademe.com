// ── Raw shape from Supabase join query ──────────────────────────

export type TestAttemptRaw = {
  id: string
  score: number
  total_marks: number
  status: 'in_progress' | 'submitted' | 'timed_out'
  started_at: string
  submitted_at: string | null
  quizzes: {
    id: string
    title: string
    type: 'practice' | 'graded' | 'final'
    passing_marks: number
    time_limit_sec: number | null
    sections: {
      courses: {
        name: string
        slug: string
      } | null
    } | null
  } | null
}

// ── Derived shape with computed fields ──────────────────────────

export type TestAttempt = {
  id: string
  score: number
  total_marks: number
  status: 'in_progress' | 'submitted' | 'timed_out'
  started_at: string
  submitted_at: string | null
  quizzes: {
    id: string
    title: string
    type: 'practice' | 'graded' | 'final'
    passing_marks: number
    time_limit_sec: number | null
    sections: {
      courses: {
        name: string
        slug: string
      }
    }
  }
  isPassed: boolean
  scorePercent: number
  passingPercent: number
  courseName: string
  courseSlug: string
  durationLabel: string
}

// ── Pure helper — no Supabase imports ───────────────────────────

export function deriveAttempts(raw: TestAttemptRaw[]): TestAttempt[] {
  return raw
    .filter(
      (a): a is TestAttemptRaw & {
        quizzes: NonNullable<TestAttemptRaw['quizzes']> & {
          sections: NonNullable<NonNullable<TestAttemptRaw['quizzes']>['sections']> & {
            courses: NonNullable<NonNullable<NonNullable<TestAttemptRaw['quizzes']>['sections']>['courses']>
          }
        }
      } =>
        a.quizzes !== null &&
        a.quizzes.sections !== null &&
        a.quizzes.sections.courses !== null
    )
    .map((a) => {
      const scorePercent =
        a.total_marks > 0
          ? Math.round((a.score / a.total_marks) * 100)
          : 0

      const passingPercent =
        a.total_marks > 0
          ? Math.round((a.quizzes.passing_marks / a.total_marks) * 100)
          : 0

      const isPassed =
        a.score >= a.quizzes.passing_marks && a.status === 'submitted'

      const sec = a.quizzes.time_limit_sec
      const durationLabel = !sec
        ? 'No limit'
        : sec < 3600
          ? `${Math.round(sec / 60)} min`
          : `${(sec / 3600).toFixed(1)} hr`

      return {
        ...a,
        quizzes: {
          ...a.quizzes,
          sections: {
            ...a.quizzes.sections,
            courses: {
              ...a.quizzes.sections.courses,
            },
          },
        },
        isPassed,
        scorePercent,
        passingPercent,
        courseName: a.quizzes.sections.courses.name,
        courseSlug: a.quizzes.sections.courses.slug,
        durationLabel,
      }
    })
}
