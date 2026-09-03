import { Outlet, Link } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-green-50/50 flex flex-col">
      {/* Top Logo Bar */}
      <div className="pt-8 pb-4 flex justify-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-transform group-hover:scale-110">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
            AI Teacher Copilot
          </span>
        </Link>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border border-border shadow-xl p-8">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} AI Teacher Copilot
      </div>
    </div>
  );
}
