import React, { useState, useEffect } from "react";
import { Calculator, MapPin, Phone, User, Package, AlertCircle, ArrowRight, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

interface ConfigData {
  borzo: { baseUrl: string; tokenMasked: string };
  kitchen: { address: string; phone: string; name: string };
  sampleDestinations: Array<{ label: string; address: string; phone: string; name: string }>;
}

export function PriceCalculator({ config }: { config: ConfigData | null }) {
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [dropAddress, setDropAddress] = useState("");
  const [dropPhone, setDropPhone] = useState("919820000001");
  const [dropName, setDropName] = useState("Aarav Sharma");
  const [matter, setMatter] = useState("Nepali Tales Food (Steamed Momos & Thukpa)");
  const [vehicleTypeId, setVehicleTypeId] = useState(8); // 8 = Motorbike
  const [weightKg, setWeightKg] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config?.kitchen) {
      setPickupAddress(config.kitchen.address);
      setPickupPhone(config.kitchen.phone);
    }
    if (config?.sampleDestinations?.[0]) {
      setDropAddress(config.sampleDestinations[0].address);
      setDropPhone(config.sampleDestinations[0].phone);
      setDropName(config.sampleDestinations[0].name);
    }
  }, [config]);

  const handlePresetSelect = (preset: { address: string; phone: string; name: string }) => {
    setDropAddress(preset.address);
    setDropPhone(preset.phone);
    setDropName(preset.name);
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      type: "standard",
      matter,
      vehicle_type_id: Number(vehicleTypeId),
      total_weight_kg: Number(weightKg),
      points: [
        {
          address: pickupAddress,
          contact_person: { phone: pickupPhone, name: config?.kitchen.name || "Kitchen" },
        },
        {
          address: dropAddress,
          contact_person: { phone: dropPhone, name: dropName },
        },
      ],
    };

    try {
      const res = await fetch("/api/borzo/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.is_successful) {
        const errorMsg = data.errors?.join(", ") || "Calculation failed";
        const paramErrors = data.parameter_errors ? JSON.stringify(data.parameter_errors, null, 2) : "";
        setError(`${errorMsg}${paramErrors ? `:\n${paramErrors}` : ""}`);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reach server");
    } finally {
      setLoading(false);
    }
  };

  const order = result?.order;
  const dropPoint = order?.points?.[1];
  const distanceKm = dropPoint?.previous_point_driving_distance_meters
    ? (dropPoint.previous_point_driving_distance_meters / 1000).toFixed(2)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            Order Price Calculator (API: /calculate-order)
          </h2>
          <p className="text-sm text-slate-400">
            Preview live courier delivery charges, driving distance, and arrival estimates before placing an order.
          </p>
        </div>
        <button
          onClick={handleCalculate}
          disabled={loading || !dropAddress}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
          Calculate Delivery Fee
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Fields */}
        <div className="lg:col-span-7 space-y-5">
          {/* Presets */}
          {config?.sampleDestinations && config.sampleDestinations.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Test Delivery Locations (Thane / Mumbai)
              </label>
              <div className="flex flex-wrap gap-2">
                {config.sampleDestinations.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors text-left cursor-pointer ${
                      dropAddress === preset.address
                        ? "bg-indigo-600/20 border-indigo-500/80 text-indigo-300 font-medium"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pickup Point */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              Point 1: Pickup Location (Nepali Tales Kitchen)
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Pickup Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <textarea
                  rows={2}
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Kitchen Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={pickupPhone}
                    onChange={(e) => setPickupPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Kitchen Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    readOnly
                    value={config?.kitchen.name || "Nepali Tales Kitchen"}
                    className="w-full bg-slate-950/60 border border-slate-800/60 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Drop Point */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-400">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div>
              Point 2: Drop Location (Customer Address)
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Customer Delivery Address *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <textarea
                  rows={2}
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  placeholder="Enter full street address in Thane / Mumbai..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Customer Phone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={dropPhone}
                    onChange={(e) => setDropPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Customer Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={dropName}
                    onChange={(e) => setDropName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Package Contents (Matter)</label>
              <input
                type="text"
                value={matter}
                onChange={(e) => setMatter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Weight (KG)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Live Calculation Output */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
              <span>Calculation Results</span>
              {result && (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  HTTP 200 OK
                </span>
              )}
            </h3>

            {loading ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
                <p className="text-sm">Querying Borzo Business API (/calculate-order)...</p>
              </div>
            ) : error ? (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  API Error
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap text-rose-200 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/30">
                  {error}
                </pre>
              </div>
            ) : order ? (
              <div className="space-y-4">
                {/* Big Price Card */}
                <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/40 rounded-xl p-5">
                  <div className="text-xs font-medium text-indigo-300 mb-1">Estimated Customer Delivery Fee</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-white">₹{order.payment_amount}</span>
                    <span className="text-xs text-slate-400">(Base fee: ₹{order.delivery_fee_amount})</span>
                  </div>
                  {distanceKm && (
                    <div className="mt-3 pt-3 border-t border-indigo-900/50 flex items-center justify-between text-xs text-indigo-200">
                      <span>Driving Distance:</span>
                      <span className="font-semibold text-white">{distanceKm} km</span>
                    </div>
                  )}
                </div>

                {/* Key Breakdown Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                    <span className="text-slate-400">Vehicle Type</span>
                    <span className="font-medium text-white">Motorbike (up to 20kg)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                    <span className="text-slate-400">Weight Fee</span>
                    <span className="font-medium text-white">₹{order.weight_fee_amount || "0.00"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                    <span className="text-slate-400">Loading / Insurance Fee</span>
                    <span className="font-medium text-white">₹{order.loading_fee_amount || "0.00"} / ₹{order.insurance_fee_amount || "0.00"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                    <span className="text-slate-400">Pickup Window</span>
                    <span className="font-mono text-slate-300">
                      {order.points?.[0]?.required_start_datetime?.slice(11, 16) || "ASAP"} - {order.points?.[0]?.required_finish_datetime?.slice(11, 16) || "--"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                    <span className="text-slate-400">Drop Estimated Arrival</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {order.points?.[1]?.required_finish_datetime?.slice(11, 16) || "--"}
                    </span>
                  </div>
                </div>

                {/* Warnings / Geocode status */}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>Warnings: {result.warnings.join(", ")}</div>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 italic pt-2">
                  * Note: In Borzo test environment, order calculations are accurate according to Borzo's live Indian rate cards and Google Maps route distance.
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Package className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-sm">Select a preset or enter destination address, then click Calculate.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
