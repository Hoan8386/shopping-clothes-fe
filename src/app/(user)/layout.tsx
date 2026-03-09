"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/**
 * (user) layout — pages that require any authenticated session:
 *   /account
 *   /cart
 *   /checkout
 *   /orders
 *   /reviews
 *
 * Shows Header + Footer and client-side guards the session.
 * Middleware already handles the server-side redirect to /login.
 */
export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-accent" />
        </main>
        <Footer />
      </>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
