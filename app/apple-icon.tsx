import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #2a35d6 0%, #3d61ff 55%, #0b82cf 100%)"
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: 68,
            fontWeight: 800,
            letterSpacing: -2,
            background: "rgba(255,255,255,0.14)"
          }}
        >
          RB
        </div>
      </div>
    ),
    size
  );
}
