import { Link, Outlet } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary p-12 text-primary-foreground">
        <Link to="/" className="mb-12 flex items-center gap-3">
          <BookOpen className="h-10 w-10" />
          <span className="text-3xl font-bold">Trivestia</span>
        </Link>
        <blockquote className="max-w-sm text-center text-xl font-light leading-relaxed opacity-90">
          "O investimento em conhecimento sempre paga os melhores dividendos."
          <footer className="mt-4 text-sm opacity-70">
            — Benjamin Franklin
          </footer>
        </blockquote>
      </div>

      {/* Painel direito — form */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold">Trivestia</span>
        </Link>
        <Outlet />
      </div>
    </div>
  );
}
