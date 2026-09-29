import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type RequestRow = {
  id: string;
  product_id: string;
  design_size: string;
  metal_name: string;
  labour_cost: number;
  product_quantity: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  /*
   * Load dashboard statistics
   */
  const [
    { count: rawMaterialsCount },
    { count: productsCount },
    { count: pendingRequestsCount },
    { count: finalizedCount },
  ] = await Promise.all([
    supabase
      .from("raw_materials")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("products")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("manufacturing_requests")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "PENDING"),

    supabase
      .from("finalized_products")
      .select("*", {
        count: "exact",
        head: true,
      }),
  ]);

  /*
   * Load recent pending requests
   */
  const {
    data: requestData,
    error: requestError,
  } = await supabase
    .from("manufacturing_requests")
    .select(
      `
        id,
        product_id,
        design_size,
        metal_name,
        labour_cost,
        product_quantity,
        status,
        created_at
      `
    )
    .eq("status", "PENDING")
    .order("created_at", {
      ascending: false,
    })
    .limit(5);

  /*
   * Load products separately
   * to avoid nested relationship issues.
   */
  let recentRequests: Array<
    RequestRow & {
      product?: Product;
    }
  > = [];

  if (
    !requestError &&
    requestData &&
    requestData.length > 0
  ) {
    const productIds = [
      ...new Set(
        requestData.map(
          (request) => request.product_id
        )
      ),
    ];

    const { data: productData } =
      await supabase
        .from("products")
        .select("id, name, sku")
        .in("id", productIds);

    const productMap = new Map(
      (productData ?? []).map((product) => [
        product.id,
        product,
      ])
    );

    recentRequests = requestData.map(
      (request) => ({
        ...request,
        product: productMap.get(
          request.product_id
        ),
      })
    );
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Dashboard
            </h1>

            <p className="mt-1 text-gray-500">
              Manage your Mukut Shringar
              manufacturing system.
            </p>
          </div>

          <Link
            href="/admin/requests"
            className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
          >
            Review Requests
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          {/* Raw Materials */}
          <Link
            href="/admin/raw-materials"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm text-gray-500">
              Raw Materials
            </p>

            <p className="mt-2 text-3xl font-bold">
              {rawMaterialsCount ?? 0}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Manage materials →
            </p>
          </Link>

          {/* Products */}
          <Link
            href="/admin/products"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm text-gray-500">
              Products
            </p>

            <p className="mt-2 text-3xl font-bold">
              {productsCount ?? 0}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Manage products →
            </p>
          </Link>

          {/* Pending */}
          <Link
            href="/admin/requests"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm text-gray-500">
              Pending Requests
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {pendingRequestsCount ?? 0}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Review requests →
            </p>
          </Link>

          {/* Finalized */}
          <Link
            href="/admin/finalized"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm text-gray-500">
              Finalized Products
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {finalizedCount ?? 0}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              View finalized products →
            </p>
          </Link>

        </div>

        {/* Quick Actions */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">
            Quick Actions
          </h2>

          <div className="grid gap-4 md:grid-cols-3">

            <Link
              href="/admin/raw-materials"
              className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="text-2xl">
                🧱
              </div>

              <h3 className="mt-3 font-semibold">
                Add Raw Material
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add or update material prices.
              </p>
            </Link>

            <Link
              href="/admin/products"
              className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="text-2xl">
                📦
              </div>

              <h3 className="mt-3 font-semibold">
                Add Product
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Create a new product with
                automatic SKU.
              </p>
            </Link>

            <Link
              href="/admin/settings"
              className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="text-2xl">
                ⚙️
              </div>

              <h3 className="mt-3 font-semibold">
                Pricing Settings
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Configure labour and selling
                margins.
              </p>
            </Link>

          </div>
        </section>

        {/* Recent Requests */}
        <section className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">

          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold">
                Recent Manufacturing Requests
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Latest requests waiting for review.
              </p>
            </div>

            {recentRequests.length > 0 && (
              <Link
                href="/admin/requests"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View All →
              </Link>
            )}
          </div>

          {recentRequests.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="text-4xl">
                📋
              </div>

              <h3 className="mt-3 font-semibold">
                No pending requests
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                New worker submissions will
                appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y">

              {recentRequests.map(
                (request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>
                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="font-semibold">
                          {request.product?.name ??
                            "Unknown Product"}
                        </h3>

                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          {request.product?.sku ??
                            "Unknown SKU"}
                        </span>

                        <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800">
                          PENDING
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-gray-500">
                        Size:{" "}
                        {request.design_size}
                        {" • "}
                        Metal:{" "}
                        {request.metal_name}
                        {" • "}
                        Quantity:{" "}
                        {request.product_quantity}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Submitted{" "}
                        {formatDate(
                          request.created_at
                        )}
                      </p>
                    </div>

                    <Link
                      href={`/admin/requests/${request.id}`}
                      className="rounded-lg border border-blue-200 px-4 py-2 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      Review
                    </Link>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>
    </div>
  );
}