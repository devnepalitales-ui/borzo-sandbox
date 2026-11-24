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
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { formatCurrency, formatPhone } from "../lib/utils";

// Official Nepali Tales Menu Catalog (From Nepali Tales Admin)
interface MenuItem {
  id: string;
  name: string;
  category: "Jhol Momo" | "Momo" | "Shaphaley" | "Add-on";
  type?: "Veg" | "Non-Veg";
  portion?: string;
  price: number;
}

const PRODUCTS: MenuItem[] = [
  { id: "p1", name: "Chicken Jhol Momo", category: "Jhol Momo", type: "Non-Veg", portion: "6 pcs", price: 249 },
  { id: "p2", name: "Veg Jhol momo", category: "Jhol Momo", type: "Veg", portion: "6 pcs", price: 239 },
  { id: "p3", name: "Chicken Kothey Momo", category: "Momo", type: "Non-Veg", portion: "6 pcs", price: 229 },
  { id: "p4", name: "Chicken Steamed Momo", category: "Momo", type: "Non-Veg", portion: "6 pcs", price: 210 },
  { id: "p5", name: "Veg Fried Momo", category: "Momo", type: "Veg", portion: "6 pcs", price: 229 },
  { id: "p6", name: "Veg Kothey Momo", category: "Momo", type: "Veg", portion: "6 pcs", price: 219 },
  { id: "p7", name: "Veg Steamed Momo", category: "Momo", type: "Veg", portion: "6 pcs", price: 189 },
  { id: "p8", name: "Chicken Shaphaley", category: "Shaphaley", type: "Non-Veg", portion: "2 pcs", price: 239 },
  { id: "p9", name: "Veg Shaphaley", category: "Shaphaley", type: "Veg", portion: "2 pcs", price: 210 },
];

