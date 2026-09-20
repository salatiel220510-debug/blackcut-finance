"use client";
import { APP_VERSION } from "@/lib/version";

export default function FooterEstatico() {
  return (
    <footer className="border-t border-gold-dark/30 bg-black-soft mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-5">
        <div className="flex flex-col items-center gap-1 pt-3">
          <p className="text-xs text-gray-500">BlackCut Finance — Versão {APP_VERSION}</p>
          <p className="text-xs text-gray-500">
            Powered by <span className="text-gold-dark">Alpha Órbita Labs</span>. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}