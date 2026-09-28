import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RawMaterialsPage() {
  const supabase = await createClient();

  const { data: materials, error } = await supabase
    .from("raw_materials")
    .select("id, name, current_price, active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Raw Materials</h1>
        <p className="mt-4 text-red-600">
          Failed to load raw materials.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Raw Materials</h1>
          <p className="mt-1 text-gray-500">
            Manage materials and their current prices.
          </p>
        </div>

        <Link
          href="/admin/raw-materials/new"
          className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Add Material
        </Link>
      </div>

      {/* Table */}
      <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">
        {materials && materials.length > 0 ? (
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Material
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Current Price
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
              {materials.map((material) => (
                <tr
                  key={material.id}
                  className="border-b last:border-0"
                >
                  <td className="px-6 py-4 font-medium">
                    {material.name}
                  </td>

                  <td className="px-6 py-4">
                    ₹{Number(material.current_price).toFixed(2)}
                  </td>

                  <td className="px-6 py-4">
                    {material.active ? (
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
                      href={`/admin/raw-materials/${material.id}/edit`}
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
              No raw materials yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Add your first raw material to start building products.
            </p>

            <Link
              href="/admin/raw-materials/new"
              className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Add First Material
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}