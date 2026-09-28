import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: rawMaterialsCount },
    { count: productsCount },
    { count: requestsCount },
    { count: finalizedCount },
  ] = await Promise.all([
    supabase
      .from("raw_materials")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("products")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("manufacturing_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING"),

    supabase
      .from("finalized_products")
      .select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="mt-1 text-gray-500">
          Manage your Mukut Shringar manufacturing system.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Raw Materials
          </p>

          <p className="mt-2 text-3xl font-bold">
            {rawMaterialsCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Products
          </p>

          <p className="mt-2 text-3xl font-bold">
            {productsCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Pending Requests
          </p>

          <p className="mt-2 text-3xl font-bold">
            {requestsCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Finalized Products
          </p>

          <p className="mt-2 text-3xl font-bold">
            {finalizedCount ?? 0}
          </p>
        </div>

      </div>

      {/* Recent requests */}
      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold">
          Recent Manufacturing Requests
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          New worker submissions will appear here.
        </p>

      </div>

    </div>
  );
}