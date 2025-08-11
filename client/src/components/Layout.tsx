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
      <LiveEventBanner />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
