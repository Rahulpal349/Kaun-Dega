import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 text-2xl font-bold font-display">
        404
      </div>
      <h1 className="font-display font-bold text-2xl text-ink mb-2">Page Not Found</h1>
      <p className="text-sm text-ink/60 max-w-xs mb-6">
        Sorry, the page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="rounded-2xl bg-primary text-white font-semibold px-6 py-3 text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}
