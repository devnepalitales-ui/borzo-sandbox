import React, { useState, useEffect } from "react";
import {
  Calculator,
  MapPin,
  Phone,
  User,
  Package,
  AlertCircle,
  Loader2,
  Navigation,
  Bike,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { formatCurrency, formatPhone } from "../lib/utils";

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
  const [matter, setMatter] = useState("Nepali Tales Food (Hot Momos & Thukpa)");
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

  const handleCalculate = async (overrideAddress?: string) => {
    const targetAddress = overrideAddress || dropAddress;
    if (!targetAddress) return;

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
          contact_person: { phone: pickupPhone, name: config?.kitchen?.name || "Kitchen" },
        },
        {
          address: targetAddress,
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
    ? (dropPoint.previous_point_driving_distance_meters / 1000).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Fare & ETA Calculator
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Test and preview delivery charges across different pin codes and locations in Mumbai & Thane.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleCalculate()}
          disabled={loading || !dropAddress}
          className="gap-1.5 h-8 text-xs font-semibold"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calculator className="h-3.5 w-3.5" />}
          Calculate Fare
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form */}
        <div className="lg:col-span-7 space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Delivery Parameters</CardTitle>
              <CardDescription>Select a quick preset or type any custom address.</CardDescription>

              {/* Presets */}
              {config?.sampleDestinations && (
                <div className="pt-2">
                  <span className="text-[11px] font-medium text-zinc-400 block mb-1.5">Quick Location Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {config.sampleDestinations.map((preset, idx) => {
                      const isActive = dropAddress === preset.address;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDropAddress(preset.address);
                            setDropPhone(preset.phone);
                            setDropName(preset.name);
                            handleCalculate(preset.address);
                          }}
                          className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                            isActive
                              ? "border-rose-500/60 bg-rose-500/10 text-rose-300"
                              : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300">Destination Address</label>
                <div className="relative">
                  <MapPin className="h-3.5 w-3.5 absolute left-3 top-3 text-zinc-500" />
                  <textarea
                    rows={2}
                    value={dropAddress}
                    onChange={(e) => setDropAddress(e.target.value)}
                    placeholder="Enter landmark, society, or street address"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-300">Vehicle Type</label>
                  <select
                    value={vehicleTypeId}
                    onChange={(e) => setVehicleTypeId(Number(e.target.value))}
                    className="w-full h-9 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
                  >
                    <option value={8}>Motorbike (up to 20 kg)</option>
                    <option value={7}>Walker / Bicycle (up to 10 kg)</option>
                    <option value={1}>Car / Van (up to 200 kg)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-300">Package Weight (kg)</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Calculation Display */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl">
            <CardHeader className="border-b border-zinc-800/80 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Bike className="h-4 w-4 text-rose-500" />
                  Calculation Result
                </CardTitle>
                <Badge variant="outline" className="text-zinc-400 text-[10px]">
                  Real-time Borzo v1.8
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {loading ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-rose-500 mx-auto" />
                  <p className="text-xs text-zinc-400">Calculating real-time distance and fare...</p>
                </div>
              ) : order ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
                    <span className="text-[11px] text-zinc-400 block mb-1">Total Estimated Charge</span>
                    <div className="text-3xl font-black text-white font-mono tracking-tight tabular-nums">
                      {formatCurrency(order.payment_amount)}
                    </div>
                    {distanceKm && (
                      <Badge variant="secondary" className="font-mono text-[10px] mt-2">
                        {distanceKm} km driving distance
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-zinc-800/80">
                    <div className="flex justify-between py-1.5 text-zinc-300">
                      <span className="text-zinc-400">Base Courier Charge</span>
                      <span className="font-mono font-medium text-white">{formatCurrency(order.delivery_fee_amount)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-zinc-300">
                      <span className="text-zinc-400">Estimated Arrival Time</span>
                      <span className="font-mono text-emerald-400 font-medium">
                        {dropPoint?.required_finish_datetime
                          ? new Date(dropPoint.required_finish_datetime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "30–45 mins"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 text-zinc-300">
                      <span className="text-zinc-400">Weight Surcharge</span>
                      <span className="font-mono text-white">{formatCurrency(order.weight_fee_amount || 0)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center space-y-3">
                  <Navigation className="h-7 w-7 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400">
                    Click <strong>Calculate Fare</strong> above to test price quotes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
