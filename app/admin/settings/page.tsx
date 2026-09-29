"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Settings = {
  labour_margin_percent: number;
  selling_margin_percent: number;
};

export default function SettingsPage() {
  const supabase = createClient();

  const [labourMargin, setLabourMargin] =
    useState("");

  const [sellingMargin, setSellingMargin] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadSettings() {
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
         * Check admin
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
          profile.role !== "ADMIN" ||
          !profile.active
        ) {
          window.location.href = "/dashboard";
          return;
        }

        /*
         * Load settings
         */
        const {
          data: settings,
          error: settingsError,
        } = await supabase
          .from("settings")
          .select(
            "labour_margin_percent, selling_margin_percent"
          )
          .eq("id", 1)
          .single();

        if (settingsError) {
          setError(settingsError.message);
          return;
        }

        if (!settings) {
          setError("Settings not found.");
          return;
        }

        const currentSettings =
          settings as Settings;

        setLabourMargin(
          String(
            currentSettings.labour_margin_percent
          )
        );

        setSellingMargin(
          String(
            currentSettings.selling_margin_percent
          )
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [supabase]);

  async function handleSave() {
    setMessage("");
    setError("");

    const labour =
      Number(labourMargin);

    const selling =
      Number(sellingMargin);

    /*
     * Validation
     */
    if (
      !Number.isFinite(labour) ||
      labour < 0
    ) {
      setError(
        "Labour margin must be a valid number greater than or equal to 0."
      );
      return;
    }

    if (
      !Number.isFinite(selling) ||
      selling < 0
    ) {
      setError(
        "Selling margin must be a valid number greater than or equal to 0."
      );
      return;
    }

    /*
     * Prevent unreasonable values
     */
    if (labour > 1000) {
      setError(
        "Labour margin cannot be greater than 1000%."
      );
      return;
    }

    if (selling > 1000) {
      setError(
        "Selling margin cannot be greater than 1000%."
      );
      return;
    }

    const confirmed = window.confirm(
      `Save these pricing settings?\n\nLabour Margin: ${labour}%\nSelling Margin: ${selling}%`
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    const { error: updateError } =
      await supabase
        .from("settings")
        .update({
          labour_margin_percent: labour,
          selling_margin_percent: selling,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setMessage(
      "Pricing settings updated successfully."
    );

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading settings...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Settings
        </h1>

        <p className="mt-1 text-gray-500">
          Manage pricing and system settings.
        </p>
      </div>

      {/* Pricing Settings */}
      <section className="mt-8 max-w-3xl rounded-xl bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">
            Pricing Settings
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            These margins are used when calculating
            manufacturing and selling prices.
          </p>
        </div>

        {/* Fields */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Labour Margin */}
          <div>
            <label
              htmlFor="labourMargin"
              className="block text-sm font-medium text-gray-700"
            >
              Labour Margin
            </label>

            <div className="relative mt-2">
              <input
                id="labourMargin"
                type="number"
                min="0"
                max="1000"
                step="0.01"
                value={labourMargin}
                onChange={(e) =>
                  setLabourMargin(
                    e.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Example: Worker labour ₹100 + 10%
              margin = ₹110.
            </p>
          </div>

          {/* Selling Margin */}
          <div>
            <label
              htmlFor="sellingMargin"
              className="block text-sm font-medium text-gray-700"
            >
              Selling Margin
            </label>

            <div className="relative mt-2">
              <input
                id="sellingMargin"
                type="number"
                min="0"
                max="1000"
                step="0.01"
                value={sellingMargin}
                onChange={(e) =>
                  setSellingMargin(
                    e.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Example: Manufacturing cost ₹100 +
              25% margin = ₹125.
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* Save */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>
        </div>
      </section>

      {/* Information */}
      <section className="mt-6 max-w-3xl rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h3 className="font-semibold text-blue-900">
          How pricing works
        </h3>

        <div className="mt-3 space-y-2 text-sm text-blue-800">
          <p>
            <strong>Labour Price:</strong>{" "}
            Worker Labour Cost + Labour Margin
          </p>

          <p>
            <strong>Manufacturing Cost:</strong>{" "}
            Raw Material Cost + Final Labour Price
          </p>

          <p>
            <strong>Selling Price:</strong>{" "}
            Manufacturing Cost + Selling Margin
          </p>
        </div>
      </section>
    </div>
  );
}