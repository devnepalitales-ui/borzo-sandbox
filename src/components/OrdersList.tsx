import React, { useState, useEffect } from "react";
import {
  Package,
  RefreshCw,
  AlertCircle,
  Ban,
  ExternalLink,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle2,
  Loader2,
  X,
  Share2,
  Copy,
  Check,
} from "lucide-react";

export function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        statusFilter === "all"
          ? "/api/borzo/orders?count=30"
          : `/api/borzo/orders?status=${statusFilter}&count=30`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.is_successful) {
        setError(data.errors?.join(", ") || "Failed to fetch orders");
      } else {
        setOrders(data.orders || []);
      }
    } catch (err: any) {
      setError(err?.message || "Network error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm(`Are you sure you want to cancel Borzo Order #${orderId}?`)) return;
    setCancelingId(orderId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/borzo/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.is_successful) {
        setError(data.errors?.join(", ") || "Failed to cancel order");
      } else {
        setSuccessMsg(`Order #${orderId} was canceled successfully.`);
        fetchOrders();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to cancel order");
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30";
      case "active":
        return "bg-sky-500/10 text-sky-300 border-sky-500/30";
      case "completed":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "canceled":
        return "bg-rose-500/10 text-rose-300 border-rose-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const copyWhatsApp = (order: any) => {
    const drop = order.points?.[1];
    const name = drop?.contact_person?.name || "there";
    const track = drop?.tracking_url || `https://borzodelivery.com/in/track/${order.order_id}`;
    const text = `Namaste ${name}! 🥟 Your authentic Nepali food order from Nepali Tales is freshly prepared and out for delivery with Borzo courier. 🛵\n\nTrack your courier live here:\n${track}`;
    navigator.clipboard.writeText(text);
    setCopiedId(order.order_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-400" />
            Orders History & Courier Tracker (API: /orders)
          </h2>
          <p className="text-sm text-slate-400">
            Real-time delivery status, courier contact details, and customer tracking links from Borzo.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Orders
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", "available", "active", "completed", "canceled"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              statusFilter === status
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {status}
          </button>
        ))}
        <span className="text-xs text-slate-500 ml-auto font-mono">
          Total orders: {orders.length}
        </span>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Orders Grid */}
      {loading && orders.length === 0 ? (
        <div className="py-20 text-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
          <p className="text-sm">Fetching live orders from Borzo...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/60 space-y-2">
          <Package className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-base font-medium text-slate-400">No orders found</p>
          <p className="text-xs text-slate-500">
            Book a delivery in the "Book Delivery Service" tab to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => {
            const dropPoint = order.points?.[1];
            const isCancelable = ["new", "available", "active", "delayed"].includes(order.status);
            const tracking =
              dropPoint?.tracking_url ||
              order.points?.[0]?.tracking_url ||
              `https://borzodelivery.com/in/track/${order.order_id}`;

            return (
              <div
                key={order.order_id}
                className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between space-y-4 transition-all shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-sm font-bold text-white">
                      #{order.order_id}
                      {order.order_name && (
                        <span className="text-xs text-slate-400 font-normal ml-1">
                          ({order.order_name})
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border capitalize ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-slate-300 line-clamp-1 mb-2">
                    {order.matter || "Nepali Tales Food Order"}
                  </div>

                  {/* Recipient name if present */}
                  {dropPoint?.contact_person?.name && (
                    <div className="text-xs font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {dropPoint.contact_person.name}
                      {dropPoint.contact_person.phone && (
                        <span className="text-slate-400 font-mono text-[11px] font-normal">
                          ({dropPoint.contact_person.phone})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Route Summary */}
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-start gap-1.5 line-clamp-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5"></div>
                      <span className="truncate">{order.points?.[0]?.address || "Kitchen"}</span>
                    </div>
                    <div className="flex items-start gap-1.5 line-clamp-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5"></div>
                      <span className="truncate">{dropPoint?.address || "Delivery Address"}</span>
                    </div>
                  </div>

                  {/* Courier Card if Assigned */}
                  {order.courier && (
                    <div className="mt-3 bg-sky-950/40 border border-sky-800/40 rounded-lg p-2.5 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider block">
                          Courier Assigned
                        </span>
                        <span className="font-semibold text-white">
                          {order.courier.name} {order.courier.surname}
                        </span>
                        <span className="text-[11px] text-slate-300 block font-mono">
                          {order.courier.phone}
                        </span>
                      </div>
                      <a
                        href={`tel:${order.courier.phone}`}
                        className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-medium"
                      >
                        Call
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {order.created_datetime ? order.created_datetime.slice(0, 16).replace("T", " ") : ""}
                    </span>
                    <span className="font-bold text-emerald-400 text-sm">₹{order.payment_amount}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 text-center transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                    {tracking && (
                      <a
                        href={tracking}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        title="Live Tracking Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Track
                      </a>
                    )}
                    <button
                      onClick={() => copyWhatsApp(order)}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      title="Copy WhatsApp Update to Send to Customer"
                    >
                      {copiedId === order.order_id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {isCancelable && (
                      <button
                        onClick={() => handleCancelOrder(order.order_id)}
                        disabled={cancelingId === order.order_id}
                        className="py-1.5 px-2 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                        title="Cancel Order"
                      >
                        {cancelingId === order.order_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Ban className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Order #{selectedOrder.order_id}
                  <span
                    className={`text-xs px-2 py-0.5 rounded border capitalize ${getStatusBadge(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Created: {selectedOrder.created_datetime}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Courier Info if assigned */}
            {selectedOrder.courier && (
              <div className="bg-sky-950/30 border border-sky-800/40 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider block">
                    Assigned Courier
                  </span>
                  <span className="text-sm font-bold text-white">
                    {selectedOrder.courier.name} {selectedOrder.courier.surname}
                  </span>
                  <span className="text-xs text-slate-300 block font-mono">
                    Phone: {selectedOrder.courier.phone}
                  </span>
                </div>
                {selectedOrder.points?.[1]?.tracking_url && (
                  <a
                    href={selectedOrder.points[1].tracking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Track Courier
                  </a>
                )}
              </div>
            )}

            {/* Points list */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Route Points</h4>
              {selectedOrder.points?.map((point: any, idx: number) => (
                <div key={idx} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      Point {idx + 1}: {idx === 0 ? "Pickup (Kitchen)" : "Delivery Destination"}
                    </span>
                    <span className="font-mono text-slate-500">Point ID: {point.point_id || "N/A"}</span>
                  </div>
                  <div className="text-slate-300">{point.address}</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-400 pt-1 border-t border-slate-800/50">
                    <div>Contact: {point.contact_person?.name || "N/A"} ({point.contact_person?.phone})</div>
                    <div>Arrival: {point.required_finish_datetime?.slice(11, 16) || "N/A"}</div>
                  </div>
                  {point.note && <div className="text-amber-300/80 text-[11px]">Note: {point.note}</div>}
                  {point.tracking_url && (
                    <a
                      href={point.tracking_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sky-400 hover:underline pt-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Live Tracking Link
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Financials */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Base Delivery Fee:</span>
                <span className="font-medium text-white">₹{selectedOrder.delivery_fee_amount}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Payment:</span>
                <span className="font-bold text-emerald-400 text-sm">₹{selectedOrder.payment_amount}</span>
              </div>
            </div>

            {/* Raw JSON toggle */}
            <details className="text-xs">
              <summary className="text-slate-400 cursor-pointer hover:text-white font-medium py-1">
                View Raw Order JSON
              </summary>
              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto mt-2">
                {JSON.stringify(selectedOrder, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
