import Link from "next/link";

export default function WorkerPage() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl">
        <div>
          <h1 className="text-3xl font-bold">
            Worker Dashboard
          </h1>

          <p className="mt-1 text-gray-500">
            Create and submit product manufacturing requests.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Link
            href="/worker/make-product"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="text-2xl">➕</div>

            <h2 className="mt-4 text-xl font-semibold">
              Make Product
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Create a new product manufacturing request.
            </p>
          </Link>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="text-2xl">📋</div>

            <h2 className="mt-4 text-xl font-semibold">
              My Requests
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              View your submitted manufacturing requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}