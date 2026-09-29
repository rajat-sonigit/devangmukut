import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export default async function FinalizedProductsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN" || !profile.active) {
    redirect("/dashboard");
  }

  const { data, error } = await supabase
    .from("finalized_products")
    .select(`
      id,
      request_id,
      product_id,
      product_name_snapshot,
      sku_snapshot,
      design_size,
      metal_name,
      product_quantity,
      raw_material_cost,
      worker_labour_cost,
      labour_margin_percent,
      calculated_labour_price,
      final_labour_price,
      manufacturing_cost,
      selling_margin_percent,
      calculated_selling_price,
      final_selling_price,
      finalized_by,
      finalized_at
    `)
    .order("finalized_at", {
      ascending: false,
    });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          Finalized Products
        </h1>

        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
          Failed to load finalized products:
          <div className="mt-1 font-medium">
            {error.message}
          </div>
        </div>
      </div>
    );
  }

  const products =
    (data ?? []) as FinalizedProduct[];

  const formatMoney = (value: number) =>
    `₹${Number(value).toFixed(2)}`;

  return (
    <div className="p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Finalized Products
        </h1>

        <p className="mt-1 text-gray-500">
          Products accepted and finalized by the admin.
        </p>
      </div>

      {/* Table */}
      <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Product
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Design
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Metal
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Qty
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Manufacturing Cost
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Selling Price
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Finalized
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    {/* Product */}
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {product.product_name_snapshot}
                      </div>

                      <div className="text-xs text-gray-500">
                        {product.sku_snapshot}
                      </div>
                    </td>

                    {/* Design */}
                    <td className="px-6 py-4">
                      {product.design_size}
                    </td>

                    {/* Metal */}
                    <td className="px-6 py-4">
                      {product.metal_name}
                    </td>

                    {/* Quantity */}
                    <td className="px-6 py-4 text-right">
                      {product.product_quantity}
                    </td>

                    {/* Manufacturing Cost */}
                    <td className="px-6 py-4 text-right font-medium">
                      {formatMoney(
                        product.manufacturing_cost
                      )}
                    </td>

                    {/* Selling Price */}
                    <td className="px-6 py-4 text-right font-bold">
                      {formatMoney(
                        product.final_selling_price
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {new Date(
                        product.finalized_at
                      ).toLocaleDateString("en-IN")}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/finalized/${product.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <h2 className="text-lg font-semibold">
              No finalized products
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Accepted manufacturing requests will
              appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}