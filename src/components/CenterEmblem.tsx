import React from 'react';

interface EmblemProps {
  color: string;
  accent: string;
  size?: number;
}

export const CenterEmblem: React.FC<EmblemProps> = ({ color, accent, size = 54 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="شعار المركز الشامل لرعاية الطفل بدمنهور"
    >
      {/* Outer institutional octagram / double frame */}
      <circle cx="40" cy="40" r="36" stroke={color} strokeWidth="1.75" />
      <circle cx="40" cy="40" r="32" stroke={accent} strokeWidth="0.9" strokeDasharray="2.5 2.5" />

      {/* Protective arch / open book & child growth motif */}
      <path
        d="M22 49C22 41 29 36 40 36C51 36 58 41 58 49"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 53C27 49 34 49 40 53C46 49 53 49 60 53"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Stylized flourishing figure / sprout at center */}
      <circle cx="40" cy="24" r="4.5" fill={accent} />
      <path
        d="M40 30V45"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M32 34C34.5 32.5 37.5 32.5 40 34.5C42.5 32.5 45.5 32.5 48 34"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Subtle corner geometric accents */}
      <circle cx="40" cy="11" r="1.5" fill={accent} />
      <circle cx="40" cy="69" r="1.5" fill={accent} />
    </svg>
  );
};

interface StampProps {
  centerName: string;
  city: string;
  directorName: string;
  directorRole: string;
  phone: string;
  color: string;
}

export const CenterOfficialStamp: React.FC<StampProps> = ({
  centerName,
  city,
  directorName,
  directorRole,
  phone,
  color,
}) => {
  return (
    <div
      className="relative inline-flex items-center justify-center select-none pointer-events-none"
      style={{ transform: 'rotate(-6deg)' }}
    >
      <svg
        width="136"
        height="136"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-85"
      >
        <circle cx="80" cy="80" r="74" stroke={color} strokeWidth="2.4" />
        <circle cx="80" cy="80" r="68" stroke={color} strokeWidth="1" />
        <circle cx="80" cy="80" r="46" stroke={color} strokeWidth="1.2" strokeDasharray="3 2" />

        {/* Top & bottom curved guide paths */}
        <defs>
          <path id="stampTopArc" d="M 22,80 A 58,58 0 1,1 138,80" />
          <path id="stampBottomArc" d="M 136,88 A 56,56 0 0,1 24,88" />
        </defs>

        <text
          fill={color}
          fontSize="12.5"
          fontWeight="700"
          fontFamily="'IBM Plex Sans Arabic', sans-serif"
        >
          <textPath href="#stampTopArc" startOffset="50%" textAnchor="middle">
            {centerName}
          </textPath>
        </text>

        <text
          fill={color}
          fontSize="10.5"
          fontWeight="600"
          fontFamily="'IBM Plex Sans Arabic', sans-serif"
        >
          <textPath href="#stampBottomArc" startOffset="50%" textAnchor="middle">
            {city} · هاتف: {phone}
          </textPath>
        </text>

        {/* Center text block */}
        <text
          x="80"
          y="69"
          textAnchor="middle"
          fill={color}
          fontSize="10"
          fontWeight="700"
          fontFamily="'IBM Plex Sans Arabic', sans-serif"
        >
          الإدارة الفنية
        </text>
        <line x1="48" y1="76" x2="112" y2="76" stroke={color} strokeWidth="0.9" />
        <text
          x="80"
          y="91"
          textAnchor="middle"
          fill={color}
          fontSize="11"
          fontWeight="700"
          fontFamily="'IBM Plex Sans Arabic', sans-serif"
        >
          {directorName}
        </text>
        <text
          x="80"
          y="105"
          textAnchor="middle"
          fill={color}
          fontSize="8.5"
          fontWeight="600"
          fontFamily="'IBM Plex Sans Arabic', sans-serif"
        >
          {directorRole}
        </text>
      </svg>
    </div>
  );
};

interface SignatureProps {
  color: string;
}

export const SignatureFlourish: React.FC<SignatureProps> = ({ color }) => (
  <svg
    width="108"
    height="34"
    viewBox="0 0 120 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="opacity-85"
    aria-hidden="true"
  >
    <path
      d="M12 28C22 14 31 8 36 17C40 24 31 32 45 23C58 14 67 11 72 20C76 27 89 15 108 18"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M26 32C46 28 74 26 98 29"
      stroke={color}
      strokeWidth="1.1"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);
