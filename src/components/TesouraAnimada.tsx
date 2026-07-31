export default function TesouraAnimada({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="mx-auto">
      <circle cx="30" cy="78" r="9" fill="none" stroke="#d4af37" strokeWidth="5" />
      <circle cx="70" cy="78" r="9" fill="none" stroke="#d4af37" strokeWidth="5" />
      <polyline
        points="30,78 50,48 18,12"
        fill="none"
        stroke="#d4af37"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transformOrigin: "50px 48px" }}
        className="animate-tesoura-lamina-a"
      />
      <polyline
        points="70,78 50,48 82,12"
        fill="none"
        stroke="#d4af37"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transformOrigin: "50px 48px" }}
        className="animate-tesoura-lamina-b"
      />
      <circle cx="50" cy="48" r="3" fill="#d4af37" />
    </svg>
  );
}