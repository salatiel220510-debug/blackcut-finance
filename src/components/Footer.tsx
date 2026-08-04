import { APP_VERSION } from "@/lib/version";

export default function Footer() {
  return (
    <footer className="border-t border-gold-dark/30 bg-black-soft text-center py-4 px-4 mt-auto">
      <p className="text-xs text-gray-500">BlackCut Finance — Versão {APP_VERSION}</p>
      <p className="text-xs text-gray-500 mt-1">
        Powered by <span className="text-gold-dark">Alpha Órbita Labs</span>. Todos os direitos reservados. BlackCut Finance
      </p>
    </footer>
  );
}