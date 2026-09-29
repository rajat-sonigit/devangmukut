"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Material = {
  id: string;
  raw_material_id: string;
  material_name: string;
  unit_price: number;
  units_used: number;
  total_cost: number;
};

type ReviewData = {
  request: {
    id: string;
    product_id: string;
    design_size: string;
    metal_name: string;
    labour_cost: number;
    product_quantity: number;
    status: string;
    created_at: string;
  };

  product: {
    id: string;
    sku: string;
    name: string;
  };

  materials: Material[];

  pricing: {
    raw_material_cost: number;
    worker_labour_cost: number;
    labour_margin_percent: number;
    calculated_labour_price: number;
    manufacturing_cost: number;
    selling_margin_percent: number;
    calculated_selling_price: number;
  };
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ReviewRequestPage({
  params,
}: PageProps) {
  const router = useRouter();
  const supabase = createClient();

  const [review, setReview] =
    useState<ReviewData | null>(null);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [finalLabourPrice, setFinalLabourPrice] =
    useState("");

  const [finalSellingPrice, setFinalSellingPrice] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [declining, setDeclining] =
    useState(false);

  const [error, setError] = useState("");

  /*
   * Load request
   */
  useEffect(() => {
    async function loadRequest() {
      try {
        const { id } = await params;

        // Check logged-in user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/");
          return;
        }

        // Check admin profile
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

        // Get manufacturing request
        const { data, error: reviewError } =
          await supabase.rpc(
            "get_manufacturing_request_review",
            {
              p_request_id: id,
            }
          );

        if (reviewError) {
          setError(reviewError.message);
          setPageLoading(false);
          return;
        }

        if (!data) {
          setError(
            "Manufacturing request not found."
          );
          setPageLoading(false);
          return;
        }

        const requestData =
          data as ReviewData;

        setReview(requestData);

        // Set default final prices to calculated prices
        setFinalLabourPrice(
          Number(
            requestData.pricing
              .calculated_labour_price
          ).toFixed(2)
        );

        setFinalSellingPrice(
          Number(
            requestData.pricing
              .calculated_selling_price
          ).toFixed(2)
        );

        setPageLoading(false);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load request."
        );

        setPageLoading(false);
      }
    }

    loadRequest();
  }, [params, router, supabase]);

  /*
   * Loading
   */
  if (pageLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading manufacturing request...
        </p>
      </div>
    );
  }

  /*
   * Error before request loaded
   */
  if (error && !review) {
    return (
      <div className="p-8">
        <Link
          href="/admin/requests"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Requests
        </Link>

        <h1 className="mt-6 text-3xl font-bold">
          Review Manufacturing Request
        </h1>

        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  /*
   * Safety check
   */
  if (!review) {
    return null;
  }

  /*
   * From this point onward review is guaranteed to exist
   */
  const request = review.request;
  const product = review.product;
  const pricing = review.pricing;

  const formatMoney = (value: number) =>
    `₹${Number(value).toFixed(2)}`;

  const labourPrice =
    Number(finalLabourPrice) || 0;

  const manufacturingCost =
    Number(pricing.raw_material_cost) +
    labourPrice;

  const calculatedSellingPrice =
    manufacturingCost *
    (1 +
      Number(pricing.selling_margin_percent) /
        100);

  /*
   * ACCEPT
   */
  async function handleAccept() {
    setError("");

    // Capture the ID while review is known to exist
    const requestId = request.id;

    const labour =
      Number(finalLabourPrice);

    const selling =
      Number(finalSellingPrice);

    // Validate labour price
    if (!Number.isFinite(labour) || labour < 0) {
      setError(
        "Please enter a valid final labour price."
      );
      return;
    }

    // Validate selling price
    if (
      !Number.isFinite(selling) ||
      selling < 0
    ) {
      setError(
        "Please enter a valid final selling price."
      );
      return;
    }

    // Confirmation
    const confirmed = window.confirm(
      `Finalize this product?\n\nFinal Labour Price: ₹${labour.toFixed(
        2
      )}\nFinal Selling Price: ₹${selling.toFixed(
        2
      )}`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    const { error: acceptError } =
      await supabase.rpc(
        "accept_manufacturing_request",
        {
          p_request_id: requestId,
          p_final_labour_price: labour,
          p_final_selling_price: selling,
        }
      );

    if (acceptError) {
      setError(acceptError.message);
      setLoading(false);
      return;
    }

    alert(
      "Product finalized successfully."
    );

    router.push("/admin/requests");
    router.refresh();
  }

  /*
   * DECLINE
   */
  async function handleDecline() {
    setError("");

    // Capture the ID while review is known to exist
    const requestId = request.id;

    const confirmed = window.confirm(
      "Are you sure you want to decline this manufacturing request?"
    );

    if (!confirmed) {
      return;
    }

    setDeclining(true);

    const { error: declineError } =
      await supabase.rpc(
        "decline_manufacturing_request",
        {
          p_request_id: requestId,
        }
      );

    if (declineError) {
      setError(declineError.message);
      setDeclining(false);
      return;
    }

    alert("Request declined.");

    router.push("/admin/requests");
    router.refresh();
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/requests"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Requests
        </Link>

        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Review Manufacturing Request
            </h1>

            <p className="mt-1 text-gray-500">
              Review the worker submission and
              calculated pricing.
            </p>
          </div>

          <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700">
            {request.status}
          </span>
        </div>
      </div>

      {/* Product Details */}
      <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Product Details
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">
              Product
            </p>

            <p className="mt-1 font-medium">
              {product.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              SKU
            </p>

            <p className="mt-1 font-medium">
              {product.sku}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Design Size
            </p>

            <p className="mt-1 font-medium">
              {request.design_size}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Metal
            </p>

            <p className="mt-1 font-medium">
              {request.metal_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Product Quantity
            </p>

            <p className="mt-1 font-medium">
              {request.product_quantity}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Worker Labour Cost
            </p>

            <p className="mt-1 font-medium">
              {formatMoney(
                request.labour_cost
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Request ID
            </p>

            <p className="mt-1 break-all text-xs text-gray-600">
              {request.id}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Submitted
            </p>

            <p className="mt-1 font-medium">
              {new Date(
                request.created_at
              ).toLocaleString("en-IN")}
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
          Historical prices captured when the request
          was submitted.
        </p>

        <div className="mt-5 overflow-hidden rounded-lg border">
          {review.materials.length > 0 ? (
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
                {review.materials.map(
                  (material) => (
                    <tr
                      key={material.id}
                      className="border-b last:border-0"
                    >
                      <td className="px-5 py-4 font-medium">
                        {material.material_name}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatMoney(
                          material.unit_price
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
                  )
                )}
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
                      pricing.raw_material_cost
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No raw materials were added to this
              request.
            </div>
          )}
        </div>
      </section>

      {/* Pricing Calculation */}
      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Pricing Calculation
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Prices are calculated from the worker&apos;s
          labour cost, material snapshots, and margin
          settings.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Labour */}
          <div className="rounded-lg border p-5">
            <h3 className="font-semibold">
              Labour Price
            </h3>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Worker Labour Cost
                </span>

                <span className="font-medium">
                  {formatMoney(
                    pricing.worker_labour_cost
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">
                  Labour Margin
                </span>

                <span className="font-medium">
                  {pricing.labour_margin_percent}%
                </span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">
                    Calculated Labour Price
                  </span>

                  <span className="font-bold">
                    {formatMoney(
                      pricing.calculated_labour_price
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Selling */}
          <div className="rounded-lg border p-5">
            <h3 className="font-semibold">
              Selling Price
            </h3>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Raw Material Cost
                </span>

                <span className="font-medium">
                  {formatMoney(
                    pricing.raw_material_cost
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">
                  Labour Price
                </span>

                <span className="font-medium">
                  {formatMoney(
                    pricing.calculated_labour_price
                  )}
                </span>
              </div>

              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold">
                  Manufacturing Cost
                </span>

                <span className="font-bold">
                  {formatMoney(
                    pricing.manufacturing_cost
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">
                  Selling Margin
                </span>

                <span className="font-medium">
                  {pricing.selling_margin_percent}%
                </span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">
                    Calculated Selling Price
                  </span>

                  <span className="text-lg font-bold">
                    {formatMoney(
                      pricing.calculated_selling_price
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Decision */}
      <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-xl font-semibold text-blue-900">
          Admin Decision
        </h2>

        <p className="mt-1 text-sm text-blue-700">
          You can override the calculated prices before
          finalizing the product.
        </p>

        {/* Editable Prices */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Final Labour */}
          <div>
            <label
              htmlFor="finalLabourPrice"
              className="block text-sm font-medium text-gray-700"
            >
              Final Labour Price
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Calculated price:{" "}
              {formatMoney(
                pricing.calculated_labour_price
              )}
            </p>

            <input
              id="finalLabourPrice"
              type="number"
              min="0"
              step="0.01"
              value={finalLabourPrice}
              onChange={(e) =>
                setFinalLabourPrice(
                  e.target.value
                )
              }
              disabled={
                loading || declining
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Final Selling */}
          <div>
            <label
              htmlFor="finalSellingPrice"
              className="block text-sm font-medium text-gray-700"
            >
              Final Selling Price
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Calculated price:{" "}
              {formatMoney(
                pricing.calculated_selling_price
              )}
            </p>

            <input
              id="finalSellingPrice"
              type="number"
              min="0"
              step="0.01"
              value={finalSellingPrice}
              onChange={(e) =>
                setFinalSellingPrice(
                  e.target.value
                )
              }
              disabled={
                loading || declining
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Final Pricing Preview */}
        <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
          <h3 className="font-semibold">
            Final Pricing Preview
          </h3>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">
                Raw Material Cost
              </span>

              <span className="font-medium">
                {formatMoney(
                  pricing.raw_material_cost
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">
                Final Labour Price
              </span>

              <span className="font-medium">
                {formatMoney(labourPrice)}
              </span>
            </div>

            <div className="flex justify-between border-t pt-3">
              <span className="font-semibold">
                Manufacturing Cost
              </span>

              <span className="font-bold">
                {formatMoney(
                  manufacturingCost
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">
                Selling Margin
              </span>

              <span>
                {pricing.selling_margin_percent}%
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">
                Calculated Selling Price
              </span>

              <span>
                {formatMoney(
                  calculatedSellingPrice
                )}
              </span>
            </div>

            <div className="flex justify-between border-t pt-3">
              <span className="font-semibold">
                Final Selling Price
              </span>

              <span className="text-xl font-bold">
                {formatMoney(
                  Number(
                    finalSellingPrice
                  ) || 0
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={
              loading || declining
            }
            className="rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Finalizing..."
              : "Accept & Finalize"}
          </button>

          <button
            type="button"
            onClick={handleDecline}
            disabled={
              loading || declining
            }
            className="rounded-lg border border-red-300 bg-white px-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {declining
              ? "Declining..."
              : "Decline"}
          </button>

          <Link
            href="/admin/requests"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </section>
    </div>
  );
}