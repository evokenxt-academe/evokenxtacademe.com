import { redirect } from "next/navigation";

interface LiveLearnPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LiveLearnRedirectPage({ params }: LiveLearnPageProps) {
  const { slug } = await params;
  redirect(`/learn/${slug}/live`);
}
