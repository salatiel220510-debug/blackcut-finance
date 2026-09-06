export default function LogoBCFinanceSVG() {
  return (
    <svg viewBox="0 0 800 800" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bc-gold-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#996515" />
          <stop offset="25%" stopColor="#FFDF73" />
          <stop offset="50%" stopColor="#DAA520" />
          <stop offset="75%" stopColor="#FFF8DC" />
          <stop offset="100%" stopColor="#8B6508" />
        </linearGradient>

        <linearGradient id="bc-silver-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#707070" />
          <stop offset="50%" stopColor="#E0E0E0" />
          <stop offset="100%" stopColor="#A9A9A9" />
        </linearGradient>

        <radialGradient id="bc-red-glow" cx="50%" cy="80%" r="80%">
          <stop offset="0%" stopColor="#ff1a1a" />
          <stop offset="50%" stopColor="#8a0000" />
          <stop offset="100%" stopColor="#2a0000" />
        </radialGradient>

        <linearGradient id="bc-glass-reflection" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
        </linearGradient>

        <filter id="bc-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="15" stdDeviation="20" floodColor="#000" floodOpacity="0.9" />
        </filter>

        <filter id="bc-text-shadow">
          <feDropShadow dx="2" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.7" />
        </filter>
      </defs>

      <rect width="100%" height="100%" fill="#050505" />

      <g filter="url(#bc-shadow)">
        <rect x="220" y="100" width="360" height="360" rx="90" fill="url(#bc-red-glow)" stroke="url(#bc-gold-grad)" strokeWidth="14" />
        <rect x="234" y="114" width="332" height="332" rx="76" fill="none" stroke="#ff9999" strokeWidth="2" opacity="0.3" />
        <path d="M 230 190 A 80 80 0 0 1 310 110 L 490 110 A 80 80 0 0 1 570 190 Q 400 280 230 190 Z" fill="url(#bc-glass-reflection)" />
      </g>

      <text x="320" y="355" fontFamily="'Times New Roman', Georgia, serif" fontSize="210" fontWeight="bold" fill="url(#bc-gold-grad)" filter="url(#bc-text-shadow)" textAnchor="middle">B</text>
      <text x="460" y="355" fontFamily="'Times New Roman', Georgia, serif" fontSize="210" fontWeight="bold" fill="url(#bc-silver-grad)" filter="url(#bc-text-shadow)" textAnchor="middle">C</text>

      <g filter="url(#bc-text-shadow)">
        <rect x="420" y="275" width="22" height="40" fill="url(#bc-gold-grad)" />
        <rect x="450" y="240" width="22" height="75" fill="url(#bc-gold-grad)" />
        <rect x="480" y="185" width="22" height="130" fill="url(#bc-gold-grad)" />
        <path d="M 370 290 Q 430 270 500 150" fill="none" stroke="url(#bc-gold-grad)" strokeWidth="9" strokeLinecap="round" />
        <polygon points="485,140 525,125 510,165" fill="url(#bc-gold-grad)" />
      </g>

      <text x="400" y="570" fontFamily="Arial, Helvetica, sans-serif" fontSize="62" fontWeight="bold" letterSpacing="24" fill="url(#bc-gold-grad)" textAnchor="middle">FINANCE</text>

      <text x="400" y="640" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="normal" letterSpacing="4" fill="#d0d0d0" textAnchor="middle">GESTÃO FINANCEIRA INTELIGENTE</text>
      <text x="400" y="675" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="normal" letterSpacing="4" fill="#d0d0d0" textAnchor="middle">PARA O CRESCIMENTO DO SEU NEGÓCIO</text>

      <rect x="360" y="720" width="80" height="2" fill="url(#bc-gold-grad)" />
    </svg>
  );
}