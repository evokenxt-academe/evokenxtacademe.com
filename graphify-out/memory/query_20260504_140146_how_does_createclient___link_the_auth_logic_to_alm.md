---
type: "query"
date: "2026-05-04T14:01:46.911417+00:00"
question: "How does createClient() link the Auth logic to almost every UI page?"
contributor: "graphify"
source_nodes: ["createClient", "DashboardLayout", "ProfilePage", "useCourseContent", "getUserProfile"]
---

# Q: How does createClient() link the Auth logic to almost every UI page?

## Answer

The createClient() node is the primary factory for Supabase client instances, serving as the connective tissue between authentication logic and the UI. In the Next.js App Router architecture, it is invoked within root and feature-specific layouts (e.g., DashboardLayout, LearnLayout) to verify sessions and inject user context before pages render. It bridges to individual pages (DashboardPage, ProfilePage, QuizPage, etc.) by providing the authenticated client needed for server-side data fetching. Furthermore, it powers the application's hook system (e.g., useCourseContent, useLectureProgress) and API services (e.g., getUserProfile, saveAnswer), ensuring that every data interaction is scoped to the authenticated user. This single node essentially enforces the security perimeter for the entire frontend and API layer.

## Source Nodes

- createClient
- DashboardLayout
- ProfilePage
- useCourseContent
- getUserProfile