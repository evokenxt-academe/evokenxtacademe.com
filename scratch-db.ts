dimport dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set in environment!");
    process.exit(1);
  }
  
  let pgClient: any;
  try {
    const { default: postgres } = await import("postgres");
    console.log("Using 'postgres' package...");
    pgClient = postgres(dbUrl);
  } catch (e: any) {
    console.log("postgres module not found, attempting 'pg'...");
    try {
      const { default: pg } = await import("pg");
      pgClient = new pg.Client({ connectionString: dbUrl });
      await pgClient.connect();
    } catch (err: any) {
      console.error("Failed to load both postgres and pg clients:", err.message);
      process.exit(1);
    }
  }

  const sqlStatements = [
    // 1. Fix is_admin() function to check role = 'admin' or fallback email
    `CREATE OR REPLACE FUNCTION public.is_admin()
     RETURNS BOOLEAN AS $$
       SELECT 
         (auth.jwt() ->> 'email') = 'amarbiradar147@gmail.com'
         OR EXISTS (
           SELECT 1 FROM public.users
           WHERE id = auth.uid() AND role = 'admin'
         );
     $$ LANGUAGE sql STABLE SECURITY DEFINER;`,

    // 2. Add SELECT policies on public.users table to let anon and authenticated users read instructors/admins
    `DROP POLICY IF EXISTS "read_instructors_and_admins" ON public.users;`,
    `CREATE POLICY "read_instructors_and_admins" ON public.users
     FOR SELECT TO anon, authenticated
     USING (role IN ('instructor', 'admin'));`,

    // 3. Add SELECT policies on public.users table to let instructors select all users
    `DROP POLICY IF EXISTS "instructor_select_all_users" ON public.users;`,
    `CREATE POLICY "instructor_select_all_users" ON public.users
     FOR SELECT TO authenticated
     USING (public.is_instructor());`,

    // 4. Add SELECT policies on public.courses table to let instructors see all courses
    `DROP POLICY IF EXISTS "instructor_read_all_courses" ON public.courses;`,
    `CREATE POLICY "instructor_read_all_courses" ON public.courses
     FOR SELECT TO authenticated
     USING (public.is_instructor());`,

    // 5. Add SELECT policies on public.enrollments table to let instructors see all enrollments
    `DROP POLICY IF EXISTS "instructor_read_all_enrollments" ON public.enrollments;`,
    `CREATE POLICY "instructor_read_all_enrollments" ON public.enrollments
     FOR SELECT TO authenticated
     USING (public.is_instructor());`,

    // 6. Add SECURITY DEFINER to sync_course_student_count() trigger function
    `CREATE OR REPLACE FUNCTION public.sync_course_student_count()
     RETURNS TRIGGER AS $$
     DECLARE
       v_course_id UUID;
     BEGIN
       v_course_id := COALESCE(NEW.course_id, OLD.course_id);

       UPDATE public.courses
       SET total_students = (
         SELECT COUNT(*)
         FROM public.enrollments
         WHERE course_id = v_course_id
           AND status = 'active'
       )
       WHERE id = v_course_id;

       RETURN COALESCE(NEW, OLD);
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    // 7. Add SECURITY DEFINER to sync_course_avg_rating() trigger function
    `CREATE OR REPLACE FUNCTION public.sync_course_avg_rating()
     RETURNS TRIGGER AS $$
     DECLARE
       v_course_id UUID;
     BEGIN
       v_course_id := COALESCE(NEW.course_id, OLD.course_id);

       UPDATE public.courses
       SET avg_rating = (
         SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0)
         FROM public.reviews
         WHERE course_id = v_course_id
           AND is_approved = TRUE
       )
       WHERE id = v_course_id;

       RETURN COALESCE(NEW, OLD);
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;`
  ];

  console.log("Executing SQL statements...");
  for (const statement of sqlStatements) {
    try {
      if (typeof pgClient === 'function') {
        // postgres package
        await pgClient.unsafe(statement);
      } else {
        // pg package
        await pgClient.query(statement);
      }
      console.log("SUCCESS:", statement.substring(0, 80).replace(/\n/g, ' ') + "...");
    } catch (err: any) {
      console.error("ERROR executing statement:", err.message);
    }
  }

  if (typeof pgClient === 'function') {
    await pgClient.end();
  } else {
    await pgClient.end();
  }
  console.log("Done.");
}

main().catch(console.error);
