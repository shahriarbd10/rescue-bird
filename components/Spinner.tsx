export default function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="spinner-wrap" role="status" aria-live="polite" aria-label={label}>
      <span className="spinner" />
      <span>{label}</span>
    </span>
  );
}
