import SculptureLoader from "@/components/SculptureLoader";

export default function Loading() {
  return (
    <main className="page motion-page">
      <div className="stack">
        <SculptureLoader lines={4} />
        <SculptureLoader lines={5} />
        <SculptureLoader lines={4} />
      </div>
    </main>
  );
}
