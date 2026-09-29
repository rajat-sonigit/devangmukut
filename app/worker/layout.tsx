import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h1 className="text-xl font-bold">
              Mukut Shringar
            </h1>

            <p className="text-sm text-gray-500">
              Worker Panel
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">
              {profile.name}
            </p>

            <p className="text-xs text-gray-500">
              Worker
            </p>
          </div>
        </div>

        {/* Worker Navigation */}
        <nav className="border-t px-8 py-3">
          <div className="flex gap-3">
            <Link
              href="/worker"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              🏠 Dashboard
            </Link>

            <Link
              href="/worker/make-product"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              ➕ Make Product
            </Link>

            <Link
              href="/worker/requests"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              📋 My Requests
            </Link>
          </div>
        </nav>
      </header>

      {/* Page */}
      <main>{children}</main>
    </div>
  );
}