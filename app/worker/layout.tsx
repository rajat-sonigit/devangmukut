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
      </header>

      <main>{children}</main>
    </div>
  );
}