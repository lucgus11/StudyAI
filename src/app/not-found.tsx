import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh">
      <div className="text-center">
        <p className="font-display text-8xl font-bold text-indigo-500 mb-4">404</p>
        <h1 className="font-display text-2xl font-bold text-slate-100 mb-2">
          Page introuvable
        </h1>
        <p className="text-slate-400 mb-6">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <Link href="/dashboard" className="btn-primary">
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}
