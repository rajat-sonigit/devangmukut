"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

type FinalizedProduct = {
  request_id: string;
  manufacturing_cost: number;
  final_selling_price: number;
  finalized_at: string;
};

type DisplayRequest = RequestRow & {
  product?: Product;
  finalized?: FinalizedProduct;
};

export default function WorkerRequestsPage() {
  const supabase = createClient();

  const [requests, setRequests] = useState<DisplayRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true);
        setError("");

        /*
         * Check logged-in user
         */
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/";
          return;
        }

        /*
         * Check worker
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
          profile.role !== "WORKER" ||
          !profile.active
        ) {
          window.location.href = "/dashboard";
          return;
        }

        /*
         * Load worker's requests
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
          .eq("created_by", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (requestError) {
          setError(requestError.message);
          return;
        }

        if (!requestData || requestData.length === 0) {
          setRequests([]);
          return;
        }

        /*
         * Load products separately
         */
        const productIds = [
          ...new Set(
            requestData.map(
              (request) => request.product_id
            )
          ),
        ];

        const {
          data: productData,
          error: productError,
        } = await supabase
          .from("products")
          .select("id, name, sku")
          .in("id", productIds);

        if (productError) {
          setError(productError.message);
          return;
        }

        /*
         * Load finalized records separately
         */
        const requestIds = requestData.map(
          (request) => request.id
        );

        const {
          data: finalizedData,
          error: finalizedError,
        } = await supabase
          .from("finalized_products")
          .select(
            `
              request_id,
              manufacturing_cost,
              final_selling_price,
              finalized_at
            `
          )
          .in("request_id", requestIds);

        if (finalizedError) {
          setError(finalizedError.message);
          return;
        }

        /*
         * Create lookup maps
         */
        const productMap = new Map(
          (productData ?? []).map((product) => [
            product.id,
            product,
          ])
        );

        const finalizedMap = new Map(
          (finalizedData ?? []).map((item) => [
            item.request_id,
            item,
          ])
        );

        /*
         * Combine data
         */
        const combined: DisplayRequest[] =
          requestData.map((request) => ({
            ...request,
            product: productMap.get(
              request.product_id
            ),
            finalized: finalizedMap.get(
              request.id
            ),
          }));

        setRequests(combined);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load requests."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [supabase]);

  /*
   * Delete pending request
   */
  async function handleDelete(requestId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this request?\n\nOnly pending requests can be deleted."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(requestId);
      setError("");

      const { error: deleteError } =
        await supabase.rpc(
          "delete_my_manufacturing_request",
          {
            p_request_id: requestId,
          }
        );

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      /*
       * Remove from UI immediately
       */
      setRequests((current) =>
        current.filter(
          (request) => request.id !== requestId
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete request."
      );
    } finally {
      setDeletingId("");
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function statusClass(
    status: DisplayRequest["status"]
  ) {
    if (status === "PENDING") {
      return "bg-yellow-100 text-yellow-800";
    }

    if (status === "ACCEPTED") {
      return "bg-green-100 text-green-800";
    }

    return "bg-red-100 text-red-800";
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading your requests...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            My Requests
          </h1>

          <p className="mt-1 text-gray-500">
            Track the products you have submitted.
          </p>
        </div>

        <Link
          href="/worker/make-product"
          className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Make Product
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty */}
      {!error && requests.length === 0 && (
        <div className="mt-8 rounded-xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold">
            No requests yet
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Your submitted products will appear here.
          </p>

          <Link
            href="/worker/make-product"
            className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Make Your First Product
          </Link>
        </div>
      )}

      {/* Requests */}
      {requests.length > 0 && (
        <div className="mt-8 space-y-5">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              {/* Top */}
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold">
                      {request.product?.name ??
                        "Unknown Product"}
                    </h2>

                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {request.product?.sku ??
                        "Unknown SKU"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    Submitted{" "}
                    {formatDate(
                      request.created_at
                    )}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Design Size
                  </p>

                  <p className="mt-1 font-semibold">
                    {request.design_size}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Metal
                  </p>

                  <p className="mt-1 font-semibold">
                    {request.metal_name}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Labour Cost
                  </p>

                  <p className="mt-1 font-semibold">
                    ₹
                    {Number(
                      request.labour_cost
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Quantity
                  </p>

                  <p className="mt-1 font-semibold">
                    {request.product_quantity}
                  </p>
                </div>
              </div>

              {/* Accepted */}
              {request.status ===
                "ACCEPTED" &&
                request.finalized && (
                  <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-5">
                    <h3 className="font-semibold text-green-900">
                      Product Finalized
                    </h3>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-green-700">
                          Manufacturing Cost
                        </p>

                        <p className="mt-1 font-semibold text-green-900">
                          ₹
                          {Number(
                            request.finalized
                              .manufacturing_cost
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-green-700">
                          Final Selling Price
                        </p>

                        <p className="mt-1 text-lg font-bold text-green-900">
                          ₹
                          {Number(
                            request.finalized
                              .final_selling_price
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-green-700">
                          Finalized On
                        </p>

                        <p className="mt-1 font-semibold text-green-900">
                          {formatDate(
                            request.finalized
                              .finalized_at
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Pending */}
              {request.status ===
                "PENDING" && (
                <>
                  <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    Your request is waiting for
                    admin review.
                  </div>

                  {/* Delete */}
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          request.id
                        )
                      }
                      disabled={
                        deletingId ===
                        request.id
                      }
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId ===
                      request.id
                        ? "Deleting..."
                        : "Delete Request"}
                    </button>
                  </div>
                </>
              )}

              {/* Declined */}
              {request.status ===
                "DECLINED" && (
                  <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    This request was declined by
                    the admin.
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}