const ADDONS: MenuItem[] = [
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

  // Recipient (Drop) - Clean empty defaults as requested
  const [dropName, setDropName] = useState("");
  const [dropPhone, setDropPhone] = useState("");
  const [dropAddress, setDropAddress] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [dropNote, setDropNote] = useState("");

  // Selected Food Items Quantities (item.id -> quantity)
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customNotes, setCustomNotes] = useState("");
  const [clientOrderId, setClientOrderId] = useState(`NT-${Math.floor(1000 + Math.random() * 9000)}`);

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
    const allItems = [...PRODUCTS, ...ADDONS];
    for (const item of allItems) {
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

  // Dynamically constructed matter string for Borzo courier
  const compiledMatter = useMemo(() => {
    if (selectedItems.length === 0) {
      return customNotes.trim() || "Food Order - Nepali Tales";
    }
    const itemStrings = selectedItems.map(
      (si) => `${si.count}x ${si.item.name}`
    );
    let str = itemStrings.join(", ");
    if (customNotes.trim()) {
      str += ` (${customNotes.trim()})`;
    }
    return str;
  }, [selectedItems, customNotes]);

  // Estimated weight based on portions (approx 0.35 kg per item)
  const weightKg = useMemo(() => {
    if (totalItemCount === 0) return 1;
    return Math.max(1, Math.min(20, Math.ceil(totalItemCount * 0.4)));
  }, [totalItemCount]);

  // Clean phone number to 91XXXXXXXXXX
  const normalizePhone = (num: string) => {
    const clean = num.replace(/\D/g, "");
    if (clean.length === 10) return `91${clean}`;
    if (clean.length === 12 && clean.startsWith("91")) return clean;
    return clean;
  };

  // Calculate Real Live Delivery Rate
  const handleCalculate = async (overrideAddress?: string) => {
    const targetAddress = overrideAddress || dropAddress;
    if (!targetAddress || !pickupAddress) {
      setCalcError("Please enter a delivery destination address.");
      return;
    }

    setCalcLoading(true);
    setCalcError(null);
    setCalcResult(null);

    const payload = {
      type: "standard",
      matter: compiledMatter,
      vehicle_type_id: 8, // motorbike
      total_weight_kg: weightKg,
      points: [
        {
          address: pickupAddress,
          contact_person: { phone: normalizePhone(pickupPhone), name: config?.kitchen?.name || "Nepali Tales Kitchen" },
        },
        {
          address: targetAddress,
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

    const confirmPrompt = `Confirm Delivery Booking:\n\n• Recipient: ${dropName} (${dropPhone})\n• Address: ${dropAddress}\n• Food Items (${totalItemCount}): ${compiledMatter}\n• Food Value: ₹${foodSubtotal}\n• Delivery Fee: ₹${calcResult?.payment_amount || "Calculating..."}\n\nThis will dispatch a real Borzo motorbike courier to Nepali Tales kitchen. Proceed?`;

    if (!confirm(confirmPrompt)) return;

    setBookingLoading(true);
    setBookingError(null);
    setCreatedOrder(null);

    const normalizedDropPhone = normalizePhone(dropPhone);
    const normalizedPickupPhone = normalizePhone(pickupPhone);

    const payload = {
      type: "standard",
      matter: compiledMatter,
      vehicle_type_id: 8, // motorbike
      total_weight_kg: weightKg,
      points: [
        {
          address: pickupAddress,
          contact_person: {
            phone: normalizedPickupPhone,
            name: config?.kitchen?.name || "Nepali Tales Kitchen",
          },
          note: "Kitchen dispatch counter, Metropolis Aquaris/Rivera, Kasarvadavali, Thane West",
        },
        {
          address: dropAddress,
          contact_person: {
            phone: normalizedDropPhone,
            name: dropName,
          },
          client_order_id: clientOrderId,
          note: [
            apartmentNumber ? `Flat/Apt: ${apartmentNumber}` : "",
            buildingNumber ? `Bldg: ${buildingNumber}` : "",
            floorNumber ? `Floor: ${floorNumber}` : "",
            dropNote,
          ]
            .filter(Boolean)
            .join(" | "),
          apartment_number: apartmentNumber || null,
          building_number: buildingNumber || null,
          floor_number: floorNumber || null,
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
    (createdOrder?.order_id
      ? `https://borzodelivery.com/in/track/${createdOrder.order_id}`
      : null);

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
    return `Namaste ${dropName || "there"}! 🥟 Your authentic Nepali food order from Nepali Tales is freshly prepared and out for delivery with Borzo courier. 🛵${itemsText}\n\nTrack your courier live here:\n${trackingUrl || ""}\n\nEnjoy your meal!`;
  };

  const distanceKm = calcResult?.points?.[1]?.previous_point_driving_distance_meters
    ? (calcResult.points[1].previous_point_driving_distance_meters / 1000).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Dispatch Delivery Order
            <Badge variant="outline" className="text-zinc-400 font-mono text-[10px]">
              Motorbike &middot; up to 20kg
            </Badge>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Select authentic Nepali food items, enter recipient details, check live Borzo rates, and book courier.
          </p>
        </div>

        {createdOrder && (
          <Button variant="outline" size="sm" onClick={handleReset} className="h-8 gap-1.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Book Another Delivery
          </Button>
        )}
      </div>

      {/* Success Booking Card */}
      {createdOrder && (
        <Card className="border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-zinc-900/90 to-zinc-950 p-6 space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Borzo Delivery Order Dispatched!</h3>
                  <Badge variant="success">Confirmed</Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Courier request has been broadcasted to available drivers near Kasarvadavali.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs">
                <span className="text-zinc-500 mr-1.5">Order ID:</span>
                <span className="font-bold text-white">#{createdOrder.order_id}</span>
                {createdOrder.order_name && (
                  <span className="text-emerald-400 ml-1.5">({createdOrder.order_name})</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 space-y-1">
              <span className="text-[11px] text-zinc-400 block font-medium">Recipient</span>
              <span className="text-xs font-semibold text-white block truncate">{dropName}</span>
              <span className="text-[11px] font-mono text-zinc-400 block">{formatPhone(dropPhone)}</span>
            </div>

            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 space-y-1">
              <span className="text-[11px] text-zinc-400 block font-medium">Delivery Fare</span>
              <span className="text-base font-bold text-emerald-400 font-mono block">
                {formatCurrency(createdOrder.payment_amount)}
              </span>
              <span className="text-[11px] text-zinc-500 block">Payment: {createdOrder.payment_method || "cash"}</span>
            </div>

            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 space-y-1">
              <span className="text-[11px] text-zinc-400 block font-medium">Courier Status</span>
              <span className="text-xs font-semibold text-white capitalize block">
                {createdOrder.status || "Searching Courier"}
              </span>
              <span className="text-[11px] text-zinc-400 block truncate">
                {createdOrder.status_description || "Awaiting courier acceptance"}
              </span>
            </div>
          </div>

          {/* WhatsApp Share Card */}
          {trackingUrl && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                  Live Customer Tracking Link
                </div>
                <p className="font-mono text-xs text-zinc-200 truncate max-w-xl">
                  {trackingUrl}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a href={trackingUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm" className="h-8 gap-1.5 text-[11px]">
                    <ExternalLink className="h-3 w-3" />
                    Open Tracker
                  </Button>
                </a>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => copyToClipboard(getWhatsAppMessage(), "wa")}
                  className="h-8 gap-1.5 text-[11px]"
                >
                  {copiedWhatsApp ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedWhatsApp ? "Copied Message!" : "Copy WhatsApp Message"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Error Banners */}
      {bookingError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Booking Failed:</span>
            <pre className="font-mono text-[11px] whitespace-pre-wrap">{bookingError}</pre>
          </div>
        </div>
      )}

      {calcError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-medium">Calculation Notice:</span>
            <p className="text-[11px] text-amber-300/90">{calcError}</p>
          </div>
        </div>
      )}

      {/* 2-Column Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step 1: Destination Form Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Delivery Destination</CardTitle>
                  <CardDescription>Enter recipient contact and address details.</CardDescription>
                </div>
                <Badge variant="outline" className="text-zinc-400 font-mono">Step 1</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-300">
                    Recipient Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-500" />
                    <Input
                      placeholder="e.g. Diwash Pradhan"
                      value={dropName}
                      onChange={(e) => setDropName(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-300">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-500" />
                    <Input
                      placeholder="e.g. 9820000001"
                      value={dropPhone}
                      onChange={(e) => setDropPhone(e.target.value)}
                      className="pl-8 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-zinc-300">
                    Street Delivery Address <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCalculate()}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                  >
                    Calculate Rate
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="h-3.5 w-3.5 absolute left-3 top-3 text-zinc-500" />
                  <textarea
                    rows={2}
                    placeholder="Apartment/Society name, street, area, Thane West, Maharashtra"
                    value={dropAddress}
                    onChange={(e) => setDropAddress(e.target.value)}
                    onBlur={() => {
                      if (dropAddress) handleCalculate();
                    }}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  Borzo geocodes this address to route your motorbike courier.
                </p>
              </div>

              {/* Apartment / Flat / Floor */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-400">Flat / Apt #</label>
                  <Input
                    placeholder="e.g. 405"
                    value={apartmentNumber}
                    onChange={(e) => setApartmentNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-400">Wing / Bldg</label>
                  <Input
                    placeholder="e.g. Wing B"
                    value={buildingNumber}
                    onChange={(e) => setBuildingNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-400">Floor #</label>
                  <Input
                    placeholder="e.g. 4th"
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">Instructions for Driver</label>
                <Input
                  placeholder="e.g. Ring bell / Leave at security gate"
                  value={dropNote}
                  onChange={(e) => setDropNote(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Food Items & Menu Selection Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-rose-500" />
                    Food Items & Add-ons
                  </CardTitle>
                  <CardDescription>Select dishes and extras to include in this delivery.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {totalItemCount > 0 && (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {totalItemCount} {totalItemCount === 1 ? "item" : "items"} (₹{foodSubtotal})
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-zinc-400 font-mono">Step 2</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-6">
              {/* Products Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <span>Menu Products ({PRODUCTS.length})</span>
                  <span className="text-[11px] font-normal normal-case text-zinc-500">6 pcs portion</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRODUCTS.map((prod) => {
                    const qty = quantities[prod.id] || 0;
                    const isVeg = prod.type === "Veg";
                    return (
                      <div
                        key={prod.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          qty > 0
                            ? "border-rose-500/40 bg-rose-500/5 text-zinc-100"
                            : "border-zinc-800/80 bg-zinc-950/50 hover:border-zinc-700/80"
                        }`}
                      >
                        <div className="space-y-0.5 pr-2 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                isVeg ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            <span className="text-xs font-semibold text-zinc-200 truncate block">
                              {prod.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                            <span className="font-semibold text-zinc-100">₹{prod.price}</span>
                            <span className="text-zinc-600">&middot;</span>
                            <span className="text-zinc-500">{prod.portion}</span>
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {qty > 0 ? (
                            <>
                              <button
                                type="button"
                                onClick={() => updateQuantity(prod.id, -1)}
                                className="h-7 w-7 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold font-mono text-white">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(prod.id, 1)}
                                className="h-7 w-7 rounded-md bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateQuantity(prod.id, 1)}
                              className="h-7 px-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3 text-zinc-400" />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add-ons Section */}
              <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Chutneys & Add-ons ({ADDONS.length})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ADDONS.map((addon) => {
                    const qty = quantities[addon.id] || 0;
                    return (
                      <div
                        key={addon.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          qty > 0
                            ? "border-rose-500/40 bg-rose-500/5 text-zinc-100"
                            : "border-zinc-800/80 bg-zinc-950/50 hover:border-zinc-700/80"
                        }`}
                      >
                        <div className="space-y-0.5 pr-2 min-w-0">
                          <span className="text-xs font-semibold text-zinc-200 truncate block">
                            {addon.name}
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-zinc-100 block">
                            ₹{addon.price}
                          </span>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {qty > 0 ? (
                            <>
                              <button
                                type="button"
                                onClick={() => updateQuantity(addon.id, -1)}
                                className="h-7 w-7 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold font-mono text-white">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(addon.id, 1)}
                                className="h-7 w-7 rounded-md bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateQuantity(addon.id, 1)}
                              className="h-7 px-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3 text-zinc-400" />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Package Notes / Custom Items */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <label className="text-[11px] font-medium text-zinc-300 flex items-center justify-between">
                  <span>Additional Package Notes & Special Instructions</span>
                  <span className="text-[10px] text-zinc-500">Optional</span>
                </label>
                <Input
                  placeholder="e.g. Pack extra tissues / Keep upright / Hot food parcel"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              </div>

              {/* Compiled Borzo Matter Preview */}
              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800/60 text-xs space-y-1">
                <span className="text-[11px] text-zinc-500 font-medium block">
                  Courier Matter Description (Auto-generated for Borzo):
                </span>
                <p className="font-mono text-xs text-zinc-300 leading-relaxed">
                  {compiledMatter}
                </p>
                <div className="text-[10px] text-zinc-500 font-mono pt-1">
                  Estimated Weight: {weightKg} kg &middot; Standard Motorbike
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Rate & Book Courier Card */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-zinc-800/80 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Bike className="h-4 w-4 text-rose-500" />
                  Live Fare Quote
                </CardTitle>
                <Badge variant="destructive">
                  Live Borzo Rates
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Selected Food Cart Preview in Quote Card */}
              {selectedItems.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 pb-1.5 border-b border-zinc-800/80">
                    <span>Order Items ({totalItemCount})</span>
                    <span className="font-mono text-rose-400">₹{foodSubtotal}</span>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto text-xs pr-1">
                    {selectedItems.map((si) => (
                      <div key={si.item.id} className="flex items-center justify-between text-zinc-400">
                        <span className="truncate pr-2">
                          {si.count}x {si.item.name}
                        </span>
                        <span className="font-mono text-zinc-300 shrink-0">₹{si.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {calcLoading ? (
                <div className="py-10 text-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-rose-500 mx-auto" />
                  <p className="text-xs text-zinc-400">Contacting Borzo pricing engine...</p>
                </div>
              ) : calcResult ? (
                <div className="space-y-4">
                  {/* Large Price Block */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
                    <span className="text-[11px] text-zinc-400 block mb-1">Borzo Delivery Fee</span>
                    <div className="text-3xl font-black text-white font-mono tracking-tight tabular-nums">
                      {formatCurrency(calcResult.payment_amount)}
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {distanceKm && (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {distanceKm} km route
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        Motorbike
                      </Badge>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-2 text-xs divide-y divide-zinc-800/80 pt-1">
                    {foodSubtotal > 0 && (
                      <div className="flex justify-between py-1.5 text-zinc-300">
                        <span className="text-zinc-400">Food Items Subtotal</span>
                        <span className="font-mono font-medium text-white">₹{foodSubtotal}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 text-zinc-300">
                      <span className="text-zinc-400">Base Delivery Charge</span>
                      <span className="font-mono font-medium text-white">
                        {formatCurrency(calcResult.delivery_fee_amount || calcResult.payment_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 text-zinc-300">
                      <span className="text-zinc-400">Courier Arrival Window</span>
                      <span className="font-mono text-emerald-400 font-medium">
                        {calcResult.points?.[0]?.required_finish_datetime
                          ? new Date(calcResult.points[0].required_finish_datetime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Within 30–45 mins"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 text-zinc-300">
                      <span className="text-zinc-400">Payment Channel</span>
                      <span className="text-white capitalize font-mono">
                        {calcResult.payment_method || "Cash to courier"}
                      </span>
                    </div>
                  </div>

                  {/* Primary Dispatch Action */}
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleBookDelivery}
                    disabled={bookingLoading}
                    className="w-full h-11 text-xs font-bold gap-2 cursor-pointer"
                  >
                    {bookingLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Book Borzo Courier ({formatCurrency(calcResult.payment_amount)})
                  </Button>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <Navigation className="h-8 w-8 text-zinc-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-300">No destination quoted yet</p>
                    <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                      Fill in recipient address on the left and click below to view live Borzo rates.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCalculate()}
                    disabled={calcLoading || !dropAddress}
                    className="gap-1.5 text-xs cursor-pointer"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    Calculate Rate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Notice */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-3.5 text-[11px] text-zinc-400 space-y-1">
            <span className="font-semibold text-zinc-300 block flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              Live Courier Note:
            </span>
            <p className="leading-relaxed">
              When you click <strong>Book Courier</strong>, Borzo summons a motorbike courier to Nepali Tales Kitchen in Kasarvadavali. You can monitor courier arrival live or cancel anytime from the <strong>Deliveries History</strong> tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
