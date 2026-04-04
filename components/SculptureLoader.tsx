export default function SculptureLoader({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-title" />
      {Array.from({ length: lines }).map((_, idx) => (
        <div key={idx} className="skeleton skeleton-line" />
      ))}
    </div>
  );
}
