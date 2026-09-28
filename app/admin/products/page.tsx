import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, sku, name, active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">Products</h1>

        <p className="mt-4 text-red-600">
          Failed to load products.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Products
          </h1>

          <p className="mt-1 text-gray-500">
            Manage your product catalogue and SKUs.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Add Product
        </Link>
      </div>

      {/* Product Table */}
      <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">
        {products && products.length > 0 ? (
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  SKU
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Product Name
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
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b last:border-0"
                >
                  <td className="px-6 py-4 font-medium">
                    {product.sku}
                  </td>

                  <td className="px-6 py-4">
                    {product.name}
                  </td>

                  <td className="px-6 py-4">
                    {product.active ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center">
            <h2 className="text-lg font-semibold">
              No products yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Add your first product to start building your catalogue.
            </p>

            <Link
              href="/admin/products/new"
              className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Add First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}