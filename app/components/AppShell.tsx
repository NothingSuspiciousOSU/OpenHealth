"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatRoute = pathname === "/chat";

  return (
    <div
      className={
        isChatRoute
          ? "flex h-dvh flex-col overflow-hidden"
          : "flex min-h-dvh flex-col"
      }
    >
      <Navbar />
      <main className={isChatRoute ? "min-h-0 flex-1" : "flex-1"}>
        {children}
      </main>
      {!isChatRoute && <Footer />}
    </div>
  );
}
