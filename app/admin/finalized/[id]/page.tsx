"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FinalizedProduct = {
  id: string;
  request_id: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  design_size: string;
  metal_name: string;
  product_quantity: number;

  raw_material_cost: number;
  worker_labour_cost: number;

  labour_margin_percent: number;
  calculated_labour_price: number;
  final_labour_price: number;

  manufacturing_cost: number;

  selling_margin_percent: number;
  calculated_selling_price: number;
  final_selling_price: number;

  finalized_by: string;
  finalized_at: string;
};

type Material = {
  id: string;
  raw_material_id: string;
  material_name_snapshot: string;
  unit_price_snapshot: number;
  units_used: number;
  total_cost: number;
};

type Profile = {
  name: string;
};

export default function FinalizedProductPage() {
  const router = useRouter();
  const params = useParams();

  const supabase = createClient();

  const [product, setProduct] =
    useState<FinalizedProduct | null>(null);

  const [materials, setMaterials] =
    useState<Material[]>([]);

  const [finalizedByName, setFinalizedByName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const formatMoney = (value: number) => {
    return `₹${Number(value).toFixed(2)}`;
  };

  useEffect(() => {
    async function loadFinalizedProduct() {
      try {
        const id = params.id as string;

        if (!id) {
          setError(
            "Finalized product ID is missing."
          );
          setLoading(false);
          return;
        }

        /*
         * Check logged-in user
         */
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/");
          return;
        }

        /*
         * Check admin profile
         */
        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("role, active")
            .eq("id", user.id)
            .single();

        if (
          profileError ||
          !profile ||
          profile.role !== "ADMIN" ||
          !profile.active
        ) {
          router.push("/dashboard");
          return;
        }

        /*
         * Get finalized product
         */
        const {
          data: finalizedProduct,
          error: productError,
        } = await supabase
          .from("finalized_products")
          .select("*")
          .eq("id", id)
          .single();

        if (productError) {
          setError(productError.message);
          setLoading(false);
          return;
        }

        if (!finalizedProduct) {
          setError(
            "Finalized product not found."
          );
          setLoading(false);
          return;
        }

        setProduct(
          finalizedProduct as FinalizedProduct
        );

        /*
         * Get raw-material snapshots
         * from the original manufacturing request.
         */
        const {
          data: materialData,
          error: materialError,
        } = await supabase
          .from("request_materials")
          .select(
            "id, raw_material_id, material_name_snapshot, unit_price_snapshot, units_used, total_cost"
          )
          .eq(
            "request_id",
            finalizedProduct.request_id
          )
          .order("id", {
            ascending: true,
          });

        if (materialError) {
          console.error(
            "Material loading error:",
            materialError
          );
        } else {
          setMaterials(
            (materialData || []) as Material[]
          );
        }

        /*
         * Get admin name who finalized it.
         */
        if (finalizedProduct.finalized_by) {
          const {
            data: adminProfile,
          } = await supabase
            .from("profiles")
            .select("name")
            .eq(
              "id",
              finalizedProduct.finalized_by
            )
            .single();

          if (adminProfile) {
            setFinalizedByName(
              (adminProfile as Profile).name
            );
          }
        }

        setLoading(false);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load finalized product."
        );

        setLoading(false);
      }
    }

    loadFinalizedProduct();
  }, [params.id, router, supabase]);

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading finalized product...
        </p>
      </div>
    );
  }

  /*
   * Error
   */
  if (error || !product) {
    return (
      <div className="p-8">
        <Link
          href="/admin/finalized"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Finalized Products
        </Link>

        <h1 className="mt-6 text-3xl font-bold">
          Finalized Product
        </h1>

        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
          {error ||
            "Finalized product not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/finalized"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Finalized Products
        </Link>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Finalized Product
            </h1>

            <p className="mt-1 text-gray-500">
              Historical finalized product details.
            </p>
          </div>

          <span className="w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            FINALIZED
          </span>
        </div>
      </div>

      {/* Product Information */}
      <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Product Information
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">
              Product
            </p>

            <p className="mt-1 font-medium">
              {product.product_name_snapshot}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              SKU
            </p>

            <p className="mt-1 font-medium">
              {product.sku_snapshot}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Design Size
            </p>

            <p className="mt-1 font-medium">
              {product.design_size}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Metal
            </p>

            <p className="mt-1 font-medium">
              {product.metal_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Product Quantity
            </p>

            <p className="mt-1 font-medium">
              {product.product_quantity}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Finalized By
            </p>

            <p className="mt-1 font-medium">
              {finalizedByName ||
                product.finalized_by}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Finalized At
            </p>

            <p className="mt-1 font-medium">
              {new Date(
                product.finalized_at
              ).toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Request ID
            </p>

            <p className="mt-1 break-all text-xs text-gray-600">
              {product.request_id}
            </p>
          </div>
        </div>
      </section>

      {/* Raw Materials */}
      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Raw Materials
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          These are the historical material prices
          captured when the worker submitted the
          request.
        </p>

        <div className="mt-6 overflow-hidden rounded-lg border">
          {materials.length > 0 ? (
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-semibold">
                    Material
                  </th>

                  <th className="px-5 py-3 text-right text-sm font-semibold">
                    Unit Price
                  </th>

                  <th className="px-5 py-3 text-right text-sm font-semibold">
                    Units Used
                  </th>

                  <th className="px-5 py-3 text-right text-sm font-semibold">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {materials.map((material) => (
                  <tr
                    key={material.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-5 py-4 font-medium">
                      {
                        material.material_name_snapshot
                      }
                    </td>

                    <td className="px-5 py-4 text-right">
                      {formatMoney(
                        material.unit_price_snapshot
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {Number(
                        material.units_used
                      )}
                    </td>

                    <td className="px-5 py-4 text-right font-medium">
                      {formatMoney(
                        material.total_cost
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-4 text-right font-semibold"
                  >
                    Raw Material Cost
                  </td>

                  <td className="px-5 py-4 text-right font-bold">
                    {formatMoney(
                      product.raw_material_cost
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No raw-material records found.
            </div>
          )}
        </div>
      </section>

      {/* Labour Calculation */}
      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Labour Pricing
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">
              Worker Labour Cost
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatMoney(
                product.worker_labour_cost
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Labour Margin
            </p>

            <p className="mt-1 text-lg font-semibold">
              {product.labour_margin_percent}%
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Calculated Labour Price
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatMoney(
                product.calculated_labour_price
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Final Labour Price
            </p>

            <p className="mt-1 text-lg font-bold">
              {formatMoney(
                product.final_labour_price
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Manufacturing Cost */}
      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Manufacturing Cost
        </h2>

        <div className="mt-6 rounded-lg bg-gray-50 p-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">
                Raw Material Cost
              </span>

              <span className="font-medium">
                {formatMoney(
                  product.raw_material_cost
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">
                Final Labour Price
              </span>

              <span className="font-medium">
                {formatMoney(
                  product.final_labour_price
                )}
              </span>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="text-lg font-semibold">
                  Manufacturing Cost
                </span>

                <span className="text-xl font-bold">
                  {formatMoney(
                    product.manufacturing_cost
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Selling Price */}
      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Selling Price
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">
              Manufacturing Cost
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatMoney(
                product.manufacturing_cost
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Selling Margin
            </p>

            <p className="mt-1 text-lg font-semibold">
              {product.selling_margin_percent}%
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Calculated Selling Price
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatMoney(
                product.calculated_selling_price
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Final Selling Price
            </p>

            <p className="mt-1 text-2xl font-bold text-green-700">
              {formatMoney(
                product.final_selling_price
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Historical Record Notice */}
      <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h3 className="font-semibold text-blue-900">
          Historical Record
        </h3>

        <p className="mt-1 text-sm text-blue-700">
          This finalized product is read-only. The
          material prices, margins, calculated values,
          and final prices shown here are preserved from
          the time the product was finalized.
        </p>
      </section>

      {/* Bottom Action */}
      <div className="mt-6">
        <Link
          href="/admin/finalized"
          className="inline-flex rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium hover:bg-gray-50"
        >
          ← Back to Finalized Products
        </Link>
      </div>
    </div>
  );
}