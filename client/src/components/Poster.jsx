
import { useState } from "react";

// Shows the poster image, or a placeholder if there is none or it fails to load
export default function Poster({
  src,
  alt,
  height,
  width = "100%",
  fontSize = 48,
  radius = 0,
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        style={{
          width,
          height,
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          background: "linear-gradient(135deg, #2a2f4a, #ff4d6d55)",
        }}
      >
        🎬
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{ width, height, objectFit: "cover", borderRadius: radius, display: "block" }}
    />
  );
}