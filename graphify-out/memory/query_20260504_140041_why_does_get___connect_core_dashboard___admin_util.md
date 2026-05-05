---
type: "query"
date: "2026-05-04T14:00:41.725422+00:00"
question: "Why does GET() connect Core Dashboard & Admin Utilities to Course Management API, Student Attempt & Profile API, and many others?"
contributor: "graphify"
source_nodes: ["GET", "requireAdmin", "createLookupMap", "resolveCourseRecord", "adminFetch"]
---

# Q: Why does GET() connect Core Dashboard & Admin Utilities to Course Management API, Student Attempt & Profile API, and many others?

## Answer

The GET() node acts as a cross-community bridge because it represents the universal request handler pattern across the application's Next.js API routes. It connects to 'Core Dashboard & Admin Utilities' through authorization guards like requireAdmin() and admin-specific fetchers. It bridges to the 'Course Management' and 'Student Attempt' APIs as the primary entry point for retrieving course data, attempt results, and analytics. Furthermore, it depends on 'Data Normalization Services' (e.g., createLookupMap, computeMonthlySeries) to process raw database outputs, making it the central architectural junction where authorization, data retrieval, and data transformation intersect.

## Source Nodes

- GET
- requireAdmin
- createLookupMap
- resolveCourseRecord
- adminFetch