import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type RequestRow = {
  id: string;
  product_id: string;
  design_size: string;
  metal_name: string;
  labour_cost: number;
  product_quantity: number;
  status: string;
  created_at: string;
};

type Product = {
  id: string;
  sku: string;
  name: string;
};

export default async function RequestsPage() {
  const supabase = await createClient();

  const { data: requests, error: requestsError } =
    await supabase
      .from("manufacturing_requests")
      .select(
        "id, product_id, design_size, metal_name, labour_cost, product_quantity, status, created_at"
      )
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

  if (requestsError) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          Manufacturing Requests
        </h1>

        <p className="mt-4 text-red-600">
          Failed to load requests: {requestsError.message}
        </p>
      </div>
    );
  }

  const productIds = [
    ...new Set(
      (requests ?? []).map((request) => request.product_id)
    ),
  ];

  let products: Product[] = [];

  if (productIds.length > 0) {
    const { data: productData, error: productsError } =
      await supabase
        .from("products")
        .select("id, sku, name")
        .in("id", productIds);

    if (productsError) {
      return (
        <div className="p-8">
          <h1 className="text-3xl font-bold">
            Manufacturing Requests
          </h1>

          <p className="mt-4 text-red-600">
            Failed to load products: {productsError.message}
          </p>
        </div>
      );
    }

    products = productData ?? [];
  }

  const productMap = new Map(
    products.map((product) => [product.id, product])
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Manufacturing Requests
        </h1>

        <p className="mt-1 text-gray-500">
          Review product requests submitted by workers.
        </p>
      </div>

      {/* Requests Table */}
      <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">
        {requests && requests.length > 0 ? (
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Product
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Design Size
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Metal
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Labour
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Quantity
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => {
                const product = productMap.get(
                  request.product_id
                );

                return (
                  <tr
                    key={request.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {product?.name ?? "Unknown Product"}
                      </div>

                      <div className="text-xs text-gray-500">
                        {product?.sku ?? "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {request.design_size}
                    </td>

                    <td className="px-6 py-4">
                      {request.metal_name}
                    </td>

                    <td className="px-6 py-4">
                      ₹{Number(request.labour_cost).toFixed(2)}
                    </td>

                    <td className="px-6 py-4">
                      {request.product_quantity}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                        Pending
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/requests/${request.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center">
            <h2 className="text-lg font-semibold">
              No pending requests
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              New worker manufacturing requests will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}