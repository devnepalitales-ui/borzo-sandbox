import React, { useState, useEffect, useMemo } from "react";
import {
  Send,
  MapPin,
  Phone,
  User,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Copy,
  Calculator,
  Share2,
  Navigation,
  ShieldAlert,
  Check,
  RotateCcw,
  Bike,
  Plus,
  Minus,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { formatCurrency, formatPhone } from "../lib/utils";

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

  // Menu Category Filter & Selection
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Momo" | "Shaphaley" | "Add-on">("All");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customNotes, setCustomNotes] = useState("");
  const [clientOrderId, setClientOrderId] = useState(`NT-${Math.floor(1000 + Math.random() * 9000)}`);

  // Delivery Fee Payer Toggle: "kitchen" (founder pays) or "customer" (recipient pays)
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  useEffect(() => {
    if (config?.kitchen) {
      setPickupAddress(config.kitchen.address);
      setPickupPhone(config.kitchen.phone);
    }
  }, [config]);

  // Handle Menu Item Quantity Changes
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

  // Compute selected items breakdown, subtotal, and matter string
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

  // Calculate Real Live Delivery Rate
  const handleCalculate = async () => {
    if (!dropAddress || !pickupAddress) {
      setCalcError("Please enter a street delivery address.");
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

  // Book Borzo Delivery
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

  const copyToClipboard = (text: string, type: "link" | "wa") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2000);
    }
  };

  const getWhatsAppMessage = () => {
    const itemsText = selectedItems.length > 0 ? `\nItems: ${compiledMatter}` : "";
    const paymentNote =
      paymentPayer === "customer" && calcResult?.payment_amount
        ? `\n💰 Delivery Fee: ₹${calcResult.payment_amount} (to be paid in cash to the rider)`
        : "";
    return `Namaste ${dropName || "there"}! 🥟 Your authentic Nepali food order from Nepali Tales is freshly prepared and out for delivery with Borzo courier. 🛵${itemsText}${paymentNote}\n\nTrack your courier live here:\n${trackingUrl || ""}\n\nEnjoy your meal!`;
  };

  const distanceKm = calcResult?.points?.[1]?.previous_point_driving_distance_meters
    ? (calcResult.points[1].previous_point_driving_distance_meters / 1000).toFixed(1)
    : null;

  // Filtered menu items by category
  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === "All") return MENU_ITEMS;
    return MENU_ITEMS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Top Banner / Reset */}
      {createdOrder && (
        <Card className="border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-zinc-900/90 to-zinc-950 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Borzo Courier Dispatched!</h3>
                  <Badge variant="success">Confirmed</Badge>
                </div>
                <p className="text-xs text-zinc-400">Order ID: #{createdOrder.order_id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="h-8 gap-1.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                New Dispatch
              </Button>
            </div>
          </div>

          {trackingUrl && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
              <span className="font-mono text-zinc-200 truncate">{trackingUrl}</span>
              <div className="flex items-center gap-2 shrink-0">
                <a href={trackingUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm" className="h-7 text-xs">Open</Button>
                </a>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => copyToClipboard(getWhatsAppMessage(), "wa")}
                  className="h-7 text-xs"
                >
                  {copiedWhatsApp ? "Copied!" : "WhatsApp Update"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Error Banners */}
      {bookingError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Booking Failed:</span>
            <pre className="font-mono text-[11px] whitespace-pre-wrap">{bookingError}</pre>
          </div>
        </div>
      )}

      {calcError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{calcError}</span>
        </div>
      )}

      {/* 3-COLUMN ZERO-SCROLL DISPATCH TERMINAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* COLUMN 1 (4 cols): Delivery Destination */}
        <Card className="lg:col-span-4 p-4 space-y-3 border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                1. Delivery Destination
              </span>
            </div>
            <button
              type="button"
              onClick={handleCalculate}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              Check Rate
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-zinc-400 block mb-1">
                  Recipient Name *
                </label>
                <Input
                  placeholder="e.g. Diwash Pradhan"
                  value={dropName}
                  onChange={(e) => setDropName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-zinc-400 block mb-1">
                  Phone Number *
                </label>
                <Input
                  placeholder="e.g. 9820000001"
                  value={dropPhone}
                  onChange={(e) => setDropPhone(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-zinc-400 block mb-1">
                Street Address in Thane / Mumbai *
              </label>
              <textarea
                rows={2}
                placeholder="Apartment, street name, area, Thane West"
                value={dropAddress}
                onChange={(e) => setDropAddress(e.target.value)}
                onBlur={() => {
                  if (dropAddress) handleCalculate();
                }}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-0.5">Flat/Apt</label>
                <Input
                  placeholder="405"
                  value={apartmentNumber}
                  onChange={(e) => setApartmentNumber(e.target.value)}
                  className="h-7 text-xs px-2"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-0.5">Wing/Bldg</label>
                <Input
                  placeholder="Wing B"
                  value={buildingNumber}
                  onChange={(e) => setBuildingNumber(e.target.value)}
                  className="h-7 text-xs px-2"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-0.5">Floor</label>
                <Input
                  placeholder="4th"
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(e.target.value)}
                  className="h-7 text-xs px-2"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">Driver Note (Optional)</label>
              <Input
                placeholder="e.g. Ring doorbell / Leave at gate"
                value={dropNote}
                onChange={(e) => setDropNote(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>
        </Card>

        {/* COLUMN 2 (5 cols): Food Items & Add-ons (Zero Scroll Menu) */}
        <Card className="lg:col-span-5 p-4 space-y-3 border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                2. Select Food Items
              </span>
            </div>
            {totalItemCount > 0 && (
              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                {totalItemCount} selected (₹{foodSubtotal})
              </Badge>
            )}
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(["All", "Momo", "Shaphaley", "Add-on"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80"
                }`}
              >
                {cat === "All" ? `All (${MENU_ITEMS.length})` : cat}
              </button>
            ))}
          </div>

          {/* Compact Menu Grid - Viewport Fitted */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[380px] overflow-y-auto pr-0.5">
            {filteredMenuItems.map((item) => {
              const qty = quantities[item.id] || 0;
              const isVeg = item.type === "Veg";
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                    qty > 0
                      ? "border-rose-500/50 bg-rose-500/10 text-zinc-100"
                      : "border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700/80"
                  }`}
                >
                  <div className="min-w-0 pr-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      {item.type && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            isVeg ? "bg-emerald-400" : "bg-rose-500"
                          }`}
                        />
                      )}
                      <span className="text-xs font-semibold text-zinc-200 truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 mt-0.5">
                      <span className="font-bold text-white">₹{item.price}</span>
                      {item.portion && (
                        <>
                          <span className="text-zinc-600">&middot;</span>
                          <span className="text-zinc-500">{item.portion}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Plus / Minus Counter */}
                  <div className="flex items-center gap-1 shrink-0">
                    {qty > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold font-mono text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-6 w-6 rounded bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-6 px-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5 text-zinc-400" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick packaging note */}
          <div>
            <Input
              placeholder="Packaging note (e.g. extra dip, keep upright)"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="h-7 text-[11px]"
            />
          </div>
        </Card>

        {/* COLUMN 3 (3 cols): Quote, Receipt & 1-Click Book */}
        <Card className="lg:col-span-3 p-4 space-y-4 border-zinc-800 bg-zinc-900/90 shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                3. Live Dispatch
              </span>
            </div>
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
              Borzo Live
            </Badge>
          </div>

          {/* Selected Food Cart Mini-Receipt */}
          <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-zinc-400 font-medium text-[11px]">
              <span>Order Parcel</span>
              <span className="font-mono text-zinc-200 font-bold">₹{foodSubtotal}</span>
            </div>
            {selectedItems.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1 text-[11px] text-zinc-400 divide-y divide-zinc-900">
                {selectedItems.map((si) => (
                  <div key={si.item.id} className="flex justify-between pt-0.5">
                    <span className="truncate pr-1">{si.count}x {si.item.name}</span>
                    <span className="font-mono text-zinc-300 shrink-0">₹{si.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-zinc-600 italic">No food items added yet</p>
            )}
          </div>

          {/* Delivery Fee Payer Toggle */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-zinc-300">Delivery Fee Payer</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {paymentPayer === "kitchen" ? "Paid at Kitchen" : "Collect at Door"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setPaymentPayer("kitchen")}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer text-center ${
                  paymentPayer === "kitchen"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Kitchen Pays
              </button>
              <button
                type="button"
                onClick={() => setPaymentPayer("customer")}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer text-center ${
                  paymentPayer === "customer"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Customer Pays
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">
              {paymentPayer === "kitchen"
                ? "Kitchen hands cash to rider at pickup."
                : "Rider collects delivery cash from recipient at doorstep."}
            </p>
          </div>

          {/* Fare Calculator Output */}
          {calcLoading ? (
            <div className="py-6 text-center space-y-1.5">
              <Loader2 className="w-5 h-5 animate-spin text-rose-500 mx-auto" />
              <p className="text-[11px] text-zinc-400">Querying Borzo rates...</p>
            </div>
          ) : calcResult ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
                <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">
                  Delivery Charge
                </span>
                <div className="text-2xl font-black text-white font-mono tracking-tight">
                  {formatCurrency(calcResult.payment_amount)}
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                  {distanceKm && (
                    <Badge variant="secondary" className="font-mono text-[9px] px-1.5 py-0">
                      {distanceKm} km
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    Motorbike
                  </Badge>
                </div>
              </div>

              {/* Dispatch Action Button */}
              <Button
                variant="primary"
                onClick={handleBookDelivery}
                disabled={bookingLoading}
                className="w-full h-10 text-xs font-bold gap-2 cursor-pointer shadow-md shadow-rose-950/40"
              >
                {bookingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Book Courier ({formatCurrency(calcResult.payment_amount)})
              </Button>
            </div>
          ) : (
            <div className="py-4 text-center space-y-2">
              <Navigation className="w-6 h-6 text-zinc-600 mx-auto" />
              <p className="text-[11px] text-zinc-500">
                Enter address on left to get live fare quote
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCalculate}
                disabled={calcLoading || !dropAddress}
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                <Calculator className="w-3 h-3" />
                Calculate Rate
              </Button>
            </div>
          )}

          {/* Quick Notice */}
          <div className="rounded-md border border-zinc-800/80 bg-zinc-950/60 p-2 text-[10px] text-zinc-500 leading-tight">
            Orders dispatch immediately to Borzo couriers near Kasarvadavali.
          </div>
        </Card>
      </div>
    </div>
  );
}
