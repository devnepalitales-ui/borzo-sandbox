import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { formatCurrency } from "../lib/utils";
import {
  DeliveryMode,
  DeliveryModeSelector,
  ScheduleWindow,
  buildDeliveryModePayload,
  getDefaultScheduleWindow,
  getDeliveryModeLabel,
} from "./DeliveryModeSelector";

interface ConfigData {
  borzo: { baseUrl: string; tokenMasked: string };
  kitchen: { address: string; phone: string; name: string };
}

export function PriceCalculator({ config }: { config: ConfigData | null }) {
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [dropAddress, setDropAddress] = useState("");
  const [dropPhone] = useState("919820000001");
  const [dropName] = useState("Recipient");
  const [matter] = useState("Nepali Tales Food Parcel");
  const [vehicleTypeId, setVehicleTypeId] = useState(8);
  const [weightKg, setWeightKg] = useState(1);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("now");
  const [schedule, setSchedule] = useState<ScheduleWindow>(getDefaultScheduleWindow);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config?.kitchen) {
      setPickupAddress(config.kitchen.address);
      setPickupPhone(config.kitchen.phone);
    }
  }, [config]);

  const handleCalculate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!dropAddress.trim()) {
      setError("Enter a destination address to calculate fare.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const payload = buildDeliveryModePayload(
      {
        type: "standard" as const,
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
      },
      deliveryMode,
      schedule
    );

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
    <div className="space-y-5">
      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left White Bento Card: Parameters */}
        <Card className="lg:col-span-7 p-5 flex flex-col">
          <form onSubmit={handleCalculate} className="flex-1 flex flex-col justify-between gap-5">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#111214] tracking-tight">Delivery parameters</h2>
                  <p className="text-xs text-zinc-600 mt-1">
                    Estimate Borzo courier rates for any Mumbai or Thane address
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  Standard v1.8
                </Badge>
              </div>

              <div className="space-y-4">
                <DeliveryModeSelector
                  mode={deliveryMode}
                  onModeChange={(nextMode) => {
                    setDeliveryMode(nextMode);
                    setResult(null);
                    setError(null);
                  }}
                  schedule={schedule}
                  onScheduleChange={(nextSchedule) => {
                    setSchedule(nextSchedule);
                    setResult(null);
                    setError(null);
                  }}
                  idPrefix="calc"
                />

                <div className="space-y-2">
                  <label htmlFor="calc-drop-address" className="text-xs font-medium text-zinc-700 block">
                    Destination address
                  </label>
                  <textarea
                    id="calc-drop-address"
                    name="dropAddress"
                    rows={3}
                    value={dropAddress}
                    onChange={(e) => {
                      setDropAddress(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Building or society, street, area, Thane / Mumbai"
                    className="w-full min-h-[88px] rounded-[10px] border border-black/[0.1] bg-[#F8F9FA] px-3 py-2.5 text-[13px] text-[#111214] placeholder:text-zinc-500 focus-visible:outline-none focus-visible:bg-white focus-visible:border-[#0066FF] focus-visible:ring-3 focus-visible:ring-[#0066FF]/12 resize-none transition-[background-color,border-color,box-shadow] duration-150"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="calc-vehicle-type" className="text-xs font-medium text-zinc-700 block">
                      Vehicle type
                    </label>
                    <div className="relative">
                      <select
                        id="calc-vehicle-type"
                        name="vehicleTypeId"
                        value={deliveryMode === "4hour" ? 8 : vehicleTypeId}
                        disabled={deliveryMode === "4hour"}
                        onChange={(e) => setVehicleTypeId(Number(e.target.value))}
                        className="appearance-none w-full h-10 rounded-[10px] border border-black/[0.1] bg-[#F8F9FA] pl-3 pr-9 text-[13px] text-[#111214] focus-visible:outline-none focus-visible:bg-white focus-visible:border-[#0066FF] focus-visible:ring-3 focus-visible:ring-[#0066FF]/12 transition-[background-color,border-color,box-shadow] duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value={8}>
                          {deliveryMode === "4hour"
                            ? "Motorbike (auto-assigned)"
                            : "Motorbike (up to 20 kg)"}
                        </option>
                        <option value={7}>Walker / Bicycle (up to 10 kg)</option>
                        <option value={1}>Car / Van (up to 200 kg)</option>
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="calc-weight-kg" className="text-xs font-medium text-zinc-700 block">
                      Package weight (kg)
                    </label>
                    <Input
                      id="calc-weight-kg"
                      name="weightKg"
                      type="number"
                      min="1"
                      max="20"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="h-10 font-mono tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Calculating live fare..." : "Calculate live fare"}
            </Button>
          </form>
        </Card>

        {/* Right Bento Stack: Obsidian Hero Quote Card + Breakdown Card */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="rounded-[20px] bg-[#111214] border border-white/10 text-white p-5 flex flex-col justify-between gap-5 min-h-[168px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-300">Estimated Borzo fare</span>
              <div className="flex items-center gap-2">
                {distanceKm && (
                  <span className="inline-flex items-center rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 font-mono tabular-nums">
                    {distanceKm} km route
                  </span>
                )}
                <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                  {getDeliveryModeLabel(deliveryMode)}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2.5 py-2" aria-busy="true">
                <div className="h-8 w-32 rounded-lg bg-white/10" />
                <p className="text-xs text-zinc-400">Querying real-time distance &amp; rates...</p>
              </div>
            ) : order ? (
              <div className="space-y-2.5">
                <div className="text-[32px] font-semibold tracking-tight tabular-nums leading-none">
                  {formatCurrency(order.payment_amount)}
                </div>
                <div className="text-xs text-zinc-400">
                  Pickup arrival window{" "}
                  <span className="text-emerald-400 font-medium font-mono tabular-nums ml-1">
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
              <div className="space-y-1.5 py-1">
                <div className="text-lg font-semibold tracking-tight text-white">No destination quoted</div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-[36ch]">
                  Enter a destination address and calculate fare to preview pricing.
                </p>
              </div>
            )}
          </div>

          <Card className="p-5 flex-1 flex flex-col justify-center">
            <div className="divide-y divide-black/[0.06] text-xs">
              <div className="flex items-center justify-between gap-4 pb-3.5">
                <span className="text-zinc-600">Base courier charge</span>
                <span className="font-mono font-semibold text-[#111214] tabular-nums">
                  {order ? formatCurrency(order.delivery_fee_amount) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 py-3.5">
                <span className="text-zinc-600">Weight surcharge</span>
                <span className="font-mono font-semibold text-[#111214] tabular-nums">
                  {order ? formatCurrency(order.weight_fee_amount || 0) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-3.5">
                <span className="text-zinc-600">Pickup kitchen</span>
                <span className="font-medium text-[#111214] text-right">
                  Kasarvadavali, Thane West
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
