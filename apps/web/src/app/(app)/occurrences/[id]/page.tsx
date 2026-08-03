import { redirect } from "next/navigation";

type OccurrenceDetailRedirectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OccurrenceDetailRedirectPage({
  params,
}: OccurrenceDetailRedirectPageProps) {
  const { id } = await params;
  redirect(`/stop-work/${id}`);
}
