"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewRawMaterialPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const trimmedName = name.trim();
    const numericPrice = Number(price);

    if (!trimmedName) {
      setError("Material name is required.");
      return;
    }

    if (!price || Number.isNaN(numericPrice) || numericPrice < 0) {
      setError("Enter a valid price.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("raw_materials")
      .insert({
        name: trimmedName,
        current_price: numericPrice,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin/raw-materials");
    router.refresh();
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm text-gray-500 hover:text-black"
        >
          ← Back
        </button>

        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">
            Add Raw Material
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Add a material and its current unit price.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
            <div>
              <label className="mb-2 block text-sm font-medium">
                Material Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Moti"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Price per Unit
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="e.g. 2.50"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-lg border px-5 py-3 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Material"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}