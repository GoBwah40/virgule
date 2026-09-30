import { QRCodeSVG } from "qrcode.react";

import { cn } from "@/lib/utils";

type Props = {
  /** Texte encodé (en pratique, une URL absolue). */
  value: string;
  /** Description lue par les lecteurs d'écran. */
  label: string;
  className?: string;
};

// Exception à la règle des jetons : un QR code se scanne mal en couleurs inversées,
// il reste donc encre sur blanc, y compris en thème sombre.
const INK = "#2a1a24";
const PAPER = "#ffffff";

/** QR code carré qui s'adapte à la largeur disponible. */
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
