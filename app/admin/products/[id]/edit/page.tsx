"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  sku: string;
  name: string;
  active: boolean;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      const { data, error } = await supabase
        .from("products")
        .select("id, sku, name, active")
        .eq("id", productId)
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setProduct(data);
      setName(data.name);
      setActive(data.active);
      setLoading(false);
    }

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Product name is required.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("products")
      .update({
        name: trimmedName,
        active,
      })
      .eq("id", productId);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-500">
          Loading product...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          Product not found.
        </div>
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
            Edit Product
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update product details and status.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
            <div>
              <label className="mb-2 block text-sm font-medium">
                SKU
              </label>

              <input
                type="text"
                value={product.sku}
                disabled
                className="w-full rounded-lg border bg-gray-100 px-4 py-3 text-gray-500"
              />

              <p className="mt-1 text-xs text-gray-400">
                SKU cannot be changed.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Product Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="e.g. Radha Mukut"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

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