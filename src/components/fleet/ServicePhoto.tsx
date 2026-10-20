"use client";

import { useId } from "react";
import type { FleetPhoto, PhotoKind } from "@/data/fleetDemoData";

function stamp(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Odometer({ photo }: { photo: FleetPhoto }) {
  const digits = String(photo.mileage ?? 0).padStart(6, "0");
  return (
    <>
      <rect width="320" height="240" fill="#111827" />
      <circle cx="160" cy="250" r="190" fill="#1f2937" />
      <rect x="70" y="92" width="180" height="56" rx="8" fill="#0b1f16" stroke="#374151" strokeWidth="3" />
      <text x="160" y="132" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="34" fontWeight="700" fill="#4ade80" letterSpacing="3">
        {digits}
      </text>
      <text x="238" y="142" textAnchor="end" fontFamily="system-ui" fontSize="10" fill="#4ade80" opacity="0.7">mi</text>
      <text x="160" y="80" textAnchor="middle" fontFamily="system-ui" fontSize="11" fill="#9ca3af" letterSpacing="2">ODO</text>
    </>
  );
}

function Part({ photo }: { photo: FleetPhoto }) {
  return (
    <>
      <rect width="320" height="240" fill="#57534e" />
      <rect y="170" width="320" height="70" fill="#44403c" />
      <rect x="44" y="62" width="128" height="120" rx="6" fill="#1d4ed8" />
      <rect x="44" y="62" width="128" height="28" rx="6" fill="#1e3a8a" />
      <text x="108" y="82" textAnchor="middle" fontFamily="system-ui" fontSize="13" fontWeight="800" fill="#fff">{photo.brand}</text>
      <text x="108" y="130" textAnchor="middle" fontFamily="system-ui" fontSize="15" fontWeight="800" fill="#fff">{photo.partNumber}</text>
      <text x="108" y="152" textAnchor="middle" fontFamily="system-ui" fontSize="9" fill="#bfdbfe">GENUINE PART</text>
      <rect x="196" y="88" width="76" height="96" rx="10" fill="#e5e7eb" />
      <rect x="196" y="88" width="76" height="16" rx="6" fill="#9ca3af" />
      <rect x="204" y="118" width="60" height="5" fill="#d1d5db" />
      <rect x="204" y="132" width="60" height="5" fill="#d1d5db" />
      <rect x="204" y="146" width="60" height="5" fill="#d1d5db" />
    </>
  );
}

function Invoice({ photo }: { photo: FleetPhoto }) {
  return (
    <>
      <rect width="320" height="240" fill="#78716c" />
      <g transform="rotate(-4 160 120)">
        <rect x="70" y="14" width="180" height="222" fill="#fafaf9" />
        <text x="84" y="40" fontFamily="system-ui" fontSize="11" fontWeight="800" fill="#111">{photo.shop}</text>
        <text x="84" y="54" fontFamily="system-ui" fontSize="8" fill="#6b7280">
          INVOICE · {photo.date ? stamp(photo.date) : ""}
        </text>
        <line x1="84" y1="62" x2="236" y2="62" stroke="#d6d3d1" />
        {(photo.lines ?? []).map((line, i) => (
          <text key={i} x="84" y={80 + i * 16} fontFamily="system-ui" fontSize="8.5" fill="#374151">{line}</text>
        ))}
        <line x1="84" y1="182" x2="236" y2="182" stroke="#d6d3d1" />
        <text x="84" y="200" fontFamily="system-ui" fontSize="10" fontWeight="700" fill="#111">TOTAL</text>
        <text x="236" y="200" textAnchor="end" fontFamily="system-ui" fontSize="12" fontWeight="800" fill="#111">
          ${((photo.total ?? 0) / 100).toFixed(2)}
        </text>
      </g>
    </>
  );
}

function Tire({ photo }: { photo: FleetPhoto }) {
  const pathId = useId();
  return (
    <>
      <rect width="320" height="240" fill="#374151" />
      <circle cx="160" cy="250" r="200" fill="#111827" />
      <circle cx="160" cy="250" r="140" fill="#1f2937" />
      <circle cx="160" cy="250" r="96" fill="#9ca3af" />
      <path id={pathId} d="M 50 250 A 110 110 0 0 1 270 250" fill="none" />
      <text fontFamily="system-ui" fontSize="16" fontWeight="800" fill="#d1d5db" letterSpacing="2">
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">{photo.tireSize}</textPath>
      </text>
      <rect x="196" y="28" width="104" height="44" rx="8" fill="#fbbf24" />
      <text x="248" y="48" textAnchor="middle" fontFamily="system-ui" fontSize="9" fontWeight="700" fill="#78350f">TREAD</text>
      <text x="248" y="64" textAnchor="middle" fontFamily="system-ui" fontSize="15" fontWeight="800" fill="#451a03">{photo.treadDepth}</text>
    </>
  );
}

function Brake({ photo }: { photo: FleetPhoto }) {
  const worn = (photo.padMm ?? 10) < 5;
  return (
    <>
      <rect width="320" height="240" fill="#292524" />
      <circle cx="140" cy="130" r="92" fill="#a8a29e" />
      <circle cx="140" cy="130" r="80" fill="#78716c" />
      <circle cx="140" cy="130" r="34" fill="#44403c" />
      <rect x="196" y="70" width="40" height="120" rx="10" fill="#b91c1c" />
      <rect x="186" y="84" width={Math.max(4, (photo.padMm ?? 10) * 1.2)} height="92" fill="#57534e" />
      <rect x="226" y="18" width="80" height="44" rx="8" fill={worn ? "#dc2626" : "#16a34a"} />
      <text x="266" y="38" textAnchor="middle" fontFamily="system-ui" fontSize="9" fontWeight="700" fill="#fff">PAD</text>
      <text x="266" y="54" textAnchor="middle" fontFamily="system-ui" fontSize="15" fontWeight="800" fill="#fff">{photo.padMm} mm</text>
    </>
  );
}

function Damage() {
  return (
    <>
      <rect width="320" height="240" fill="#d1d5db" />
      <rect x="0" y="40" width="320" height="160" fill="#f3f4f6" />
      <rect x="0" y="150" width="320" height="10" fill="#6b7280" />
      <rect x="120" y="50" width="4" height="140" fill="#9ca3af" />
      <circle cx="190" cy="155" r="14" fill="#374151" />
      <circle cx="190" cy="155" r="6" fill="#9ca3af" />
      <circle cx="190" cy="155" r="32" fill="none" stroke="#dc2626" strokeWidth="4" />
    </>
  );
}

const RENDERERS: Record<PhotoKind, (props: { photo: FleetPhoto }) => React.JSX.Element> = {
  odometer: Odometer,
  part: Part,
  invoice: Invoice,
  tire: Tire,
  brake: Brake,
  damage: Damage,
};

export function ServicePhoto({
  photo,
  takenAt,
  showCaption = false,
  className = "",
}: {
  photo: FleetPhoto;
  takenAt: Date;
  showCaption?: boolean;
  className?: string;
}) {
  const fxId = useId();

  if (photo.src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo.src} alt={photo.caption} className={`h-full w-full object-cover ${className}`} />;
  }

  const Renderer = RENDERERS[photo.kind];
  return (
    <svg viewBox="0 0 320 240" role="img" aria-label={photo.caption} className={`h-full w-full ${className}`}>
      <defs>
        <radialGradient id={`${fxId}-v`} cx="50%" cy="45%" r="75%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
        <filter id={`${fxId}-g`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.18 0" />
        </filter>
      </defs>
      <g transform="rotate(-1.2 160 120) scale(1.03) translate(-5 -4)">
        <Renderer photo={photo} />
      </g>
      <rect width="320" height="240" fill={`url(#${fxId}-v)`} />
      <rect width="320" height="240" filter={`url(#${fxId}-g)`} />
      <text x="308" y="230" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="11" fill="#fbbf24" opacity="0.9">
        {stamp(takenAt)}
      </text>
      {showCaption && (
        <text x="12" y="230" fontFamily="system-ui" fontSize="11" fill="#fff">
          {photo.caption}
        </text>
      )}
    </svg>
  );
}
