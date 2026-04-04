import SculptureLoader from "@/components/SculptureLoader";

export default function Loading() {
  return (
    <main className="page stack motion-page">
      <SculptureLoader lines={4} />
      <SculptureLoader lines={4} />
    </main>
  );
}
