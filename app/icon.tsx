import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
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
            width: 370,
            height: 370,
            borderRadius: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: 190,
            fontWeight: 800,
            letterSpacing: -6,
            background: "rgba(255,255,255,0.12)",
            boxShadow: "inset 0 0 0 8px rgba(255,255,255,0.22)"
          }}
        >
          RB
        </div>
      </div>
    ),
    size
  );
}
