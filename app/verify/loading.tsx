import SculptureLoader from "@/components/SculptureLoader";

export default function Loading() {
  return (
    <main className="page">
      <div className="auth-wrap">
        <SculptureLoader lines={4} />
        <SculptureLoader lines={5} />
      </div>
    </main>
  );
}
