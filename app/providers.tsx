"use client";

import { SessionProvider } from "next-auth/react";
import { BusinessContextProvider } from "@/components/business-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BusinessContextProvider>{children}</BusinessContextProvider>
    </SessionProvider>
  );
}