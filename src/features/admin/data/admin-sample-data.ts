export type AdminUser = {
    id: string
    name: string
    email: string
    avatar: string
    role: "student" | "instructor" | "admin"
    createdAt: string
}

export type AdminCourse = {
    id: string
    slug?: string
    name?: string
    title?: string
    instructor: string
    price: number
    status: "draft" | "published" | "archived"
    createdAt: string
}

export type AdminPayment = {
    id: number
    user: string
    course: string
    amount: number
    status: "pending" | "paid" | "failed" | "refunded"
    gateway: string
    createdAt: string
}

export type AdminEnrollment = {
    id: string;
    userId: string;
    courseId: string;
    user: string;
    course: string;
    status: "active" | "expired" | "refunded";
    enrolledAt: string;
    expiresAt: string;
}

export type AdminReview = {
    id: number
    user: string
    course: string
    rating: number
    comment: string
    createdAt: string
}

export type AdminLiveStream = {
    id: number
    title: string
    course: string
    status: "scheduled" | "live" | "ended" | "cancelled"
    scheduledAt: string
}

export type AdminChatMessage = {
    id: number
    stream: string
    user: string
    message: string
    createdAt: string
}

export type AdminQuiz = {
    id: number
    title: string
    section: string
    type: "practice" | "graded" | "final"
    totalMarks: number
    passingMarks: number
    published: boolean
}

export const dashboardStats = [
    { label: "Total Users", value: "24,184", delta: "+12.4%" },
    { label: "Total Courses", value: "128", delta: "+8" },
    { label: "Revenue", value: "₹38.4L", delta: "+18.2%" },
    { label: "Active Enrollments", value: "9,842", delta: "+4.1%" },
]

export const revenueSeries = [
    { month: "Jan", revenue: 1800000 },
    { month: "Feb", revenue: 2200000 },
    { month: "Mar", revenue: 2600000 },
    { month: "Apr", revenue: 3100000 },
    { month: "May", revenue: 2980000 },
    { month: "Jun", revenue: 3420000 },
]

export const growthSeries = [
    { month: "Jan", users: 18400 },
    { month: "Feb", users: 19350 },
    { month: "Mar", users: 20520 },
    { month: "Apr", users: 21420 },
    { month: "May", users: 22890 },
    { month: "Jun", users: 24184 },
]

