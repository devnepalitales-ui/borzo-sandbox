import React, { useState, useEffect } from "react";
import {
  Send,
  MapPin,
  Phone,
  User,
  Package,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Copy,
  Calculator,
  Share2,
  Navigation,
  ShieldAlert,
  Clock,
  Check,
} from "lucide-react";

interface ConfigData {
  borzo: { env: string; baseUrl: string; tokenMasked: string; clientId: string };
  kitchen: { address: string; phone: string; name: string };
  sampleDestinations: Array<{ label: string; address: string; phone: string; name: string }>;
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
  const [dropNote, setDropNote] = useState("Please call upon arrival at the gate");

  // Package & Order Details
  const [matter, setMatter] = useState("Nepali Tales Food (Steamed Momos & Jhol Thukpa)");
  const [clientOrderId, setClientOrderId] = useState(`NT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [weightKg, setWeightKg] = useState(1);

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
    if (config?.sampleDestinations?.[0] && !dropAddress) {
      setDropAddress(config.sampleDestinations[0].address);
      setDropPhone(config.sampleDestinations[0].phone);
      setDropName(config.sampleDestinations[0].name);
    }
  }, [config]);

  // Clean phone number to 91XXXXXXXXXX
  const normalizePhone = (num: string) => {
    const clean = num.replace(/\D/g, "");
    if (clean.length === 10) return `91${clean}`;
    if (clean.length === 12 && clean.startsWith("91")) return clean;
    return clean;
  };

  // Step 1: Calculate Real Live Delivery Rate
  const handleCalculate = async () => {
    if (!dropAddress || !pickupAddress) {
      setCalcError("Please enter both pickup and delivery address.");
      return;
    }

    setCalcLoading(true);
    setCalcError(null);
    setCalcResult(null);

    const payload = {
      type: "standard",
      matter,
      vehicle_type_id: 8, // motorbike
      total_weight_kg: Number(weightKg) || 1,
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

  // Step 2: Book Borzo Delivery
  const handleBookDelivery = async () => {
    if (!dropAddress || !dropPhone || !dropName) {
      setBookingError("Please provide recipient Name, Phone number, and Delivery Address.");
      return;
    }

    const isProd = config?.borzo?.env === "production";
    const confirmPrompt = isProd
      ? `Confirm Borzo Delivery Booking:\n\n• Recipient: ${dropName} (${dropPhone})\n• Address: ${dropAddress}\n• Estimated Fare: ₹${calcResult?.payment_amount || "Calculating..."}\n\nThis will summon a REAL courier from Borzo in Mumbai/Thane. Proceed?`
      : `Book test delivery to ${dropName}?`;

    if (!confirm(confirmPrompt)) return;

    setBookingLoading(true);
    setBookingError(null);
    setCreatedOrder(null);

    const normalizedDropPhone = normalizePhone(dropPhone);
    const normalizedPickupPhone = normalizePhone(pickupPhone);

    const payload = {
      type: "standard",
      matter,
      vehicle_type_id: 8, // motorbike
      total_weight_kg: Number(weightKg) || 1,
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
    return `Namaste ${dropName || "there"}! 🥟 Your authentic Nepali food order from Nepali Tales is freshly prepared and out for delivery with Borzo courier. 🛵\n\nTrack your courier live here:\n${trackingUrl || ""}\n\nEnjoy the meal!`;
  };

  const isProduction = config?.borzo?.env === "production";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-400" />
            Book Borzo Delivery Service
          </h2>
          <p className="text-sm text-slate-400">
            Dispatch food orders to friends, family, or customers with real-time rate calculation, route distance, and live courier tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCalculate}
            disabled={calcLoading || !dropAddress}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
          >
            {calcLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
            1. Calculate Fare
          </button>
          <button
            type="button"
            onClick={handleBookDelivery}
            disabled={bookingLoading || !dropAddress || !dropPhone || !dropName}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
              isProduction
                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
            }`}
          >
            {bookingLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isProduction ? "2. Book Real Courier Now" : "2. Book Test Courier"}
          </button>
        </div>
      </div>

