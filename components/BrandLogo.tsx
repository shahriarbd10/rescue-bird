export default function BrandLogo({ size = 34, color }: { size?: number; color?: string }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: color || "linear-gradient(135deg, #0b67c1, #0797cb)",
        color: "white",
        fontWeight: 800,
        fontSize: size * 0.4,
        boxShadow: "0 8px 18px rgba(6, 63, 119, 0.3)",
        flexShrink: 0
      }}
      aria-label="Rescue Bird logo"
    >
      RB
    </span>
  );
}