export const recentActivity = [
    {
        id: 1,
        title: "New enrollment",
        description: "Aman enrolled in Advanced Audit & Assurance.",
        time: "2 min ago",
        tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    {
        id: 2,
        title: "Payment received",
        description: "₹8,500 paid for Strategic Business Leader.",
        time: "18 min ago",
        tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    },
    {
        id: 3,
        title: "Quiz submitted",
        description: "3 students completed the PM mock assessment.",
        time: "42 min ago",
        tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    {
        id: 4,
        title: "Stream went live",
        description: "Weekly doubt-clearing session started on time.",
        time: "1 hr ago",
        tone: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    },
]

export const users = [
    {
        id: "u-1",
        name: "Aman Verma",
        email: "aman@example.com",
        avatar: "",
        role: "student" as const,
        createdAt: "2026-04-02T10:20:00Z",
    },
    {
        id: "u-2",
        name: "Priya Shah",
        email: "priya@example.com",
        avatar: "",
        role: "instructor" as const,
        createdAt: "2026-03-18T14:05:00Z",
    },
    {
        id: "u-3",
        name: "Admin Root",
        email: "admin@example.com",
        avatar: "",
        role: "admin" as const,
        createdAt: "2025-12-11T08:45:00Z",
    },
    {
        id: "u-4",
        name: "Sara Khan",
        email: "sara@example.com",
        avatar: "",
        role: "student" as const,
        createdAt: "2026-02-09T12:10:00Z",
    },
]

export const instructors = users.filter((user) => user.role === "instructor")

export const courses = [
    {
        id: "11111111-1111-4111-8111-111111111101",
        name: "Strategic Business Leader",
        instructor: "Priya Shah",
        price: 8499,
        status: "published" as const,
        createdAt: "2026-02-11T10:30:00Z",
    },
    {
        id: "11111111-1111-4111-8111-111111111102",
        name: "Advanced Financial Management",
        instructor: "Priya Shah",
        price: 6999,
        status: "draft" as const,
        createdAt: "2026-03-02T13:15:00Z",
    },
    {
        id: "11111111-1111-4111-8111-111111111103",
        name: "Audit & Assurance Masterclass",
        instructor: "Rohit Mehta",
        price: 5999,
        status: "published" as const,
        createdAt: "2026-01-19T09:00:00Z",
    },
    {
        id: "11111111-1111-4111-8111-111111111104",
        name: "Corporate Reporting Crash Course",
        instructor: "Nisha Kapoor",
        price: 4499,
        status: "archived" as const,
        createdAt: "2025-11-21T16:40:00Z",
    },
]

export const payments = [
    {
        id: 201,
        user: "Aman Verma",
        course: "Strategic Business Leader",
        amount: 8499,
        status: "paid" as const,
        gateway: "razorpay",
        createdAt: "2026-04-16T11:20:00Z",
    },
    {
        id: 202,
        user: "Sara Khan",
        course: "Audit & Assurance Masterclass",
        amount: 5999,
        status: "pending" as const,
        gateway: "razorpay",
        createdAt: "2026-04-16T13:50:00Z",
    },
    {
        id: 203,
        user: "Priya Shah",
        course: "Advanced Financial Management",
        amount: 6999,
        status: "failed" as const,
        gateway: "stripe",
        createdAt: "2026-04-15T08:05:00Z",
    },
    {
        id: 204,
        user: "Aman Verma",
        course: "Corporate Reporting Crash Course",
        amount: 4499,
        status: "refunded" as const,
        gateway: "razorpay",
        createdAt: "2026-04-12T17:40:00Z",
    },
]

export const enrollments = [
    {
        id: "301",
        userId: "u-1",
        courseId: "11111111-1111-4111-8111-111111111101",
        user: "Aman Verma",
        course: "Strategic Business Leader",
        status: "active" as const,
        enrolledAt: "2026-04-02T10:20:00Z",
        expiresAt: "2027-04-10T00:00:00Z",
    },
    {
        id: "302",
        userId: "u-4",
        courseId: "11111111-1111-4111-8111-111111111103",
        user: "Sara Khan",
        course: "Audit & Assurance Masterclass",
        status: "active" as const,
        enrolledAt: "2026-02-09T12:10:00Z",
        expiresAt: "2027-01-21T00:00:00Z",
    },
    {
        id: "303",
        userId: "u-2",
        courseId: "11111111-1111-4111-8111-111111111104",
        user: "Priya Shah",
        course: "Corporate Reporting Crash Course",
        status: "expired" as const,
        enrolledAt: "2025-11-21T16:40:00Z",
        expiresAt: "2025-12-31T00:00:00Z",
    },
    {
        id: "304",
        userId: "u-5",
        courseId: "11111111-1111-4111-8111-111111111102",
        user: "Ritik Jain",
        course: "Advanced Financial Management",
        status: "refunded" as const,
        enrolledAt: "2026-03-02T13:15:00Z",
        expiresAt: "2026-07-10T00:00:00Z",
    },
]

export const reviews = [
    {
        id: 401,
        user: "Aman Verma",
        course: "Strategic Business Leader",
        rating: 5,
        comment: "Structured well and exam-oriented. The tutor notes are excellent.",
        createdAt: "2026-04-14T10:10:00Z",
    },
    {
        id: 402,
        user: "Sara Khan",
        course: "Audit & Assurance Masterclass",
        rating: 4,
        comment: "Very practical, but I wanted more solved MCQs.",
        createdAt: "2026-04-10T15:15:00Z",
    },
    {
        id: 403,
        user: "Priya Shah",
        course: "Advanced Financial Management",
        rating: 5,
        comment: "Clean UI, easy to navigate, and the pacing is ideal.",
        createdAt: "2026-04-08T07:45:00Z",
    },
]

export const liveStreams = [
    {
        id: 501,
        title: "Weekly doubt clearing",
        course: "Strategic Business Leader",
        status: "live" as const,
        scheduledAt: "2026-04-17T18:30:00Z",
    },
    {
        id: 502,
        title: "Revision sprint",
        course: "Audit & Assurance Masterclass",
        status: "scheduled" as const,
        scheduledAt: "2026-04-19T15:00:00Z",
    },
    {
        id: 503,
        title: "Past paper walkthrough",
        course: "Advanced Financial Management",
        status: "ended" as const,
        scheduledAt: "2026-04-08T17:00:00Z",
    },
    {
        id: 504,
        title: "Mock exam briefing",
        course: "Corporate Reporting Crash Course",
        status: "cancelled" as const,
        scheduledAt: "2026-04-05T17:00:00Z",
    },
]

export const chatMessages = [
    {
        id: 601,
        stream: "Weekly doubt clearing",
        user: "Aman Verma",
        message: "Can you explain the revenue recognition adjustment?",
        createdAt: "2026-04-17T18:41:00Z",
    },
    {
        id: 602,
        stream: "Weekly doubt clearing",
        user: "Sara Khan",
        message: "The chart examples on slide 12 were helpful.",
        createdAt: "2026-04-17T18:42:30Z",
    },
    {
        id: 603,
        stream: "Revision sprint",
        user: "Ritik Jain",
        message: "Can we get the practice set link again?",
        createdAt: "2026-04-16T15:11:00Z",
    },
]

export const quizzes = [
    {
        id: 701,
        title: "SBL Diagnostic Test",
        section: "Strategic analysis",
        type: "practice" as const,
        totalMarks: 40,
        passingMarks: 24,
        published: true,
    },
    {
        id: 702,
        title: "AFM Midterm",
        section: "Capital budgeting",
        type: "graded" as const,
        totalMarks: 60,
        passingMarks: 36,
        published: false,
    },
    {
        id: 703,
        title: "CR Final Mock",
        section: "Consolidation",
        type: "final" as const,
        totalMarks: 100,
        passingMarks: 60,
        published: true,
    },
]