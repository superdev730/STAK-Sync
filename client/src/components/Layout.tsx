import { ReactNode } from "react";
import Header from "./Header";
import { LiveEventBanner } from "./LiveEventBanner";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-soft-white">
      <Header />
      <div className="sticky top-0 z-40">
        <LiveEventBanner />
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 transition-all duration-200">
        {children}
      </main>
    </div>
  );
}
