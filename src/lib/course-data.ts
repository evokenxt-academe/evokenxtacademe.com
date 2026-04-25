export interface Course {
  slug: string;
  category: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  tutorInitials: string;
  tutor: string;
  rating: number;
  students: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  duration: string;
  chapters?: number;
  attemptType?: string;
  strengths?: string[];
  outcomes: string[];
  features: {
    duration: string;
    skillLevel: string;
    lectures: number;
    language: string;
  };
  videoUrl?: string;
  modules: {
    title: string;
    duration: string;
    lessons: {
      title: string;
      duration: string;
      isDemo?: boolean;
    }[];
  }[];
  instructor: {
    name: string;
    role: string;
    image: string;
    specialization: string;
    bio: string[];
    stats: {
      experience: string;
      students: string;
      positions: string;
    };
  };
  reviews: {
    name: string;
    role: string;
    avatar: string;
    rating: number;
    review: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

const COURSES: Course[] = [
  {
    slug: "sbr",
    category: "P-Level",
    title: "Strategic Business Reporting",
    description: "Master complex financial reporting standards, ethical frameworks, and professional judgment at the strategic level.",
    longDescription: "This course is designed to take your financial reporting skills to the highest professional level. You will learn how to analyze, evaluate, and resolve complex financial reporting issues in real-world business contexts. We cover all major accounting standards with a deep focus on strategic implications and ethical considerations.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&h=600&fit=crop",
    tutorInitials: "JS",
    tutor: "Jay Singh",
    rating: 5,
    students: "2.4k",
    price: 81,
    originalPrice: 95,
    discountPercentage: 15,
    duration: "120 hrs",
    chapters: 33,
    attemptType: "On-Demand CBE",
    strengths: [
      "SBR made simple for all students.",
      "Short, clear lectures with practice.",
      "Regular doubt solving and personal support.",
      "Fully exam-focused."
    ],
    outcomes: [
      "Master complex IFRS standards and principles",
      "Evaluate ethical issues in financial reporting",
      "Analyze and interpret financial statements",
      "Prepare group financial statements",
      "Assess the impact of changes in accounting regulation",
      "Communicate complex financial information clearly"
    ],
    features: {
      duration: "120 hours",
      skillLevel: "Advanced",
      lectures: 85,
      language: "English"
    },
    modules: [
      {
        title: "Management Information - MA1 (Urdu/Hindi) Free Demos",
        duration: "1.5 hours",
        lessons: [
          { title: "Conceptual Based Demo - 1", duration: "28.9 min", isDemo: true },
          { title: "Conceptual Based Demo - 2", duration: "28.2 min", isDemo: true },
          { title: "Practice Based Demo - 1", duration: "35.5 min", isDemo: true },
          { title: "Meet The Tutor", duration: "5.0 min", isDemo: true }
        ]
      },
      {
        title: "Learn about VIFHE",
        duration: "15 mins",
        lessons: []
      },
      {
        title: "Guidance Session",
        duration: "45 mins",
        lessons: []
      },
      {
        title: "Self-Paced Study Planner & Course Outline",
        duration: "10 mins",
        lessons: []
      }
    ],
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructor: {
      name: "Rameez Arain",
      role: "Teacher",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&h=200&fit=crop",
      specialization: "Subject Specialist – MA1, MA2, TX & ATX (Urdu | Hindi)",
      bio: [
        "18+ years of teaching experience.",
        "20+ global and nationwide positions.",
        "Expertise in bridging complex accounting theories with practical business applications."
      ],
      stats: {
        experience: "18+",
        students: "1000+",
        positions: "60+"
      }
    },
    reviews: [
      {
        name: "Sarah Jenkins",
        role: "Senior Accountant",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&fit=crop",
        rating: 5,
        review: "Incredible course! The instructor explains complex IFRS standards with such clarity. I passed my SBR exam on the first attempt with 78%."
      },
      {
        name: "Michael Chen",
        role: "Audit Manager",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&fit=crop",
        rating: 5,
        review: "The practical examples provided for consolidation and group accounts were exactly what I needed. Highly recommended for any ACCA student."
      }
    ],
    faqs: [
      {
        question: "Who is this course for?",
        answer: "This course is ideal for ACCA students at the Professional level looking to master Strategic Business Reporting."
      },
      {
        question: "Are there any prerequisites?",
        answer: "You should have completed or be exempt from the Applied Skills level Financial Reporting (FR) exam."
      },
      {
        question: "How long do I have access?",
        answer: "You get lifetime access to all course materials, including future updates."
      }
    ]
  },
  {
    slug: "apm",
    category: "P-Level",
    title: "Advanced Performance Management",
    description: "Apply strategic planning, performance measurement, and risk management techniques to real-world business scenarios.",
    longDescription: "Learn to evaluate business performance from a strategic perspective. This course covers everything from planning and control systems to economic value added and risk management. You'll develop the skills needed to advise management on business strategy and performance improvement.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&h=600&fit=crop",
    tutorInitials: "JS",
    tutor: "Jay Singh",
    rating: 5,
    students: "1.8k",
    price: 81,
    originalPrice: 95,
    discountPercentage: 15,
    duration: "110 hrs",
    chapters: 28,
    attemptType: "Computer Based Exam",
    strengths: [
      "APM techniques simplified with real-world cases.",
      "Extensive mock exams and past paper review.",
      "Direct mentor support until you pass.",
      "Strategic alignment focus."
    ],
    outcomes: [
      "Evaluate corporate performance",
      "Assess risk management frameworks",
      "Design performance measurement systems",
      "Advise on strategic business planning"
    ],
    features: {
      duration: "110 hours",
      skillLevel: "Advanced",
      lectures: 75,
      language: "English"
    },
    modules: [
      {
        title: "Section 1: Strategic Planning and Control",
        duration: "2.5 hours",
        lessons: [
          { title: "Strategic Management Accounting", duration: "45 mins", isDemo: true },
          { title: "Performance Hierarchy", duration: "60 mins" }
        ]
      }
    ],
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructor: {
      name: "Jay Singh",
      role: "Lead Performance Management Instructor",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&h=200&fit=crop",
      specialization: "Subject Specialist – APM & SBL",
      bio: [
        "15+ years of teaching experience.",
        "Expert in performance management and strategic planning."
      ],
      stats: {
        experience: "15+",
        students: "45k+",
        positions: "12"
      }
    },
    reviews: [],
    faqs: [
      {
        question: "What is the focus of this exam?",
        answer: "APM focuses on applying strategic management accounting techniques to evaluate and improve organizational performance."
      },
      {
        question: "Do I need to take Advanced Financial Management first?",
        answer: "No, APM can be taken independently of AFM."
      }
    ]
  }
];

export function getCourseBySlug(slug: string): Course | undefined {
  // If we can't find it, just return a mock so the page doesn't crash while developing
  return COURSES.find(c => c.slug === slug) || {
    ...COURSES[0],
    slug,
    title: `Course: ${slug.toUpperCase()}`
  };
}

export function getRecommendedCourses(slug: string): Course[] {
  return COURSES.filter(c => c.slug !== slug).slice(0, 3);
}
