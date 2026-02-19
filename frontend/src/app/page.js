import Link from "next/link";

export default function Home() {
  return (
    <main className="app-shell">
      <section className="panel p-6 md:p-10 space-y-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">FAANG DSA Mission</p>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          175 Days Decide Your Next 15 Years
        </h1>
        <p className="text-sm md:text-base text-slate-300 max-w-2xl">
          Morning DSA deep work, afternoon system design mastery, evening execution. No copy-paste, no
          reels, no distractions. One locked day at a time.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/signup" className="btn btn-primary">Start Challenge</Link>
          <Link href="/login" className="btn btn-muted">Login</Link>
          <Link href="/dashboard" className="btn btn-muted">Open Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
