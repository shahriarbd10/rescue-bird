export default function BrandLogo({ size = 34 }: { size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0b67c1, #0797cb)",
        color: "white",
        fontWeight: 800,
        boxShadow: "0 8px 18px rgba(6, 63, 119, 0.3)"
      }}
      aria-label="Rescue Bird logo"
    >
      RB
    </span>
  );
}
