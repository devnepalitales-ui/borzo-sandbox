import React, { useState, useEffect, useMemo } from "react";
import { Plus, Minus, Check, ExternalLink, Copy } from "lucide-react";
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

interface MenuItem {
  id: string;
  name: string;
  category: "Momo" | "Shaphaley" | "Add-on";
  type?: "Veg" | "Non-Veg";
  portion?: string;
  price: number;
}

const MENU_ITEMS: MenuItem[] = [
  // Momos
  { id: "p1", name: "Chicken Jhol Momo", category: "Momo", type: "Non-Veg", portion: "6 pcs", price: 249 },
  { id: "p2", name: "Veg Jhol momo", category: "Momo", type: "Veg", portion: "6 pcs", price: 239 },
  { id: "p3", name: "Chicken Kothey Momo", category: "Momo", type: "Non-Veg", portion: "6 pcs", price: 229 },
  { id: "p4", name: "Chicken Steamed Momo", category: "Momo", type: "Non-Veg", portion: "6 pcs", price: 210 },
  { id: "p5", name: "Veg Fried Momo", category: "Momo", type: "Veg", portion: "6 pcs", price: 229 },
  { id: "p6", name: "Veg Kothey Momo", category: "Momo", type: "Veg", portion: "6 pcs", price: 219 },
  { id: "p7", name: "Veg Steamed Momo", category: "Momo", type: "Veg", portion: "6 pcs", price: 189 },
  // Shaphaley
  { id: "p8", name: "Chicken Shaphaley", category: "Shaphaley", type: "Non-Veg", portion: "2 pcs", price: 239 },
  { id: "p9", name: "Veg Shaphaley", category: "Shaphaley", type: "Veg", portion: "2 pcs", price: 210 },
  // Add-ons
  { id: "a1", name: "Chilli Oil", category: "Add-on", price: 50 },
  { id: "a2", name: "Red Spicy Chutney", category: "Add-on", price: 20 },
  { id: "a3", name: "Peanut Chutney", category: "Add-on", price: 20 },
  { id: "a4", name: "Jhol", category: "Add-on", price: 50 },
];

interface ConfigData {
  borzo: { env: string; baseUrl: string; tokenMasked: string; clientId: string };
  kitchen: { address: string; phone: string; name: string };
}