      {/* Success Booking Banner */}
      {createdOrder && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/30 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Borzo Delivery Booked Successfully!</h3>
                <p className="text-xs text-emerald-300">
                  Courier dispatch request has been broadcasted on Borzo network.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Order ID:</span>
              <span className="font-mono text-base font-black text-white px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40">
                #{createdOrder.order_id}
              </span>
              {createdOrder.order_name && (
                <span className="text-xs text-emerald-300 font-mono">
                  (Short: {createdOrder.order_name})
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
              <span className="text-slate-400 block mb-1">Status</span>
              <span className="text-emerald-400 font-semibold text-sm capitalize">
                {createdOrder.status || "available"}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {createdOrder.status_description || "Awaiting courier assignment"}
              </p>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
              <span className="text-slate-400 block mb-1">Delivery Fee</span>
              <span className="text-white font-bold text-base font-mono">
                ₹{createdOrder.payment_amount || "0.00"}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Payment Method: {createdOrder.payment_method || "cash"}
              </p>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
              <span className="text-slate-400 block mb-1">Recipient</span>
              <span className="text-white font-semibold">{dropName}</span>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{dropPhone}</p>
            </div>
          </div>

          {/* WhatsApp Sharing Card */}
          {trackingUrl && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  Live Customer Tracking Link
                </div>
                <p className="font-mono text-xs text-white truncate max-w-xl">
                  {trackingUrl}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Tracker
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard(getWhatsAppMessage(), "wa")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedWhatsApp ? "Copied Message!" : "Copy WhatsApp Message"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {bookingError && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold block">Booking Failed:</strong>
            <pre className="font-mono text-[11px] whitespace-pre-wrap">{bookingError}</pre>
          </div>
        </div>
      )}

      {calcError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold">Calculation Notice:</span>
            <pre className="font-mono text-[11px] whitespace-pre-wrap">{calcError}</pre>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 space-y-5">
          {/* Quick Destination Presets */}
          {config?.sampleDestinations && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Test Delivery Locations (Thane / Mumbai)
              </label>
              <div className="flex flex-wrap gap-2">
                {config.sampleDestinations.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDropAddress(preset.address);
                      setDropPhone(preset.phone);
                      setDropName(preset.name);
                      setCalcResult(null);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      dropAddress === preset.address
                        ? "bg-emerald-600/20 border-emerald-500/80 text-emerald-300 font-medium"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Point 1: Nepali Tales Kitchen (Pickup) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Point 1: Pickup (Nepali Tales Kitchen)
              </div>
              <span className="text-[11px] text-slate-500">Auto-configured</span>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Pickup Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <textarea
                  rows={2}
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Kitchen Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={pickupPhone}
                    onChange={(e) => setPickupPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Sender Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={config?.kitchen?.name || "Nepali Tales Kitchen"}
                    readOnly
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-300 font-medium cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Point 2: Recipient Information (Drop) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                Point 2: Delivery Destination (Friend / Customer)
              </div>
              <span className="text-[11px] text-rose-400 font-medium">Required</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Recipient Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={dropName}
                    onChange={(e) => setDropName(e.target.value)}
                    placeholder="e.g. Diwash Pradhan"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Recipient Phone Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={dropPhone}
                    onChange={(e) => setDropPhone(e.target.value)}
                    placeholder="e.g. 9820000001 or 919820000001"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Full Street Delivery Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <textarea
                  rows={2}
                  value={dropAddress}
                  onChange={(e) => {
                    setDropAddress(e.target.value);
                    setCalcResult(null);
                  }}
                  placeholder="Street, area, building name, Thane/Mumbai, Maharashtra"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Borzo uses Google Maps to locate the exact delivery coordinates.
              </p>
            </div>

            {/* Optional Flat & Building Details */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Flat / Apt #</label>
                <input
                  type="text"
                  value={apartmentNumber}
                  onChange={(e) => setApartmentNumber(e.target.value)}
                  placeholder="e.g. 405"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Wing / Bldg</label>
                <input
                  type="text"
                  value={buildingNumber}
                  onChange={(e) => setBuildingNumber(e.target.value)}
                  placeholder="e.g. Wing A"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Floor #</label>
                <input
                  type="text"
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(e.target.value)}
                  placeholder="e.g. 4"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Instructions for Courier</label>
              <input
                type="text"
                value={dropNote}
                onChange={(e) => setDropNote(e.target.value)}
                placeholder="e.g. Leave with security / Call upon arrival"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Food Order Contents */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Package className="w-4 h-4 text-amber-400" />
              Package & Delivery Contents
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Items Description</label>
                <input
                  type="text"
                  value={matter}
                  onChange={(e) => setMatter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Est. Weight (kg)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Fare Preview & Booking Summary */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Fare Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 sticky top-24 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-400" />
                Live Delivery Rate Preview
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Borzo v1.8
              </span>
            </div>

            {calcResult ? (
              <div className="space-y-4">
                {/* Big Price Display */}
                <div className="bg-gradient-to-tr from-slate-950 to-indigo-950/40 p-4 rounded-xl border border-indigo-500/30 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Estimated Courier Charge</span>
                  <div className="text-3xl font-black text-white font-mono tracking-tight flex items-center justify-center gap-1">
                    <span className="text-xl text-emerald-400">₹</span>
                    {calcResult.payment_amount || "0.00"}
                  </div>
                  <span className="text-[11px] text-emerald-300 mt-1 inline-block">
                    {isProduction ? "Live Borzo Mumbai/Thane Rate" : "Test Estimate"}
                  </span>
                </div>

                {/* Breakdown metrics */}
                <div className="space-y-2 text-xs divide-y divide-slate-800/80">
                  <div className="flex justify-between py-1.5 text-slate-300">
                    <span className="text-slate-400">Estimated Road Distance</span>
                    <span className="font-mono font-semibold text-white">
                      {calcResult.points?.[1]?.previous_point_driving_distance_meters
                        ? `${(calcResult.points[1].previous_point_driving_distance_meters / 1000).toFixed(2)} km`
                        : "Calculated by Borzo"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 text-slate-300">
                    <span className="text-slate-400">Vehicle Type</span>
                    <span className="text-white">Motorbike (up to 20kg)</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-slate-300">
                    <span className="text-slate-400">Courier Arrival Window</span>
                    <span className="font-mono text-emerald-400 font-medium">
                      {calcResult.points?.[0]?.required_finish_datetime
                        ? new Date(calcResult.points[0].required_finish_datetime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Within 30-45 mins"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 text-slate-300">
                    <span className="text-slate-400">Payment Method</span>
                    <span className="text-white font-mono uppercase">
                      {calcResult.payment_method || "cash"}
                    </span>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleBookDelivery}
                  disabled={bookingLoading}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isProduction
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                  }`}
                >
                  {bookingLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isProduction ? `Confirm & Book Courier (₹${calcResult.payment_amount})` : "Confirm & Book Test Courier"}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl space-y-3">
                <Navigation className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Enter recipient address and click <strong>"1. Calculate Fare"</strong> to get real-time Borzo pricing and distance.
                </p>
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={calcLoading || !dropAddress}
                  className="px-4 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold cursor-pointer disabled:opacity-40"
                >
                  {calcLoading ? "Calculating..." : "Calculate Price Now"}
                </button>
              </div>
            )}

            {/* Safety Reminder */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="text-slate-300 font-semibold block flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Founder Note for Live Testing:
              </span>
              <p>
                In <strong>Live Production</strong> mode, Borzo assigns a real delivery partner on Ghodbunder Road / Thane. You can cancel orders anytime within the <strong>Orders Tracker</strong> tab before the courier arrives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
