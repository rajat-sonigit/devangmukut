"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type RequestRow = {
  id: string;
  product_id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  product_quantity: number;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
};

type DisplayRequest = RequestRow & {
  product?: Product;
};

export default function WorkerPage() {
  const supabase = createClient();

  const [requests, setRequests] = useState<
    DisplayRequest[]
  >([]);

  const [workerName, setWorkerName] =
    useState("Worker");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
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
         * Check worker profile
         */
        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("name, role, active")
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

        setWorkerName(profile.name);

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
              status,
              product_quantity,
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

        if (
          !requestData ||
          requestData.length === 0
        ) {
          setRequests([]);
          return;
        }

        /*
         * Get product information separately
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
         * Map products
         */
        const productMap = new Map(
          (productData ?? []).map(
            (product) => [
              product.id,
              product,
            ]
          )
        );

        /*
         * Combine requests + products
         */
        const combined: DisplayRequest[] =
          requestData.map((request) => ({
            ...request,
            product: productMap.get(
              request.product_id
            ),
          }));

        setRequests(combined);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [supabase]);

  /*
   * Statistics
   */
  const totalRequests = requests.length;

  const pendingRequests =
    requests.filter(
      (request) =>
        request.status === "PENDING"
    ).length;

  const acceptedRequests =
    requests.filter(
      (request) =>
        request.status === "ACCEPTED"
    ).length;

  const declinedRequests =
    requests.filter(
      (request) =>
        request.status === "DECLINED"
    ).length;

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

  if (loading) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Worker Dashboard
            </h1>

            <p className="mt-1 text-gray-500">
              Welcome back, {workerName}.
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

        {/* Statistics */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Requests
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalRequests}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              All your submitted requests
            </p>
          </div>

          {/* Pending */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {pendingRequests}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Waiting for admin review
            </p>
          </div>

          {/* Accepted */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Accepted
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {acceptedRequests}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Successfully finalized
            </p>
          </div>

          {/* Declined */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Declined
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {declinedRequests}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Requests declined by admin
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Link
            href="/worker/make-product"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-2xl">
              ➕
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              Make Product
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Create a new product manufacturing
              request.
            </p>
          </Link>

          <Link
            href="/worker/requests"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-2xl">
              📋
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              My Requests
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              View and manage your submitted
              manufacturing requests.
            </p>

            <div className="mt-4 text-sm font-semibold text-blue-600">
              View Requests →
            </div>
          </Link>
        </div>

        {/* Recent Requests */}
        <div className="mt-8 rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold">
                Recent Requests
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your latest manufacturing requests.
              </p>
            </div>

            {requests.length > 0 && (
              <Link
                href="/worker/requests"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View All
              </Link>
            )}
          </div>

          {requests.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="text-4xl">
                📋
              </div>

              <h3 className="mt-3 font-semibold">
                No requests yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Create your first manufacturing
                request to get started.
              </p>

              <Link
                href="/worker/make-product"
                className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Make Product
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {requests
                .slice(0, 5)
                .map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
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

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        Quantity:{" "}
                        {request.product_quantity}
                        {" • "}
                        {formatDate(
                          request.created_at
                        )}
                      </p>
                    </div>

                    <Link
                      href="/worker/requests"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View →
                    </Link>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}