export function CreateOrder({
  config,
  onOrderCreated,
}: {
  config: ConfigData | null;
  onOrderCreated?: () => void;
}) {
  // Kitchen (Pickup)
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");

  // Recipient (Drop)
  const [dropName, setDropName] = useState("");
  const [dropPhone, setDropPhone] = useState("");
  const [dropAddress, setDropAddress] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [dropNote, setDropNote] = useState("");

  // Menu Selection
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Momo" | "Shaphaley" | "Add-on">("All");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customNotes, setCustomNotes] = useState("");
  const [clientOrderId, setClientOrderId] = useState(`NT-${Math.floor(1000 + Math.random() * 9000)}`);

  // Delivery Fee Payer & Speed Toggle
  const [paymentPayer, setPaymentPayer] = useState<"kitchen" | "customer">("kitchen");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("now");
  const [schedule, setSchedule] = useState<ScheduleWindow>(getDefaultScheduleWindow);

  // Live Calculation State
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Booking Execution State
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmingBooking, setConfirmingBooking] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // UI state
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  useEffect(() => {
    if (config?.kitchen) {
      setPickupAddress(config.kitchen.address);
      setPickupPhone(config.kitchen.phone);
    }
  }, [config]);

  // Dismiss inline booking confirmation whenever dispatch inputs change
  useEffect(() => {
    setConfirmingBooking(false);
  }, [dropName, dropPhone, dropAddress, paymentPayer, quantities, deliveryMode, schedule]);

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[id];
      } else {
        updated[id] = next;
      }
      return updated;
    });
  };

  const selectedItems = useMemo(() => {
    const list: Array<{ item: MenuItem; count: number; total: number }> = [];
    for (const item of MENU_ITEMS) {
      const count = quantities[item.id] || 0;
      if (count > 0) {
        list.push({ item, count, total: count * item.price });
      }
    }
    return list;
  }, [quantities]);

  const foodSubtotal = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + curr.total, 0);
  }, [selectedItems]);

  const totalItemCount = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + curr.count, 0);
  }, [selectedItems]);

  const compiledMatter = useMemo(() => {
    if (selectedItems.length === 0) {
      return customNotes.trim() || "Food Order - Nepali Tales";
    }
    const itemStrings = selectedItems.map((si) => `${si.count}x ${si.item.name}`);
    let str = itemStrings.join(", ");
    if (customNotes.trim()) {
      str += ` (${customNotes.trim()})`;
    }
    return str;
  }, [selectedItems, customNotes]);

  const weightKg = useMemo(() => {
    if (totalItemCount === 0) return 1;
    return Math.max(1, Math.min(20, Math.ceil(totalItemCount * 0.4)));
  }, [totalItemCount]);

  const normalizePhone = (num: string) => {
    const clean = num.replace(/\D/g, "");
    if (clean.length === 10) return `91${clean}`;
    if (clean.length === 12 && clean.startsWith("91")) return clean;
    return clean;
  };

  const handleCalculate = async () => {
    if (!dropAddress.trim() || !pickupAddress.trim()) {
      setCalcError("Enter a street delivery address to check the live rate.");
      return;
    }

    setCalcLoading(true);
    setCalcError(null);
    setCalcResult(null);
    setConfirmingBooking(false);

    const payload = buildDeliveryModePayload(
      {
        type: "standard" as const,
        matter: compiledMatter,
        vehicle_type_id: 8,
        total_weight_kg: weightKg,
        points: [
          {
            address: pickupAddress,
            contact_person: { phone: normalizePhone(pickupPhone), name: config?.kitchen?.name || "Nepali Tales Kitchen" },
          },
          {
            address: dropAddress,
            contact_person: { phone: normalizePhone(dropPhone) || "919820000001", name: dropName || "Recipient" },
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
        const errorMsg = data.errors?.join(", ") || "Rate calculation failed";
        const paramErrors = data.parameter_errors ? JSON.stringify(data.parameter_errors, null, 2) : "";
        setCalcError(`${errorMsg}${paramErrors ? `:\n${paramErrors}` : ""}`);
      } else {
        setCalcResult(data.order);
      }
    } catch (err: any) {
      setCalcError(err?.message || "Failed to calculate delivery fee");
    } finally {
      setCalcLoading(false);
    }
  };

  const handleRequestDispatch = () => {
    if (!dropName.trim() || !dropPhone.trim() || !dropAddress.trim()) {
      setBookingError("Enter recipient name, phone number, and street address before booking.");
      return;
    }
    setBookingError(null);
    setConfirmingBooking(true);
  };

  const handleConfirmBookDelivery = async () => {
    if (!dropName.trim() || !dropPhone.trim() || !dropAddress.trim()) {
      setBookingError("Enter recipient name, phone number, and street address before booking.");
      setConfirmingBooking(false);
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    setCreatedOrder(null);

    const payload = buildDeliveryModePayload(
      {
        type: "standard" as const,
        matter: compiledMatter,
        vehicle_type_id: 8,
        total_weight_kg: weightKg,
        payment_method: "cash",
        points: [
          {
            address: pickupAddress,
            contact_person: {
              phone: normalizePhone(pickupPhone),
              name: config?.kitchen?.name || "Nepali Tales Kitchen",
            },
            note: "Kitchen dispatch counter, Metropolis Aquaris Phase 2, Kasarvadavali, Thane West",
            is_order_payment_here: paymentPayer === "kitchen",
          },
          {
            address: dropAddress,
            contact_person: {
              phone: normalizePhone(dropPhone),
              name: dropName,
            },
            client_order_id: clientOrderId,
            note: [
              apartmentNumber ? `Flat/Apt: ${apartmentNumber}` : "",
              buildingNumber ? `Bldg: ${buildingNumber}` : "",
              floorNumber ? `Floor: ${floorNumber}` : "",
              dropNote,
              paymentPayer === "customer"
                ? `Collect ₹${calcResult?.payment_amount || ""} delivery fee cash from customer`
                : "",
            ]
              .filter(Boolean)
              .join(" | "),
            apartment_number: apartmentNumber || null,
            building_number: buildingNumber || null,
            floor_number: floorNumber || null,
            is_order_payment_here: paymentPayer === "customer",
          },
        ],
      },
      deliveryMode,
      schedule
    );

    try {
      const res = await fetch("/api/borzo/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.is_successful) {
        const errorMsg = data.errors?.join(", ") || "Failed to create order";
        const paramErrors = data.parameter_errors ? JSON.stringify(data.parameter_errors, null, 2) : "";
        setBookingError(`${errorMsg}${paramErrors ? `:\n${paramErrors}` : ""}`);
      } else {
        setCreatedOrder(data.order);
        setConfirmingBooking(false);
        setClientOrderId(`NT-${Math.floor(1000 + Math.random() * 9000)}`);
        if (onOrderCreated) onOrderCreated();
      }
    } catch (err: any) {
      setBookingError(err?.message || "Network error while creating order");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReset = () => {
    setCreatedOrder(null);
    setCalcResult(null);
    setBookingError(null);
    setCalcError(null);
    setConfirmingBooking(false);
    setDropName("");
    setDropPhone("");
    setDropAddress("");
    setApartmentNumber("");
    setBuildingNumber("");
    setFloorNumber("");
    setDropNote("");
    setQuantities({});
    setCustomNotes("");
  };

  const trackingUrl =
    createdOrder?.points?.[1]?.tracking_url ||
    createdOrder?.points?.[0]?.tracking_url ||
    (createdOrder?.order_id ? `https://borzodelivery.com/in/track/${createdOrder.order_id}` : null);

  const copyWhatsApp = () => {
    const itemsText = selectedItems.length > 0 ? `\nItems: ${compiledMatter}` : "";
    const paymentNote =
      paymentPayer === "customer" && calcResult?.payment_amount
        ? `\nDelivery fee: ₹${calcResult.payment_amount} (to be paid in cash to the rider)`
        : "";
    const msg = `Namaste ${dropName || "there"}, your food order from Nepali Tales is freshly prepared and out for delivery with a Borzo rider.${itemsText}${paymentNote}\n\nTrack your courier live:\n${trackingUrl || ""}`;
    navigator.clipboard.writeText(msg);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };

  const distanceKm = calcResult?.points?.[1]?.previous_point_driving_distance_meters
    ? (calcResult.points[1].previous_point_driving_distance_meters / 1000).toFixed(1)
    : null;

  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === "All") return MENU_ITEMS;
    return MENU_ITEMS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="space-y-5">
      {/* Success Confirmation Bento Tile */}
      {createdOrder && (
        <Card className="p-5 bg-emerald-50 border-emerald-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-[#111214]">Courier dispatched</h3>
                <Badge variant="success" className="font-mono tabular-nums">
                  Order #{createdOrder.order_id}
                </Badge>
              </div>
              <p className="text-xs text-zinc-700">
                Pickup requested at Thane West kitchen &middot;{" "}
                <span className="font-mono tabular-nums">{formatCurrency(createdOrder.payment_amount)}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {trackingUrl && (
                <>
                  <a href={trackingUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                      <span>Open Tracker</span>
                    </Button>
                  </a>
                  <Button variant="primary" size="sm" onClick={copyWhatsApp}>
                    {copiedWhatsApp ? (
                      <>
                        <Check className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        <span>Copy WhatsApp Update</span>
                      </>
                    )}
                  </Button>
                </>
              )}
              <Button variant="secondary" size="sm" onClick={handleReset}>
                New Dispatch
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Inline Validation & API Alerts */}
      {bookingError && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          <pre className="font-mono text-xs whitespace-pre-wrap">{bookingError}</pre>
        </div>
      )}
      {calcError && (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          {calcError}
        </div>
      )}

      {/* ROW 1: ASYMMETRIC BENTO HERO ROW (Destination Left + Quote & Sub-cards Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT BENTO TILE (6 cols): Delivery Destination */}
        <Card className="lg:col-span-6 p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-[#111214] tracking-tight">Delivery destination</h2>
              <p className="text-xs text-zinc-600 mt-0.5">Recipient contact and street drop address</p>
            </div>
            <button
              type="button"
              onClick={handleCalculate}
              disabled={calcLoading}
              className="h-8 rounded-xl bg-[#F3F4F6] hover:bg-zinc-200/80 px-3 text-xs font-medium text-[#111214] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {calcLoading ? "Checking..." : "Check rate"}
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="drop-name" className="text-xs font-medium text-zinc-700 block">
                  Recipient name <span className="text-rose-600">*</span>
                </label>
                <Input
                  id="drop-name"
                  placeholder="Customer full name"
                  value={dropName}
                  onChange={(e) => {
                    setDropName(e.target.value);
                    if (bookingError) setBookingError(null);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="drop-phone" className="text-xs font-medium text-zinc-700 block">
                  Phone number <span className="text-rose-600">*</span>
                </label>
                <Input
                  id="drop-phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={dropPhone}
                  onChange={(e) => {
                    setDropPhone(e.target.value);
                    if (bookingError) setBookingError(null);
                  }}
                  className="font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="drop-address" className="text-xs font-medium text-zinc-700 block">
                Street delivery address <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="drop-address"
                rows={2}
                placeholder="Building or society, street, area, Thane / Mumbai"
                value={dropAddress}
                onChange={(e) => {
                  setDropAddress(e.target.value);
                  if (calcError) setCalcError(null);
                  if (bookingError) setBookingError(null);
                }}
                onBlur={() => {
                  if (dropAddress.trim()) handleCalculate();
                }}
                className="w-full min-h-[72px] rounded-[10px] border border-black/[0.1] bg-[#F8F9FA] px-3 py-2.5 text-[13px] text-[#111214] placeholder:text-zinc-500 focus-visible:outline-none focus-visible:bg-white focus-visible:border-[#0066FF] focus-visible:ring-3 focus-visible:ring-[#0066FF]/12 resize-none transition-[background-color,border-color,box-shadow] duration-150"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Input
                aria-label="Flat or apartment number"
                placeholder="Flat / Apt"
                value={apartmentNumber}
                onChange={(e) => setApartmentNumber(e.target.value)}
              />
              <Input
                aria-label="Wing or building name"
                placeholder="Wing / Bldg"
                value={buildingNumber}
                onChange={(e) => setBuildingNumber(e.target.value)}
              />
              <Input
                aria-label="Floor number"
                placeholder="Floor"
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
              />
              <Input
                aria-label="Driver note"
                placeholder="Driver note"
                value={dropNote}
                onChange={(e) => setDropNote(e.target.value)}
              />
            </div>

            <div className="pt-1">
              <DeliveryModeSelector
                mode={deliveryMode}
                onModeChange={(nextMode) => {
                  setDeliveryMode(nextMode);
                  setCalcResult(null);
                  setCalcError(null);
                }}
                schedule={schedule}
                onScheduleChange={(nextSchedule) => {
                  setSchedule(nextSchedule);
                  setCalcResult(null);
                  setCalcError(null);
                }}
                idPrefix="create"
              />
            </div>
          </div>
        </Card>

        {/* RIGHT BENTO STACK (6 cols): Contrast Quote Card + Dual Bento Sub-Cards */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* TOP HERO OBSIDIAN CARD */}
          <div className="rounded-[20px] bg-[#111214] border border-white/10 text-white p-5 flex flex-col justify-between gap-4 min-h-[168px]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-300">Live Borzo quote</span>
                {distanceKm && (
                  <span className="inline-flex items-center rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 font-mono tabular-nums">
                    {distanceKm} km
                  </span>
                )}
              </div>
              <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                Motorbike &middot; {getDeliveryModeLabel(deliveryMode)}
              </span>
            </div>

            {confirmingBooking && calcResult ? (
              <div className="rounded-xl bg-white/[0.06] border border-white/10 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-medium text-white truncate">
                      Dispatch to {dropName}
                    </div>
                    <div className="text-zinc-400 truncate mt-0.5">
                      {paymentPayer === "kitchen" ? "Kitchen pays at pickup" : "Customer pays at door"} &middot;{" "}
                      <span className="font-mono tabular-nums text-zinc-200">
                        {formatCurrency(calcResult.payment_amount)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingBooking(false)}
                    disabled={bookingLoading}
                    className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Keep editing
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBookDelivery}
                    disabled={bookingLoading}
                    className="h-9 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052D4] text-xs font-medium text-white transition-colors cursor-pointer disabled:opacity-50 tabular-nums"
                  >
                    {bookingLoading
                      ? "Booking courier..."
                      : `Confirm dispatch · ${formatCurrency(calcResult.payment_amount)}`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  {calcLoading ? (
                    <div className="space-y-2 py-0.5" aria-busy="true">
                      <div className="h-8 w-28 rounded-lg bg-white/10" />
                      <span className="text-xs text-zinc-400 block">Calculating live rate...</span>
                    </div>
                  ) : calcResult ? (
                    <div>
                      <div className="text-[30px] font-semibold tracking-tight tabular-nums leading-none">
                        {formatCurrency(calcResult.payment_amount)}
                      </div>
                      <p className="text-xs text-zinc-400 mt-2">
                        {calcResult.points?.[0]?.required_finish_datetime
                          ? `Pickup arrival by ${new Date(calcResult.points[0].required_finish_datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "Live Borzo motorbike courier"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xl font-semibold tracking-tight text-white">Ready to quote</div>
                      <p className="text-xs text-zinc-400 mt-1.5">
                        Enter a destination address to pull the live delivery rate
                      </p>
                    </div>
                  )}
                </div>

                {calcResult ? (
                  <button
                    type="button"
                    onClick={handleRequestDispatch}
                    disabled={bookingLoading}
                    className="inline-flex items-center justify-center rounded-xl bg-[#0066FF] hover:bg-[#0052D4] disabled:bg-white/15 disabled:text-zinc-400 text-white font-medium text-xs h-10 px-5 transition-colors cursor-pointer shrink-0"
                  >
                    {bookingLoading ? "Booking courier..." : "Book courier"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCalculate}
                    disabled={calcLoading}
                    className="inline-flex items-center justify-center rounded-xl bg-[#0066FF] hover:bg-[#0052D4] disabled:bg-white/15 disabled:text-zinc-400 text-white font-medium text-xs h-10 px-5 transition-colors cursor-pointer shrink-0"
                  >
                    {calcLoading ? "Calculating..." : "Calculate fare"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* BOTTOM SUB-ROW: White Parcel Metric Tile + Contrast Payer Toggle Tile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
            <Card className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-600">Order parcel</span>
                <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 font-mono tabular-nums">
                  {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="text-[28px] font-semibold text-[#111214] tabular-nums tracking-tight leading-none">
                {formatCurrency(foodSubtotal)}
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span className="tabular-nums">Est. weight {weightKg} kg</span>
                <span className="text-emerald-700 font-medium">Ready to pack</span>
              </div>
            </Card>

            <div className="rounded-[20px] bg-[#111214] border border-white/10 text-white p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-300">Delivery fee payer</span>
                <span className="text-xs font-mono text-zinc-400">
                  {paymentPayer === "kitchen" ? "At pickup" : "At door"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 p-1 bg-white/[0.07] rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentPayer("kitchen")}
                  aria-pressed={paymentPayer === "kitchen"}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center ${
                    paymentPayer === "kitchen"
                      ? "bg-[#0066FF] text-white"
                      : "text-zinc-300 hover:text-white"
                  }`}
                >
                  Kitchen pays
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPayer("customer")}
                  aria-pressed={paymentPayer === "customer"}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center ${
                    paymentPayer === "customer"
                      ? "bg-[#0066FF] text-white"
                      : "text-zinc-300 hover:text-white"
                  }`}
                >
                  Customer pays
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-snug">
                {paymentPayer === "kitchen"
                  ? "Kitchen hands cash to courier at pickup."
                  : "Courier collects fee cash from customer."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: WIDE MENU BENTO GRID + PARCEL RECEIPT BENTO CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* WIDE MENU BENTO CARD (8 cols) */}
        <Card className="lg:col-span-8 p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-[#111214] tracking-tight">Menu items &amp; add-ons</h2>
              <p className="text-xs text-zinc-600 mt-0.5">Include dishes and chutneys in this parcel</p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(["All", "Momo", "Shaphaley", "Add-on"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                  className={`h-8 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#111214] text-white"
                      : "bg-[#F3F4F6] text-zinc-700 hover:text-[#111214] hover:bg-zinc-200/70"
                  }`}
                >
                  {cat === "All" ? `All (${MENU_ITEMS.length})` : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {filteredMenuItems.map((item) => {
              const qty = quantities[item.id] || 0;
              const isVeg = item.type === "Veg";
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border transition-colors ${
                    qty > 0
                      ? "bg-[#EEF4FF] border-[#0066FF]/45"
                      : "bg-[#F8F9FA] border-black/[0.08] hover:border-black/20"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.type && (
                        <>
                          <span
                            title={item.type}
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              isVeg ? "bg-emerald-600" : "bg-rose-600"
                            }`}
                          />
                          <span className="sr-only">{item.type}</span>
                        </>
                      )}
                      <span className="text-xs font-medium text-[#111214] truncate">{item.name}</span>
                    </div>
                    <div className="text-xs font-mono tabular-nums text-zinc-600 flex items-center gap-1.5 mt-1">
                      <span className="font-semibold text-[#111214]">₹{item.price}</span>
                      {item.portion && (
                        <>
                          <span>&middot;</span>
                          <span className="font-sans">{item.portion}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {qty > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="h-7 w-7 rounded-lg bg-white border border-black/[0.12] hover:bg-zinc-100 text-[#111214] flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        </button>
                        <span className="w-5 text-center text-xs font-semibold font-mono tabular-nums text-[#111214]">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="h-7 w-7 rounded-lg bg-[#0066FF] hover:bg-[#0052D4] text-white flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-7 px-3 rounded-lg bg-white hover:bg-[#111214] hover:text-white border border-black/[0.1] text-[#111214] text-xs font-medium cursor-pointer transition-colors"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* RIGHT PARCEL SUMMARY BENTO CARD (4 cols — Receipt + Notes) */}
        <Card className="lg:col-span-4 p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-semibold text-[#111214] tracking-tight">Parcel summary</h2>
              <p className="text-xs text-zinc-600 mt-0.5">Included in courier manifest</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-semibold text-[#111214] font-mono tabular-nums">
              {formatCurrency(foodSubtotal)}
            </span>
          </div>

          {/* Items Breakdown List */}
          <div className="flex-1 rounded-xl bg-[#F8F9FA] p-4 border border-black/[0.08] flex flex-col justify-between gap-3">
            {selectedItems.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs divide-y divide-black/[0.06]">
                {selectedItems.map((si) => (
                  <div key={si.item.id} className="flex justify-between pt-2 first:pt-0 text-[#111214]">
                    <span className="truncate pr-2 font-medium">
                      {si.count}x {si.item.name}
                    </span>
                    <span className="font-mono font-semibold tabular-nums shrink-0">
                      {formatCurrency(si.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-zinc-600">
                No items added. Choose dishes from the menu to attach to this manifest.
              </div>
            )}

            <div className="pt-3 border-t border-black/[0.06]">
              <span className="text-xs font-medium text-zinc-600 block mb-1">
                Courier matter
              </span>
              <p className="font-mono text-xs text-zinc-700 line-clamp-2">{compiledMatter}</p>
            </div>
          </div>

          <Input
            aria-label="Packaging note"
            placeholder="Packaging note (e.g. extra dip, keep upright)"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
          />
        </Card>
      </div>
    </div>
  );
}
