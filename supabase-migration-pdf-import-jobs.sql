-- ============================================================
-- Evoke EduGlobal — PDF Import Jobs
-- Tracks PDF-to-Quiz imports for support & auditing.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pdf_import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'done', 'failed')) DEFAULT 'pending',
    total_extracted INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdf_import_jobs_quiz_id ON public.pdf_import_jobs(quiz_id);
CREATE INDEX IF NOT EXISTS idx_pdf_import_jobs_status ON public.pdf_import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pdf_import_jobs_created_at ON public.pdf_import_jobs(created_at DESC);

ALTER TABLE public.pdf_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pdf_import_jobs"
    ON public.pdf_import_jobs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'instructor')
        )
    );

