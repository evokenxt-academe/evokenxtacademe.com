# Evoke EduGlobal LMS v2.0.0 - Complete Migration Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Schema Changes](#schema-changes)
3. [TypeScript Types](#typescript-types)
4. [Query Layer Refactoring](#query-layer-refactoring)
5. [API Route Updates](#api-route-updates)
6. [UI Component Refactoring](#ui-component-refactoring)
7. [Payment System Integration](#payment-system-integration)
8. [Quiz Engine Implementation](#quiz-engine-implementation)
9. [Progress Tracking](#progress-tracking)
10. [RLS Compliance](#rls-compliance)
11. [Testing & Validation](#testing--validation)
12. [Deployment Checklist](#deployment-checklist)

---

## Overview

### What Changed

**v1.0** → **v2.0.0** introduces:

- ✅ Hierarchical program structure (Program → Level → Subject → Course)
- ✅ Chapter-based course organization (replacing Sections)
- ✅ Advanced pricing model (base price + multiple EMI plans)
- ✅ Payment & instalment tracking
- ✅ Lecture progress & watch analytics
- ✅ 7-type quiz engine with scoring
- ✅ Certificates with unique numbers
- ✅ Full Row-Level Security (RLS)

### Migration Timeline

- **Phase 1**: Update types, queries, and data layer (this week)
- **Phase 2**: Refactor API routes (next 2-3 days)
- **Phase 3**: Update UI pages (next 3-5 days)
- **Phase 4**: Payment integration & testing (3-4 days)
- **Phase 5**: Quiz engine testing (2-3 days)
- **Phase 6**: Go live with feature flags (rollout)

---

## Schema Changes

### Old Tables → New Tables

| Old           | New                                          | Status          |
| ------------- | -------------------------------------------- | --------------- |
| `courses`     | `courses` (with `subject_id`)                | ⚠️ Modified     |
| `sections`    | `chapters`                                   | ✅ Renamed      |
| `enrollments` | `enrollments` (with `pricing_id`, `plan_id`) | ⚠️ Modified     |
| `payments`    | `payments` (normalized)                      | ⚠️ Restructured |
| N/A           | `programs`                                   | ✅ New          |
| N/A           | `program_levels`                             | ✅ New          |
| N/A           | `subjects`                                   | ✅ New          |
| N/A           | `course_pricing`                             | ✅ New          |
| N/A           | `payment_plans`                              | ✅ New          |
| N/A           | `instalment_schedule`                        | ✅ New          |
| N/A           | `lecture_progress`                           | ✅ New          |
| N/A           | `watch_hours_daily`                          | ✅ New          |
| N/A           | `certificates`                               | ✅ New          |
| N/A           | `student_profiles`                           | ✅ New          |

### Data Migration Strategy

#### Step 1: Seed Programs (ACCA, CFA, CMA)

```sql
-- Already done in schema.sql
-- Verify with: SELECT * FROM programs;
```

#### Step 2: Create Program Levels

```sql
-- Already seeded in schema.sql
-- Verify: SELECT * FROM program_levels ORDER BY program_id, sequence_no;
```

#### Step 3: Map Old Courses to Subjects

```sql
-- Create a subject for each old course's "level"
INSERT INTO subjects (program_level_id, code, name, is_active)
SELECT pl.id, CONCAT(p.body, '-', cl.position), cl.level_name, true
FROM program_levels pl
JOIN programs p ON p.id = pl.program_id;

-- Update courses to reference new subject
UPDATE courses SET subject_id = (
  SELECT id FROM subjects WHERE code = CONCAT(
    (SELECT body FROM programs p
     JOIN program_levels pl ON pl.program_id = p.id
     WHERE pl.id = courses.program_level_id),
    '-1'
  )
);
```

#### Step 4: Rename Sections → Chapters

```sql
-- Already done in schema.sql (sections table removed, replaced with chapters)
-- If you have old data, rename:
ALTER TABLE sections RENAME TO chapters;
ALTER TABLE chapters RENAME COLUMN section_id TO course_id;
```

#### Step 5: Create Pricing Records

```sql
INSERT INTO course_pricing (course_id, label, base_price, is_active)
SELECT id, 'standard', price * 100, true
FROM courses
WHERE price > 0;
```

---

## TypeScript Types

### Use New Type Definitions

**CHANGE THIS:**

```typescript
import type {
  Database,
  CourseLevel,
  CourseStatus,
} from "@/types/database.types";
```

**TO THIS:**

```typescript
import type {
  Database,
  Course,
  CourseDetail,
  Enrollment,
  EnrollmentDetail,
  Quiz,
  QuestionType,
  // ... other v2.0.0 types
} from "@/types/database.v2.types";
```

### Type Enumerations

All enums moved to v2.0.0 types. Update imports:

```typescript
// OLD
import { CourseLevel, CourseStatus } from "@/types/database.types";

// NEW
import {
  PublishStatus,
  ProgramBody,
  QuestionType,
  EnrollStatus,
  PaymentStatus,
} from "@/types/database.v2.types";
```

---

## Query Layer Refactoring

### Replace Old Queries with v2 Queries

#### Example: Get Course Catalog

**BEFORE (v1.0):**

```typescript
const { data: courses } = await supabase
  .from("courses")
  .select("*, instructor:users!instructor_id(*), reviews(rating)")
  .eq("status", "published");
```

**AFTER (v2.0.0):**

```typescript
import { getPublishedCourses } from "@/lib/supabase/queries.v2";

const result = await getPublishedCourses(supabase, {
  programBody: "ACCA", // Optional filter
  limit: 10,
  offset: 0,
});

if (result.error) {
  console.error(result.error);
}
// result.data is fully typed as CourseDetail[]
```

#### Example: Get User Enrollments

**BEFORE:**

```typescript
const { data: enrollments } = await supabase
  .from("enrollments")
  .select("*, courses(*), payments(*)")
  .eq("user_id", userId);
```

**AFTER:**

```typescript
import { getUserEnrollments } from "@/lib/supabase/queries.v2";

const result = await getUserEnrollments(supabase, userId);
// result.data: EnrollmentDetail[]
// Includes course, pricing, plan, payments, instalments
```

### Query Layer File Structure

```
src/lib/supabase/
├── queries.v2.ts          # All v2.0.0 queries
├── queries.ts             # (LEGACY - mark for removal)
└── client.ts              # Supabase client initialization
```

---

## API Route Updates

### Route Structure

```
src/app/api/
├── catalog/
│   └── courses/            # GET /api/catalog/courses
├── enrollment/
│   ├── enroll/             # POST /api/enrollment/enroll
│   └── verify-payment/     # POST /api/enrollment/verify-payment
├── progress/
│   └── update-lecture/     # POST /api/progress/update-lecture
├── quiz/
│   ├── start/              # POST /api/quiz/start
│   ├── submit/             # POST /api/quiz/submit
│   └── review/             # GET /api/quiz/review?attemptId=...
├── dashboard/
│   ├── enrollments/        # GET /api/dashboard/enrollments
│   ├── progress/           # GET /api/dashboard/progress?courseId=...
│   └── payments/           # GET /api/dashboard/payments
├── review/
│   └── submit/             # POST /api/review/submit
├── certificates/           # GET /api/certificates
└── webhook/
    └── razorpay/           # POST /api/webhook/razorpay
```

### Update Existing Routes

**See `/src/lib/api-route-templates.ts` for full examples**

Key patterns:

1. Always check authentication
2. Use v2 queries
3. Proper error handling
4. Type-safe responses

---

## UI Component Refactoring

### Update Pages Structure

```
src/app/
├── (public)/
│   ├── programs/           # Browse programs
│   ├── subjects/           # Browse subjects in program
│   └── courses/            # Course catalog
├── (auth)/
│   └── auth/               # Login/signup
├── (dashboard)/
│   ├── dashboard/          # Main dashboard
│   ├── learn/
│   │   └── [courseId]/     # Learn page with chapters
│   ├── progress/           # Progress analytics
│   ├── payments/           # Payment history
│   ├── certificates/       # Downloaded certs
│   └── settings/           # Profile settings
└── admin/
    ├── programs/           # Manage programs
    ├── subjects/           # Manage subjects
    ├── courses/            # Manage courses
    ├── pricing/            # Manage pricing & plans
    ├── quizzes/            # Create quizzes
    ├── payments/           # Review payments
    └── users/              # Manage users
```

### Example: Course Detail Page

**BEFORE (v1.0):**

```typescript
// src/app/courses/[slug]/page.tsx
export default async function CoursePage({ params }) {
  const { data: course } = await supabase
    .from("courses")
    .select("*, sections(*), instructor:users!instructor_id(*)")
    .eq("slug", params.slug)
    .single();

  return <CourseDetailCard course={course} />;
}
```

**AFTER (v2.0.0):**

```typescript
// src/app/(public)/courses/[slug]/page.tsx
import { getCourseBySlug } from "@/lib/supabase/queries.v2";

export default async function CoursePage({ params }) {
  const supabase = createClient();
  const result = await getCourseBySlug(supabase, params.slug);

  if (result.error || !result.data) {
    return <NotFound />;
  }

  return (
    <>
      <CourseHero course={result.data} />
      <CourseContent course={result.data} />
      <CourseEnrollment course={result.data} />
    </>
  );
}
```

---

## Payment System Integration

### Setup Razorpay

1. **Get API Keys**
   - Log in to Razorpay dashboard
   - Copy Key ID and Key Secret

2. **Set Environment Variables**

```env
# .env.local
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

3. **Implement Enrollment Flow**

```typescript
// Step 1: User clicks "Enroll"
const enrollResponse = await fetch("/api/enrollment/enroll", {
  method: "POST",
  body: JSON.stringify({
    courseId,
    pricingId,
    planId,
    userEmail,
    userPhone,
  }),
});

const { orderId, razorpayKeyId } = await enrollResponse.json();

// Step 2: Open Razorpay checkout
const options = {
  key: razorpayKeyId,
  amount,
  currency: "INR",
  order_id: orderId,
  handler: async (response) => {
    // Step 3: Verify payment
    const verifyResponse = await fetch("/api/enrollment/verify-payment", {
      method: "POST",
      body: JSON.stringify({
        courseId,
        pricingId,
        planId,
        razorpayOrderId: orderId,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      }),
    });

    if (verifyResponse.ok) {
      // Enrollment successful!
    }
  },
};

Razorpay(options).open();
```

### EMI Plans

```typescript
// When user selects EMI plan
const { planId, num_installments, installment_amount } = selectedPlan;

// Payment is only for first instalment
const firstInstalmentAmount = installment_amount;

// Remaining instalments are scheduled
// (See instalment_schedule table)
```

---

## Quiz Engine Implementation

### 7 Question Types Support

```typescript
import type { QuestionType } from "@/types/database.v2.types";

// Types:
// 1. "mcq"                    - Single correct
// 2. "multiple_select"        - Multiple correct
// 3. "subjective"             - Long form (manual grading)
// 4. "fill_blank"             - Text matching
// 5. "true_false"             - Boolean
// 6. "assertion_reasoning"    - Statement + Reason
// 7. "numerical"              - Number with tolerance
```

### Quiz Creation

```typescript
// Admin creates quiz
const quiz = {
  course_id: null, // Course-level exam
  chapter_id: chapterId, // Or chapter-level quiz
  title: "Chapter 3 Quiz",
  quiz_type: "practice", // or "graded" or "final_exam"
  passing_score_percentage: 40,
  time_limit_minutes: 30,
  show_answers_after_submission: true,
  allow_review_after_submission: true,
  shuffle_questions: true,
  negative_marking: true,
  negative_marking_percentage: 25, // -0.25 per wrong
  is_published: true,
};

await supabase.from("quizzes").insert(quiz);
```

### Quiz Attempt

```typescript
import {
  createQuizAttempt,
  submitQuizAnswers,
} from "@/lib/supabase/queries.v2";
import { getQuizDetail, submitQuizAnswers } from "@/lib/quiz";

// Step 1: Start attempt
const attemptResult = await createQuizAttempt(supabase, userId, quizId);
const attemptId = attemptResult.data.id;

// Step 2: Get quiz details
const quizDetail = await getQuizDetail(supabase, quizId);

// Step 3: Render questions dynamically based on type

// Step 4: Submit answers
const submitResult = await submitQuizAnswers({
  supabase,
  attemptId,
  answers: [
    {
      questionId: "q1",
      questionType: "mcq",
      answer: "option-id-123", // Single option for MCQ
    },
    {
      questionId: "q2",
      questionType: "multiple_select",
      answer: ["opt1", "opt2"], // Multiple for multiple_select
    },
    {
      questionId: "q3",
      questionType: "fill_blank",
      answer: "photosynthesis", // Text for fill_blank
    },
    {
      questionId: "q4",
      questionType: "numerical",
      answer: 42.5, // Number with tolerance
    },
    {
      questionId: "q5",
      questionType: "subjective",
      answer: "Long form answer...", // Manual grading
    },
  ],
  quizDetail,
});

// Score is calculated and returned
console.log(submitResult.score);
```

---

## Progress Tracking

### Lecture Progress

```typescript
import { updateLectureProgress } from "@/lib/supabase/queries.v2";

// User watches video
await updateLectureProgress(supabase, userId, lectureId, {
  resume_position_sec: 125, // Where to resume from
  watch_time_sec: 450, // Total watched
  completion_percentage: 75,
  is_completed: false, // true when 100%
});
```

### Course Progress

```typescript
import { getCourseProgress } from "@/lib/supabase/queries.v2";

const progress = await getCourseProgress(supabase, userId, courseId);

// Returns:
// {
//   enrollmentId,
//   totalLectures: 25,
//   completedLectures: 12,
//   completionPercentage: 48,
//   totalWatchTime: 7200  // seconds
// }
```

### Watch Hours Analytics

```typescript
// Automatically tracked in watch_hours_daily table
// Query for dashboard:
const { data: dailyStats } = await supabase
  .from("watch_hours_daily")
  .select("*")
  .eq("user_id", userId)
  .order("watch_date", { ascending: false })
  .limit(30);
```

---

## RLS Compliance

### RLS Policies Applied

✅ **Admin** - Full CRUD on all tables
✅ **Instructor** - Read/write own courses, chapters, lectures
✅ **Student** - Read enrolled courses, progress, own payments

### Key Policies

```sql
-- Example: Students can only read lectures in enrolled courses
CREATE POLICY "enrolled_read_lectures"
  ON lectures FOR SELECT TO authenticated
  USING (
    chapters.course_id IN (
      SELECT course_id FROM enrollments
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
```

### Enforce in Queries

```typescript
// ALWAYS use authenticated client for protected data
const authenticatedSupabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// This will respect RLS policies for current user
const { data: lectures } = await authenticatedSupabase
  .from("lectures")
  .select("*")
  .eq("chapter_id", chapterId);
```

---

## Testing & Validation

### 1. Unit Tests

```typescript
// tests/lib/quiz.test.ts
import { validateMCQ, calculateQuizScore } from "@/lib/quiz";

describe("Quiz Engine", () => {
  it("should validate MCQ correctly", () => {
    const question = {
      id: "q1",
      options: [
        { id: "opt1", is_correct: true },
        { id: "opt2", is_correct: false },
      ],
      marks: 1,
      negative_marks: 0,
    };

    const result = validateMCQ(question, "opt1");
    expect(result.isCorrect).toBe(true);
    expect(result.marksAwarded).toBe(1);
  });
});
```

### 2. Integration Tests

```typescript
// tests/api/enrollment.test.ts
describe("POST /api/enrollment/verify-payment", () => {
  it("should complete enrollment on valid payment", async () => {
    const response = await fetch("/api/enrollment/verify-payment", {
      method: "POST",
      body: JSON.stringify({
        courseId: "course-1",
        pricingId: "pricing-1",
        razorpayOrderId: "order-1",
        razorpayPaymentId: "pay-1",
        razorpaySignature: "valid-sig",
      }),
    });

    expect(response.status).toBe(200);
  });
});
```

### 3. Database Validation

```typescript
// Check all migrations applied
SELECT * FROM public._prisma_migrations;

// Verify RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

// Check data integrity
SELECT COUNT(*) FROM programs;        -- Should be 3
SELECT COUNT(*) FROM program_levels;  -- Should be 7+
SELECT COUNT(*) FROM subjects;        -- Should match your courses
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All types migrated to v2.0.0
- [ ] All queries refactored to use queries.v2.ts
- [ ] API routes updated and tested
- [ ] Payment system integrated with Razorpay
- [ ] Quiz engine tested with all 7 types
- [ ] RLS policies verified
- [ ] Database migrations applied
- [ ] Environment variables set

### Testing

- [ ] Public catalog pages load correctly
- [ ] Course enrollment flow works end-to-end
- [ ] Payment verification succeeds
- [ ] Quiz attempt and submission work
- [ ] Progress tracking updates correctly
- [ ] Admin pages function properly
- [ ] RLS prevents unauthorized access

### Rollout

- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Enable feature flag for 10% users
- [ ] Monitor errors and performance
- [ ] Gradually increase to 100%
- [ ] Monitor payment success rate

### Rollback Plan

- Keep v1.0 queries available
- Database can run both versions
- Feature flag to switch schema version
- Rollback command: `git revert HEAD~5`

---

## Troubleshooting

### Issue: "type is missing in type union"

**Fix:** Import from `database.v2.types` not `database.types`

```typescript
// ❌ WRONG
import type { Database } from "@/types/database.types";

// ✅ CORRECT
import type { Database } from "@/types/database.v2.types";
```

### Issue: "RLS policy prevents access"

**Check:**

1. User authenticated? `auth.uid()` returns value
2. User has enrollment? `enrollments.user_id = auth.uid()`
3. Policy uses correct table? `chapters.course_id IN (...)`

### Issue: "Razorpay order creation fails"

**Check:**

1. API keys in env vars?
2. Order amount > 50 paise (₹0.50)?
3. Webhook signature verified?

### Issue: "Quiz answers not saving"

**Check:**

1. Quiz attempt created? `quiz_attempts.id exists`
2. Answer type matches question type?
3. User has course enrollment?

---

## Next Steps

1. ✅ Generated types → `src/types/database.v2.types.ts`
2. ✅ Generated queries → `src/lib/supabase/queries.v2.ts`
3. ✅ Payment system → `src/lib/payment.ts`
4. ✅ Quiz engine → `src/lib/quiz.ts`
5. 🔄 **NEXT**: Start refactoring API routes
6. 🔄 **THEN**: Update UI pages
7. 🔄 **FINALLY**: Full integration testing

---

**Generated:** 2026-05-04
**Schema Version:** v2.0.0
**Evoke EduGlobal LMS**
