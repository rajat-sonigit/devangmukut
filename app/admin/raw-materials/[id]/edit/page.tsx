"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditRawMaterialPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const id = params.id as string;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMaterial() {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("name, current_price, active")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Raw material not found.");
        setLoading(false);
        return;
      }

      setName(data.name);
      setPrice(String(data.current_price));
      setActive(data.active);
      setLoading(false);
    }

    loadMaterial();
  }, [id]);

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

    if (
      !price ||
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      setError("Enter a valid price.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("raw_materials")
      .update({
        name: trimmedName,
        current_price: numericPrice,
        active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/admin/raw-materials");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading material...
        </p>
      </div>
    );
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
            Edit Raw Material
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update material information and status.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Material Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Price */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Price per Unit
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Status
              </label>

              <select
                value={active ? "active" : "inactive"}
                onChange={(event) =>
                  setActive(event.target.value === "active")
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Actions */}
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
                disabled={saving}
                className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}