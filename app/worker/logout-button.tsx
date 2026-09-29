"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    setLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="
        min-w-[150px]
        rounded-xl
        bg-red-600
        px-7
        py-3.5
        text-base
        font-bold
        text-white
        shadow-md
        transition
        hover:bg-red-700
        hover:shadow-lg
        active:scale-95
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      {loading ? "Logging out..." : "🚪 Logout"}
    </button>
  );
}