import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
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

  if (!profile || profile.role !== "ADMIN" || !profile.active) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-white border-r">
        {/* Logo */}
        <div className="border-b px-6 py-5">
          <h1 className="text-xl font-bold">
            Mukut Shringar
          </h1>

          <p className="mt-1 text-xs text-gray-500">
            Admin Panel
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">

          <Link
            href="/admin"
            className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-100"
          >
            🏠 Dashboard
          </Link>

          <Link
            href="/admin/raw-materials"
            className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-100"
          >
            🧱 Raw Materials
          </Link>

          <Link
            href="/admin/products"
            className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-100"
          >
            📦 Products
          </Link>

          <Link
            href="/admin/requests"
            className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-100"
          >
            📝 Requests
          </Link>

          <Link
            href="/admin/finalized"
            className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-100"
          >
            ✅ Finalized
          </Link>

          <Link
            href="/admin/settings"
            className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-100"
          >
            ⚙️ Settings
          </Link>

        </nav>

        {/* User */}
        <div className="border-t p-4">
          <p className="text-sm font-medium">
            {profile.name}
          </p>

          <p className="text-xs text-gray-500">
            Administrator
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen flex-1">
        {children}
      </main>
    </div>
  );
}