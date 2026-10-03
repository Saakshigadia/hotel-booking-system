// Simple illustrated "photo" for each room type, so the site needs no image files.
const PALETTES = {
  standard: ['#e9dcc4', '#c9b28c', '#7d6a4f'],
  deluxe: ['#d8e3d2', '#9fb89a', '#45634a'],
  suite: ['#ead6c8', '#c7957c', '#7a4433'],
  family: ['#dbe1ea', '#9fb0c8', '#46597a'],
};

export default function RoomArt({ type = 'standard', className = '' }) {
  const [wall, mid, deep] = PALETTES[type] || PALETTES.standard;
  return (
    <svg className={`room-art ${className}`} viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${type} room illustration`}>
      <rect width="400" height="260" fill={wall} />
      <path d="M150 40 h100 v110 h-100 z M150 40 a50 50 0 0 1 100 0" fill="#f6efe2" />
      <path d="M160 150 V45 a40 40 0 0 1 80 0 V150 z" fill={mid} opacity=".55" />
      <circle cx="222" cy="68" r="10" fill="#f6d68a" />
      <rect x="0" y="200" width="400" height="60" fill={deep} opacity=".25" />
      <rect x="70" y="150" width="200" height="56" rx="8" fill="#fbf7ef" />
      <rect x="70" y="138" width="200" height="22" rx="8" fill={deep} />
      <rect x="86" y="128" width="62" height="22" rx="10" fill="#fffaf2" />
      <rect x="192" y="128" width="62" height="22" rx="10" fill="#fffaf2" />
      <rect x="290" y="170" width="44" height="36" rx="4" fill={deep} opacity=".7" />
      <path d="M312 170 v-26 m-10 0 h20 l-4 -14 h-12 z" stroke={deep} strokeWidth="3" fill="#f6efe2" />
      {type === 'family' && <rect x="86" y="190" width="168" height="10" rx="4" fill={mid} />}
      {type === 'suite' && <path d="M20 200 q20 -40 40 0" stroke={deep} strokeWidth="6" fill="none" />}
    </svg>
  );
}
