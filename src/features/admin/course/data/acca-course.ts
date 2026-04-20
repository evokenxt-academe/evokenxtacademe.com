/**
 * ACCA Course Structure — Pre-built seed data for LMS.
 *
 * This mirrors the official ACCA qualification pathway:
 * - Applied Knowledge (3 papers)
 * - Applied Skills (6 papers)
 * - Strategic Professional (4 essential + 4 options)
 */

import type { CourseFormData, Section, Lecture } from "../types/course"

// ─────────────────────────────────────────────────────────────
// ACCA Paper definitions
// ─────────────────────────────────────────────────────────────

interface ACCAPaper {
    code: string
    name: string
    description: string
    topics: string[]
    difficulty: "knowledge" | "skills" | "professional"
    suggestedOrder: number
}

const APPLIED_KNOWLEDGE: ACCAPaper[] = [
    {
        code: "BT",
        name: "Business and Technology",
        description: "Understand how businesses operate, the role of technology, and key governance principles. Foundation paper for all ACCA students.",
        topics: [
            "Business organisation and structure",
            "Stakeholders and governance",
            "Information technology and systems",
            "Leading and managing individuals and teams",
            "Personal effectiveness and communication",
        ],
        difficulty: "knowledge",
        suggestedOrder: 1,
    },
    {
        code: "MA",
        name: "Management Accounting",
        description: "Learn how organisations use management accounting to plan, control, and make decisions. Covers budgeting, costing, and performance measurement.",
        topics: [
            "Cost classification and behaviour",
            "Material, labour, and overhead costing",
            "Budgeting and standard costing",
            "Variance analysis",
            "Performance measurement",
        ],
        difficulty: "knowledge",
        suggestedOrder: 2,
    },
    {
        code: "FA",
        name: "Financial Accounting",
        description: "Learn how to prepare financial statements for sole traders, partnerships, and companies using double-entry bookkeeping.",
        topics: [
            "Double-entry bookkeeping principles",
            "Trial balance and accounting adjustments",
            "Preparing financial statements",
            "Accounting for partnerships",
            "Introduction to company accounts",
        ],
        difficulty: "knowledge",
        suggestedOrder: 3,
    },
]

const APPLIED_SKILLS: ACCAPaper[] = [
    {
        code: "LW",
        name: "Corporate and Business Law",
        description: "Understand essential legal frameworks for businesses — contracts, company law, employment law, and corporate governance.",
        topics: [
            "Law of contract",
            "Employment law",
            "Company formation and constitution",
            "Capital and financing",
            "Corporate governance and ethics",
        ],
        difficulty: "skills",
        suggestedOrder: 4,
    },
    {
        code: "PM",
        name: "Performance Management",
        description: "Advanced management accounting techniques for decision-making, cost management, and performance evaluation.",
        topics: [
            "Activity-based costing",
            "Target and lifecycle costing",
            "Relevant costing for decisions",
            "Budgeting and control",
            "Divisional performance and transfer pricing",
        ],
        difficulty: "skills",
        suggestedOrder: 5,
    },
    {
        code: "TX",
        name: "Taxation",
        description: "Learn the core principles of income tax, corporation tax, capital gains tax, VAT, and national insurance.",
        topics: [
            "Income tax computation",
            "Employment income and benefits",
            "Capital gains tax",
            "Corporation tax",
            "VAT principles and computation",
        ],
        difficulty: "skills",
        suggestedOrder: 6,
    },
    {
        code: "FR",
        name: "Financial Reporting",
        description: "Prepare and interpret financial statements using International Financial Reporting Standards (IFRS). Covers single entities and groups.",
        topics: [
            "Conceptual framework of accounting",
            "Key IFRS standards (IAS 16, IFRS 15, IFRS 16, etc.)",
            "Group financial statements",
            "Consolidated statement of financial position",
            "Interpretation and analysis of financial statements",
        ],
        difficulty: "skills",
        suggestedOrder: 7,
    },
    {
        code: "AA",
        name: "Audit and Assurance",
        description: "Understand the audit process, professional ethics, audit planning, evidence gathering, and reporting.",
        topics: [
            "Audit framework and regulation",
            "Planning and risk assessment",
            "Internal controls and testing",
            "Audit evidence and procedures",
            "Review, reporting, and quality control",
        ],
        difficulty: "skills",
        suggestedOrder: 8,
    },
    {
        code: "FM",
        name: "Financial Management",
        description: "Financial decision-making for businesses — investment appraisal, working capital, cost of capital, and financial risk.",
        topics: [
            "Financial management objectives",
            "Investment appraisal (NPV, IRR, payback)",
            "Working capital management",
            "Business finance and cost of capital",
            "Financial risk management",
        ],
        difficulty: "skills",
        suggestedOrder: 9,
    },
]

const STRATEGIC_ESSENTIAL: ACCAPaper[] = [
    {
        code: "SBL",
        name: "Strategic Business Leader",
        description: "Integrated case study exam testing leadership, strategy, governance, risk, technology, and innovation in a real-world business scenario.",
        topics: [
            "Leadership and governance",
            "Strategy formulation and implementation",
            "Risk management",
            "Technology and innovation",
            "Organisational change and project management",
        ],
        difficulty: "professional",
        suggestedOrder: 10,
    },
    {
        code: "SBR",
        name: "Strategic Business Reporting",
        description: "Advanced financial reporting — complex group structures, current issues in reporting, and ethical considerations.",
        topics: [
            "Professional and ethical duties of the accountant",
            "Reporting revenue, financial instruments, and provisions",
            "Group accounting (complex structures)",
            "Current reporting issues",
            "Analysis and interpretation",
        ],
        difficulty: "professional",
        suggestedOrder: 11,
    },
]

