import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Profile not found
          </h1>

          <p className="mt-2 text-gray-500">
            Your account exists, but no application profile was found.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">
          Mukut Shringar Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Welcome, {profile.name}
        </p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Your role
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {profile.role}
          </p>
        </div>
      </div>
    </main>
  );
}