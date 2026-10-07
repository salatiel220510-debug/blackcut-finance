export default function IconeAtomo({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      {/* núcleo */}
      <circle cx="12" cy="12" r="1.9" fill="currentColor" stroke="none" />
      {/* três órbitas elípticas, defasadas em 60° */}
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </svg>
  );
}