const STRATEGIC_OPTIONS: ACCAPaper[] = [
    {
        code: "AFM",
        name: "Advanced Financial Management",
        description: "Advanced investment, financing, and risk management — international finance, treasury, and M&A.",
        topics: [
            "Advanced investment appraisal",
            "Mergers, acquisitions, and valuations",
            "Treasury and working capital",
            "International financial management",
            "Financial risk management (derivatives)",
        ],
        difficulty: "professional",
        suggestedOrder: 12,
    },
    {
        code: "APM",
        name: "Advanced Performance Management",
        description: "Strategic performance measurement — balanced scorecard, benchmarking, and information systems for decision-making.",
        topics: [
            "Strategic planning and control",
            "Performance measurement frameworks",
            "Risk, environmental, and quality management",
            "Information systems and big data",
            "Performance evaluation of responsibility centres",
        ],
        difficulty: "professional",
        suggestedOrder: 13,
    },
    {
        code: "ATX",
        name: "Advanced Taxation",
        description: "Complex tax planning for individuals and businesses — inheritance, cross-border, trusts, and tax-efficient strategies.",
        topics: [
            "Personal tax planning (income, CGT, IHT)",
            "Corporate tax planning",
            "Business disposals and reconstructions",
            "Cross-border tax issues",
            "Trusts and tax-efficient investment",
        ],
        difficulty: "professional",
        suggestedOrder: 14,
    },
    {
        code: "AAA",
        name: "Advanced Audit and Assurance",
        description: "Complex audit scenarios — planning, evidence evaluation, ethical challenges, and current issues in auditing.",
        topics: [
            "Regulatory environment and professional obligations",
            "Planning, risk, and materiality",
            "Audit evidence and specific items",
            "Review and quality management",
            "Current issues and developments in auditing",
        ],
        difficulty: "professional",
        suggestedOrder: 15,
    },
]

// ─────────────────────────────────────────────────────────────
// Build ACCA section from papers
// ─────────────────────────────────────────────────────────────

function buildSectionFromPapers(
    levelTitle: string,
    papers: ACCAPaper[],
    position: number
): Section {
    const sectionId = crypto.randomUUID()

    const lectures: Lecture[] = papers.map((paper, index) => ({
        id: crypto.randomUUID(),
        sectionId,
        title: `${paper.code} — ${paper.name}`,
        videoUrl: "",
        description: `${paper.description}\n\nKey Topics:\n${paper.topics.map(t => `• ${t}`).join("\n")}`,
        durationSec: 0,
        position: index,
        isPreview: index === 0, // First paper as free preview
        resources: [],
    }))

    return {
        id: sectionId,
        courseId: "",
        title: levelTitle,
        position,
        lectures,
        isCollapsed: false,
    }
}

// ─────────────────────────────────────────────────────────────
// Get pre-built ACCA course form data
// ─────────────────────────────────────────────────────────────

export function getACCACourseData(): CourseFormData {
    return {
        name: "ACCA Complete Professional Qualification",
        slug: "acca-complete-professional-qualification",
        description:
            "Master the complete ACCA qualification pathway — from Applied Knowledge to Strategic Professional level. " +
            "This comprehensive course covers all 13 papers across 3 levels, preparing you for the Association of Chartered Certified Accountants (ACCA) exams.\n\n" +
            "What you'll learn:\n" +
            "• Applied Knowledge: BT, MA, FA — build your accounting foundation\n" +
            "• Applied Skills: LW, PM, TX, FR, AA, FM — develop technical expertise\n" +
            "• Strategic Professional: SBL, SBR + 2 optional papers — master strategic thinking\n\n" +
            "Recommended study order follows the official ACCA pathway for optimal learning progression.",
        level: "knowledge",
        thumbnailUrl: "",
        thumbnailFile: null,
        instructorId: "",
        sections: [
            buildSectionFromPapers(
                "Level 1 — Applied Knowledge",
                APPLIED_KNOWLEDGE,
                0
            ),
            buildSectionFromPapers(
                "Level 2 — Applied Skills",
                APPLIED_SKILLS,
                1
            ),
            buildSectionFromPapers(
                "Level 3 — Strategic Professional (Essential)",
                STRATEGIC_ESSENTIAL,
                2
            ),
            buildSectionFromPapers(
                "Level 3 — Strategic Professional (Options — Choose Any 2)",
                STRATEGIC_OPTIONS,
                3
            ),
        ],
        price: 49999,
        discountPrice: 29999,
        status: "draft",
    }
}

// ─────────────────────────────────────────────────────────────
// JSON structure for API / LMS integration
// ─────────────────────────────────────────────────────────────

export const ACCA_COURSE_JSON = {
    course: {
        name: "ACCA Complete Professional Qualification",
        slug: "acca-complete-professional-qualification",
        description: "Master the complete ACCA qualification pathway — from Applied Knowledge to Strategic Professional level.",
        level: "knowledge",
        price: 49999,
        discountPrice: 29999,
        currency: "INR",
    },
    levels: [
        {
            name: "Applied Knowledge",
            position: 0,
            papers: APPLIED_KNOWLEDGE,
        },
        {
            name: "Applied Skills",
            position: 1,
            papers: APPLIED_SKILLS,
        },
        {
            name: "Strategic Professional (Essential)",
            position: 2,
            papers: STRATEGIC_ESSENTIAL,
        },
        {
            name: "Strategic Professional (Options)",
            position: 3,
            papers: STRATEGIC_OPTIONS,
        },
    ],
    recommendedOrder: [
        "BT → MA → FA (Knowledge)",
        "LW → PM → TX → FR → AA → FM (Skills)",
        "SBL → SBR (Essential)",
        "Choose 2 from: AFM / APM / ATX / AAA (Options)",
    ],
}
