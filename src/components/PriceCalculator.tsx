import React, { useState, useEffect } from "react";
import { Calculator, Loader2, Navigation, ArrowUpRight, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { formatCurrency } from "../lib/utils";

interface ConfigData {
  borzo: { baseUrl: string; tokenMasked: string };
  kitchen: { address: string; phone: string; name: string };
}

export function PriceCalculator({ config }: { config: ConfigData | null }) {
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [dropAddress, setDropAddress] = useState("");
  const [dropPhone, setDropPhone] = useState("919820000001");
  const [dropName, setDropName] = useState("Recipient");
  const [matter, setMatter] = useState("Nepali Tales Food Parcel");
  const [vehicleTypeId, setVehicleTypeId] = useState(8);
  const [weightKg, setWeightKg] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config?.kitchen) {
      setPickupAddress(config.kitchen.address);
      setPickupPhone(config.kitchen.phone);
    }
  }, [config]);

  const handleCalculate = async () => {
    if (!dropAddress) {
      setError("Please enter a destination address.");
      return;
    }

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
    ? (dropPoint.previous_point_driving_distance_meters / 1000).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left White Bento Card: Parameters */}
        <Card className="lg:col-span-7 p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#111214]">Delivery Parameters</h2>
              <p className="text-xs text-zinc-500">Test Borzo delivery rates for any Mumbai or Thane address</p>
            </div>
            <Badge variant="secondary">Standard v1.8</Badge>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-500 block mb-1">Destination Address</label>
              <textarea
                rows={3}
                value={dropAddress}
                onChange={(e) => setDropAddress(e.target.value)}
                placeholder="Enter landmark, society, or street address in Thane / Mumbai"
                className="w-full rounded-xl border border-zinc-200/80 bg-[#F7F8FA] p-3 text-xs text-[#111214] placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 resize-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-500 block mb-1">Vehicle Type</label>
                <select
                  value={vehicleTypeId}
                  onChange={(e) => setVehicleTypeId(Number(e.target.value))}
                  className="w-full h-9 rounded-xl border border-zinc-200/80 bg-[#F7F8FA] px-3 py-1.5 text-xs text-[#111214] focus:outline-none focus:bg-white focus:border-[#0066FF]"
                >
                  <option value={8}>Motorbike (up to 20 kg)</option>
                  <option value={7}>Walker / Bicycle (up to 10 kg)</option>
                  <option value={1}>Car / Van (up to 200 kg)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-500 block mb-1">Package Weight (kg)</label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCalculate}
              disabled={loading || !dropAddress}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              Calculate Live Fare
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Right Bento Stack: Obsidian Hero Quote Card + Breakdown Card */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-[24px] bg-gradient-to-br from-[#1C1D22] via-[#111214] to-[#08090B] text-white p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Estimated Borzo Fare</span>
              {distanceKm && (
                <span className="inline-flex items-center rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 font-mono">
                  {distanceKm} km route
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#0066FF] mx-auto" />
                <p className="text-xs text-zinc-400">Querying real-time distance & rates...</p>
              </div>
            ) : order ? (
              <div className="space-y-4">
                <div className="text-4xl font-bold tracking-tight tabular-nums leading-none">
                  {formatCurrency(order.payment_amount)}
                </div>
                <div className="text-xs text-zinc-400">
                  Pickup arrival window:{" "}
                  <span className="text-emerald-400 font-semibold font-mono">
                    {dropPoint?.required_finish_datetime
                      ? new Date(dropPoint.required_finish_datetime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "30–45 mins"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-1.5">
                <Navigation className="h-6 w-6 text-zinc-500 mb-2" />
                <div className="text-lg font-bold text-white">No Destination Quoted</div>
                <p className="text-xs text-zinc-400">
                  Enter any destination address on the left and click Calculate Live Fare.
                </p>
              </div>
            )}
          </div>

          <Card className="p-5 flex-1 flex flex-col justify-center space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-zinc-100">
              <span className="text-zinc-500">Base Courier Charge</span>
              <span className="font-mono font-semibold text-[#111214]">
                {order ? formatCurrency(order.delivery_fee_amount) : "—"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-100">
              <span className="text-zinc-500">Weight Surcharge</span>
              <span className="font-mono font-semibold text-[#111214]">
                {order ? formatCurrency(order.weight_fee_amount || 0) : "—"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-500">Pickup Kitchen</span>
              <span className="font-medium text-[#111214] truncate max-w-[200px]">
                Kasarvadavali, Thane West
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
