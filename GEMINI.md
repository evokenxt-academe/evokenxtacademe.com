# Evoke EduGlobal Project Architecture

This project is built using Next.js (App Router) and follows a feature-driven architecture.

## Tech Stack
*   **Framework:** Next.js (React)
*   **Styling:** Tailwind CSS, PostCSS
*   **UI Components:** shadcn/ui (Radix UI primitives)
*   **Icons:** Tabler Icons, Lucide React
*   **Database & Auth:** Supabase
*   **State Management/Data Fetching:** React Query (TanStack Query)
*   **Email:** Brevo

## Directory Structure
*   `src/app/`: Next.js App Router pages and layouts. Divided by route groups (`(auth)`, `(dashboard)`, `(learn)`).
*   `src/components/`: Global UI components, shadcn/ui components (`src/components/ui/`), and shared layout elements (headers, footers, sections).
*   `src/features/`: Feature-driven modules. Each feature (e.g., `admin`, `auth`, `courses`, `live-stream`) encapsulates its own components, data fetching, types, and utilities to maintain separation of concerns.
*   `src/hooks/`: Global custom React hooks.
*   `src/lib/`: Core library configurations and third-party integrations (e.g., `supabase/`, `brevo.ts`, `utils.ts`).
*   `src/types/`: Global TypeScript definitions, including Supabase database types.
*   `src/utils/`: Utility functions and helpers.
