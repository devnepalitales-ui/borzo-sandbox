import React, { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { formatCurrency } from "../lib/utils";

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

  // Delivery Fee Payer Toggle
  const [paymentPayer, setPaymentPayer] = useState<"kitchen" | "customer">("kitchen");

  // Live Calculation State
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Booking Execution State
  const [bookingLoading, setBookingLoading] = useState(false);
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
    if (!dropAddress || !pickupAddress) {
      setCalcError("Please enter a street delivery address first.");
      return;
    }

    setCalcLoading(true);
    setCalcError(null);
    setCalcResult(null);

    const payload = {
      type: "standard",
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

  const handleBookDelivery = async () => {
    if (!dropAddress || !dropPhone || !dropName) {
      setBookingError("Please provide recipient Name, Phone number, and Delivery Address.");
      return;
    }

    const confirmPrompt = `Confirm Delivery Booking:\n\n• Recipient: ${dropName} (${dropPhone})\n• Address: ${dropAddress}\n• Food Items (${totalItemCount}): ${compiledMatter}\n• Food Value: ₹${foodSubtotal}\n• Delivery Fee: ₹${calcResult?.payment_amount || "Calculating..."}\n• Delivery Fee Paid By: ${paymentPayer === "kitchen" ? "Kitchen / Founder (at pickup)" : "Customer (at doorstep)"}\n\nProceed to dispatch Borzo motorbike courier?`;

    if (!confirm(confirmPrompt)) return;

    setBookingLoading(true);
    setBookingError(null);
    setCreatedOrder(null);

    const payload = {
      type: "standard",
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
    };

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
        ? `\n💰 Delivery Fee: ₹${calcResult.payment_amount} (to be paid in cash to the rider)`
        : "";
    const msg = `Namaste ${dropName || "there"}! 🥟 Your authentic Nepali food order from Nepali Tales is freshly prepared and out for delivery with Borzo courier. 🛵${itemsText}${paymentNote}\n\nTrack your courier live here:\n${trackingUrl || ""}\n\nEnjoy your meal!`;
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
        <Card className="p-5 bg-emerald-50/90 border-emerald-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-[#111214]">Borzo Courier Dispatched</h3>
                <Badge variant="success">Order #{createdOrder.order_id}</Badge>
              </div>
              <p className="text-xs text-zinc-600">
                Courier requested for pickup at Thane West kitchen &middot; {formatCurrency(createdOrder.payment_amount)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {trackingUrl && (
                <>
                  <a href={trackingUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      Open Tracker
                    </Button>
                  </a>
                  <Button variant="primary" size="sm" onClick={copyWhatsApp}>
                    {copiedWhatsApp ? "Copied!" : "WhatsApp Update"}
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

      {/* Alerts */}
      {bookingError && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <pre className="font-mono text-[11px] whitespace-pre-wrap">{bookingError}</pre>
        </div>
      )}
      {calcError && (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          {calcError}
        </div>
      )}

      {/* ROW 1: ASYMMETRIC BENTO HERO ROW (Destination Left + Dark Quote & Sub-cards Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT BENTO TILE (6 cols): Delivery Destination */}
        <Card className="lg:col-span-6 p-6 flex flex-col justify-between gap-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#111214] tracking-tight">Delivery Destination</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Enter recipient contact and street address</p>
            </div>
            <button
              type="button"
              onClick={handleCalculate}
              disabled={calcLoading}
              className="h-8 rounded-full bg-[#F3F4F6] hover:bg-zinc-200/80 px-3.5 text-[11px] font-semibold text-[#111214] transition-colors cursor-pointer shrink-0 disabled:opacity-60"
            >
              {calcLoading ? "Checking..." : "Check Rate"}
            </button>
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="drop-name" className="text-xs font-medium text-zinc-600 block">
                  Recipient Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="drop-name"
                  placeholder="e.g. Ankit Bhavarthe"
                  value={dropName}
                  onChange={(e) => setDropName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="drop-phone" className="text-xs font-medium text-zinc-600 block">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="drop-phone"
                  type="tel"
                  placeholder="e.g. 9309348875"
                  value={dropPhone}
                  onChange={(e) => setDropPhone(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="drop-address" className="text-xs font-medium text-zinc-600 block">
                Street Delivery Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="drop-address"
                rows={2}
                placeholder="Apartment/Society name, street, area, Thane / Mumbai"
                value={dropAddress}
                onChange={(e) => setDropAddress(e.target.value)}
                onBlur={() => {
                  if (dropAddress) handleCalculate();
                }}
                className="w-full min-h-[68px] rounded-xl border border-zinc-200/90 bg-[#F7F8FA] px-3.5 py-2.5 text-xs text-[#111214] placeholder:text-zinc-500 focus-visible:outline-none focus-visible:bg-white focus-visible:border-[#0066FF] focus-visible:ring-2 focus-visible:ring-[#0066FF]/20 resize-none transition-colors"
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
                placeholder="Floor #"
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
          </div>
        </Card>

        {/* RIGHT BENTO STACK (6 cols): Black Hero Quote Card + Dual Bento Sub-Cards */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* TOP HERO OBSIDIAN CARD */}
          <div className="rounded-[24px] bg-gradient-to-br from-[#1C1D22] via-[#111214] to-[#08090B] text-white p-6 shadow-sm flex flex-col justify-between gap-5 min-h-[164px]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-300">Live Borzo Quote</span>
                {distanceKm && (
                  <span className="inline-flex items-center rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 font-mono">
                    {distanceKm} km
                  </span>
                )}
              </div>
              <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-zinc-300">
                Motorbike &middot; Standard
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                {calcLoading ? (
                  <div className="space-y-2 py-0.5" aria-busy="true">
                    <div className="h-8 w-28 rounded-lg bg-white/10 animate-pulse" />
                    <span className="text-xs text-zinc-400 block">Calculating live rate...</span>
                  </div>
                ) : calcResult ? (
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums leading-none">
                      {formatCurrency(calcResult.payment_amount)}
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">
                      {calcResult.points?.[0]?.required_finish_datetime
                        ? `Pickup arrival by ${new Date(calcResult.points[0].required_finish_datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : "Live Borzo Motorbike Courier"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-white">Ready to Quote</div>
                    <p className="text-xs text-zinc-400 mt-1.5">
                      Add recipient address on the left to calculate live delivery cost
                    </p>
                  </div>
                )}
              </div>

              {/* Electric Cobalt Blue Primary Pill Button */}
              {calcResult ? (
                <button
                  type="button"
                  onClick={handleBookDelivery}
                  disabled={bookingLoading}
                  className="inline-flex items-center justify-center rounded-full bg-[#0066FF] hover:bg-[#0052D4] disabled:bg-white/15 disabled:text-zinc-400 text-white font-semibold text-xs h-10 px-5 transition-colors cursor-pointer shrink-0 shadow-md shadow-blue-950/50 active:scale-[0.98]"
                >
                  {bookingLoading ? "Booking Courier..." : "Book Courier"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={calcLoading || !dropAddress.trim()}
                  className="inline-flex items-center justify-center rounded-full bg-[#0066FF] hover:bg-[#0052D4] disabled:bg-white/15 disabled:text-zinc-400 text-white font-semibold text-xs h-10 px-5 transition-colors cursor-pointer shrink-0"
                >
                  {calcLoading ? "Calculating..." : "Calculate Fare"}
                </button>
              )}
            </div>
          </div>

          {/* BOTTOM SUB-ROW: White Metric Tile + Black Payer Toggle Tile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
            <Card className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-500">Order Parcel</span>
                <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[10px] font-semibold text-zinc-700 font-mono">
                  {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="text-3xl font-bold text-[#111214] tabular-nums tracking-tight">
                ₹{foodSubtotal}
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Est. weight: {weightKg} kg</span>
                <span className="text-emerald-600 font-semibold">Ready to pack</span>
              </div>
            </Card>

            <div className="rounded-[24px] bg-[#111214] text-white p-5 flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-zinc-300">
                  Delivery Fee Payer
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {paymentPayer === "kitchen" ? "At Pickup" : "At Door"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/[0.07] rounded-full">
                <button
                  type="button"
                  onClick={() => setPaymentPayer("kitchen")}
                  aria-pressed={paymentPayer === "kitchen"}
                  className={`py-2 px-2.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer text-center ${
                    paymentPayer === "kitchen"
                      ? "bg-[#0066FF] text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Kitchen Pays
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPayer("customer")}
                  aria-pressed={paymentPayer === "customer"}
                  className={`py-2 px-2.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer text-center ${
                    paymentPayer === "customer"
                      ? "bg-[#0066FF] text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Customer Pays
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 leading-snug">
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
        <Card className="lg:col-span-8 p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#111214] tracking-tight">Select Food Items & Add-ons</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Tap Add to include dishes or chutneys in this parcel</p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(["All", "Momo", "Shaphaley", "Add-on"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                  className={`h-8 px-3.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#111214] text-white"
                      : "bg-[#F3F4F6] text-zinc-600 hover:text-[#111214] hover:bg-zinc-200/70"
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
                  className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-2xl border transition-colors ${
                    qty > 0
                      ? "bg-[#EEF4FF] border-[#0066FF]/40"
                      : "bg-[#F7F8FA] border-black/[0.04] hover:border-zinc-300"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.type && (
                        <>
                          <span
                            title={item.type}
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              isVeg ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          <span className="sr-only">{item.type}</span>
                        </>
                      )}
                      <span className="text-xs font-semibold text-[#111214] truncate">{item.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5 mt-1">
                      <span className="font-bold text-[#111214]">₹{item.price}</span>
                      {item.portion && (
                        <>
                          <span>&middot;</span>
                          <span>{item.portion}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Clean Icon-free Quantity Stepper */}
                  <div className="flex items-center gap-1 shrink-0">
                    {qty > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="h-7 w-7 rounded-full bg-white border border-zinc-200 hover:bg-zinc-100 text-[#111214] text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-xs font-bold font-mono tabular-nums text-[#111214]">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="h-7 w-7 rounded-full bg-[#0066FF] hover:bg-[#0052D4] text-white text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-7 px-3 rounded-full bg-white hover:bg-[#111214] hover:text-white border border-zinc-200/90 text-[#111214] text-[11px] font-semibold cursor-pointer transition-colors"
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
        <Card className="lg:col-span-4 p-6 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#111214] tracking-tight">Parcel Summary</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Sent to courier manifest</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700 font-mono tabular-nums">
              ₹{foodSubtotal}
            </span>
          </div>

          {/* Items Breakdown List */}
          <div className="flex-1 rounded-2xl bg-[#F7F8FA] p-4 border border-black/[0.04] flex flex-col justify-between gap-3">
            {selectedItems.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs divide-y divide-zinc-200/70">
                {selectedItems.map((si) => (
                  <div key={si.item.id} className="flex justify-between pt-1.5 first:pt-0 text-[#111214]">
                    <span className="truncate pr-2 font-medium">
                      {si.count}x {si.item.name}
                    </span>
                    <span className="font-mono font-semibold tabular-nums shrink-0">₹{si.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-zinc-500">
                No items selected yet. Select <strong>Add</strong> on the menu.
              </div>
            )}

            <div className="pt-3 border-t border-zinc-200/70">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block mb-1">
                Courier Matter String
              </span>
              <p className="font-mono text-[11px] text-zinc-600 line-clamp-2">{compiledMatter}</p>
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
