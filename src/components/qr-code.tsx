import { QRCodeSVG } from "qrcode.react";

import { cn } from "@/lib/utils";

type Props = {
  /** Encoded text (in practice, an absolute URL). */
  value: string;
  /** Description read by screen readers. */
  label: string;
  className?: string;
};

// Exception to the token rule: a QR code scans poorly with inverted colors,
// so it stays ink on white, dark theme included.
const INK = "#2a1a24";
const PAPER = "#ffffff";

/** Square QR code that fits the available width. */
export function QrCode({ value, label, className }: Props) {
  return (
    <div className={cn("rounded-xl p-3", className)} style={{ backgroundColor: PAPER }}>
      <QRCodeSVG
        value={value}
        title={label}
        role="img"
        aria-label={label}
        fgColor={INK}
        bgColor={PAPER}
        marginSize={0}
        className="block h-auto w-full"
      />
    </div>
  );
}
