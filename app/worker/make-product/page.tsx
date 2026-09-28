"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  sku: string;
  name: string;
};

type RawMaterial = {
  id: string;
  name: string;
  current_price: number;
};

type MaterialRow = {
  rawMaterialId: string;
  unitsUsed: string;
};

export default function MakeProductPage() {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);

  const [productId, setProductId] = useState("");
  const [designSize, setDesignSize] = useState("");
  const [metalName, setMetalName] = useState("");
  const [labourCost, setLabourCost] = useState("");
  const [productQuantity, setProductQuantity] = useState("");

  const [materials, setMaterials] = useState<MaterialRow[]>([
    {
      rawMaterialId: "",
      unitsUsed: "",
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      const [productsResult, materialsResult] =
        await Promise.all([
          supabase
            .from("products")
            .select("id, sku, name")
            .eq("active", true)
            .order("sku", { ascending: true }),

          supabase
            .from("raw_materials")
            .select("id, name, current_price")
            .eq("active", true)
            .order("name", { ascending: true }),
        ]);

      if (productsResult.error) {
        setError(productsResult.error.message);
        setLoading(false);
        return;
      }

      if (materialsResult.error) {
        setError(materialsResult.error.message);
        setLoading(false);
        return;
      }

      setProducts(productsResult.data ?? []);
      setRawMaterials(materialsResult.data ?? []);

      setLoading(false);
    }

    loadData();
  }, []);

  function addMaterialRow() {
    setMaterials([
      ...materials,
      {
        rawMaterialId: "",
        unitsUsed: "",
      },
    ]);
  }

  function removeMaterialRow(index: number) {
    if (materials.length === 1) {
      return;
    }

    setMaterials(
      materials.filter((_, rowIndex) => rowIndex !== index)
    );
  }

  function updateMaterial(
    index: number,
    field: keyof MaterialRow,
    value: string
  ) {
    setMaterials((currentMaterials) =>
      currentMaterials.map((material, rowIndex) =>
        rowIndex === index
          ? {
              ...material,
              [field]: value,
            }
          : material
      )
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    if (!designSize.trim()) {
      setError("Design size is required.");
      return;
    }

    if (!metalName.trim()) {
      setError("Metal name is required.");
      return;
    }

    const labour = Number(labourCost);
    const quantity = Number(productQuantity);

    if (!labourCost || Number.isNaN(labour) || labour < 0) {
      setError("Please enter a valid labour cost.");
      return;
    }

    if (
      !productQuantity ||
      Number.isNaN(quantity) ||
      quantity < 1
    ) {
      setError("Please enter a valid product quantity.");
      return;
    }

    if (materials.length === 0) {
      setError("At least one raw material is required.");
      return;
    }

    for (const material of materials) {
      if (!material.rawMaterialId) {
        setError("Please select a raw material for every row.");
        return;
      }

      const units = Number(material.unitsUsed);

      if (
        !material.unitsUsed ||
        Number.isNaN(units) ||
        units <= 0
      ) {
        setError("Please enter valid units for every material.");
        return;
      }
    }

    setSubmitting(true);

    const { error: submitError } = await supabase.rpc(
      "submit_manufacturing_request",
      {
        p_product_id: productId,
        p_design_size: designSize.trim(),
        p_metal_name: metalName.trim(),
        p_labour_cost: labour,
        p_product_quantity: quantity,
        p_materials: materials,
      }
    );

    if (submitError) {
      setError(submitError.message);
      setSubmitting(false);
      return;
    }

    alert("Manufacturing request submitted successfully.");

    router.push("/worker");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-500">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Make Product
          </h1>

          <p className="mt-1 text-gray-500">
            Create a new product manufacturing request.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-8 shadow-sm"
        >
          <div className="space-y-8">
            {/* Product */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Product
              </label>

              <select
                value={productId}
                onChange={(event) =>
                  setProductId(event.target.value)
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              >
                <option value="">
                  Select product
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.sku} — {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Design Size */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Design Size
              </label>

              <input
                type="text"
                value={designSize}
                onChange={(event) =>
                  setDesignSize(event.target.value)
                }
                placeholder="e.g. 8 inch"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Raw Materials */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Raw Materials
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Select materials and enter the units used.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addMaterialRow}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  + Add Material
                </button>
              </div>

              <div className="space-y-3">
                {materials.map((material, index) => (
                  <div
                    key={index}
                    className="flex gap-3"
                  >
                    <select
                      value={material.rawMaterialId}
                      onChange={(event) =>
                        updateMaterial(
                          index,
                          "rawMaterialId",
                          event.target.value
                        )
                      }
                      className="flex-1 rounded-lg border px-4 py-3 outline-none focus:border-black"
                    >
                      <option value="">
                        Select material
                      </option>

                      {rawMaterials.map((rawMaterial) => (
                        <option
                          key={rawMaterial.id}
                          value={rawMaterial.id}
                        >
                          {rawMaterial.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={material.unitsUsed}
                      onChange={(event) =>
                        updateMaterial(
                          index,
                          "unitsUsed",
                          event.target.value
                        )
                      }
                      placeholder="Units"
                      className="w-32 rounded-lg border px-4 py-3 outline-none focus:border-black"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeMaterialRow(index)
                      }
                      disabled={materials.length === 1}
                      className="rounded-lg border px-4 py-3 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Metal Name */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Metal Name
              </label>

              <input
                type="text"
                value={metalName}
                onChange={(event) =>
                  setMetalName(event.target.value)
                }
                placeholder="e.g. Gold"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Labour Cost */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Labour Cost
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={labourCost}
                onChange={(event) =>
                  setLabourCost(event.target.value)
                }
                placeholder="e.g. 500"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Product Quantity */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Product Quantity
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={productQuantity}
                onChange={(event) =>
                  setProductQuantity(event.target.value)
                }
                placeholder="e.g. 10"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end border-t pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Manufacturing Request"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}