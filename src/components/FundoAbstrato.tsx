export default function FundoAbstrato() {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10 bg-black-deep">
      <div className="absolute -top-32 -left-24 w-80 h-80 bg-gold/25 rounded-full blur-3xl" />
      <div className="absolute top-1/4 -right-28 w-96 h-96 bg-gold-dark/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-gold/15 rounded-full blur-3xl" />
    </div>
  );
}