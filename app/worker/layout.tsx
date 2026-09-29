import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, active")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    profile.role !== "WORKER" ||
    !profile.active
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ================= HEADER ================= */}
      <header className="border-b bg-white">

        {/* Top Header */}
        <div className="flex items-center justify-between px-8 py-5">

          {/* Brand */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mukut Shringar
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Worker Panel
            </p>
          </div>

          {/* Worker Information */}
          <div className="flex items-center gap-5">

            <div className="text-right">
              <p className="text-base font-semibold text-gray-900">
                {profile.name}
              </p>

              <p className="text-sm text-gray-500">
                Worker
              </p>
            </div>

          </div>

        </div>

        {/* ================= NAVIGATION ================= */}
        <div className="border-t bg-gray-50 px-8 py-4">

          <div className="flex flex-wrap items-center justify-between gap-4">

            {/* Navigation Links */}
            <nav className="flex flex-wrap gap-3">

              <Link
                href="/worker"
                className="rounded-lg border bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
              >
                🏠 Dashboard
              </Link>

              <Link
                href="/worker/make-product"
                className="rounded-lg border bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
              >
                ➕ Make Product
              </Link>

              <Link
                href="/worker/requests"
                className="rounded-lg border bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
              >
                📋 My Requests
              </Link>

            </nav>

            {/* BIG LOGOUT BUTTON */}
            <LogoutButton />

          </div>

        </div>

      </header>

      {/* ================= PAGE CONTENT ================= */}
      <main>
        {children}
      </main>

    </div>
  );
}