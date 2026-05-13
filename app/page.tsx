import Feed from "@/components/Feed";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen relative pb-20">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs font-mono opacity-50 uppercase tracking-[0.2em] animate-pulse">Initializing Feed Stream...</div>}>
        <Feed />
      </Suspense>
    </main>
  );
}
