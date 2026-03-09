"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/**
 * (guest) layout — public pages accessible without authentication:
 *   /            (home)
 *   /products
 *   /login
 *   /register
 *
 * Shows the main Header + Footer.
 * Middleware already redirects authenticated users away from /login and /register.
 */
export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
