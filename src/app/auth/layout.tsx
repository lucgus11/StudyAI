export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-display font-bold text-lg">S</span>
            </div>
            <span className="font-display font-bold text-2xl text-slate-50">StudyAI</span>
          </div>
          <p className="text-slate-400 text-sm">Révise intelligemment, réussis tes examens.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
