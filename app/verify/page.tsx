import VerifyOtpClient from "@/components/VerifyOtpClient";

type VerifyPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  return (
    <main className="page motion-page">
      <VerifyOtpClient initialEmail={params.email || ""} />
    </main>
  );
}
