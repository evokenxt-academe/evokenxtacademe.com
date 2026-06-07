import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";

/**
 * Process pending bank import jobs through extract → parse → commit pipeline
 * POST /api/admin/quiz-builder/process-imports
 * Body: { subjectId: string, jobIds?: string[] }
 */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"]);
    if ("error" in auth) return auth.error;

    const { supabase } = auth;
    const body = await request.json();
    const { subjectId, jobIds } = body;

    if (!subjectId) {
        return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }

    try {
        // Get pending import jobs
        let query = supabase
            .from("bank_import_jobs")
            .select("*")
            .eq("subject_id", subjectId)
            .eq("status", "pending");

        if (jobIds && jobIds.length > 0) {
            query = query.in("id", jobIds);
        }

        const { data: jobs, error: jobsError } = await query.order("created_at", { ascending: true });

        if (jobsError) {
            return NextResponse.json({ error: jobsError.message }, { status: 500 });
        }

        if (!jobs || jobs.length === 0) {
            return NextResponse.json({ processed: 0, results: [], message: "No pending jobs found" });
        }

        const baseUrl = request.headers.get("x-forwarded-proto")
            ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
            : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const results: any[] = [];
        const headers = { "Content-Type": "application/json" };

        for (const job of jobs) {
            const jobResult: any = { jobId: job.id, steps: {} };

            try {
                // Step 1: Extract (if not already done)
                if (!job.extracted_text) {
                    jobResult.steps.extract = "starting";
                    const extractRes = await fetch(`${baseUrl}/api/bank/import/extract`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({ jobId: job.id }),
                    });

                    if (!extractRes.ok) {
                        const err = await extractRes.json().catch(() => ({}));
                        jobResult.steps.extract = "failed";
                        jobResult.error = `Extract failed: ${err.error || "unknown error"}`;
                        results.push(jobResult);
                        continue;
                    }

                    jobResult.steps.extract = "completed";
                } else {
                    jobResult.steps.extract = "skipped";
                }

                // Step 2: Parse
                jobResult.steps.parse = "starting";
                const parseRes = await fetch(`${baseUrl}/api/bank/import/parse`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ jobId: job.id }),
                });

                if (!parseRes.ok) {
                    const err = await parseRes.json().catch(() => ({}));
                    jobResult.steps.parse = "failed";
                    jobResult.error = `Parse failed: ${err.error || "unknown error"}`;
                    results.push(jobResult);
                    continue;
                }

                jobResult.steps.parse = "completed";
                const parseData = await parseRes.json();
                jobResult.questionsFound = parseData.total_found || 0;

                // Step 3: Commit (auto-import all questions)
                jobResult.steps.commit = "starting";
                const commitRes = await fetch(`${baseUrl}/api/bank/import/commit`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ jobId: job.id, selectedIndices: null }), // null = all questions
                });

                if (!commitRes.ok) {
                    const err = await commitRes.json().catch(() => ({}));
                    jobResult.steps.commit = "failed";
                    jobResult.error = `Commit failed: ${err.error || "unknown error"}`;
                    results.push(jobResult);
                    continue;
                }

                const commitData = await commitRes.json();
                jobResult.steps.commit = "completed";
                jobResult.imported = commitData.imported || 0;
                jobResult.duplicates = commitData.duplicates || 0;
                jobResult.failed = commitData.failed || 0;
                jobResult.status = "completed";
            } catch (err: any) {
                jobResult.status = "error";
                jobResult.error = err.message;
            }

            results.push(jobResult);
        }

        return NextResponse.json({
            processed: results.length,
            results,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
