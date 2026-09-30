import { ImageResponse } from "next/og";

import { COMMA_PATH } from "@/components/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Icône d'écran d'accueil iOS : même dessin que icon.svg, sans coins arrondis (iOS les applique).
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f26a2e" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path fill="#fff" transform="translate(-2 -9) scale(1.12)" d={COMMA_PATH} />
        </svg>
      </div>
    ),
    size,
  );
}
