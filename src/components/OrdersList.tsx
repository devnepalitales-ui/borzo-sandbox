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
  Check,
  Search,
  Bike,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { formatCurrency, formatPhone } from "../lib/utils";

export function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
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
        setError(data.errors?.join(", ") || "Failed to fetch orders from Borzo");
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
        return <Badge variant="warning">Available</Badge>;
      case "active":
        return <Badge variant="info">Active &middot; Courier on way</Badge>;
      case "completed":
        return <Badge variant="success">Delivered</Badge>;
      case "canceled":
        return <Badge variant="destructive">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  // Search filter
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const id = String(order.order_id);
    const drop = order.points?.[1];
    const name = (drop?.contact_person?.name || "").toLowerCase();
    const phone = (drop?.contact_person?.phone || "").toLowerCase();
    const address = (drop?.address || "").toLowerCase();
    return id.includes(q) || name.includes(q) || phone.includes(q) || address.includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Deliveries History & Tracking
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitor courier status, view real-time road coordinates, and share tracking updates.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          className="gap-1.5 h-8 text-xs shrink-0"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh Deliveries
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pill Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "available", "active", "completed", "canceled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
                statusFilter === status
                  ? "bg-zinc-100 text-zinc-900 font-semibold shadow-sm"
                  : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <Input
            placeholder="Search by name, phone, order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Orders Grid */}
      {loading && orders.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="h-7 w-7 animate-spin mx-auto text-rose-500" />
          <p className="text-xs text-zinc-400">Loading orders from Borzo...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center space-y-2">
          <Package className="h-8 w-8 mx-auto text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">No orders found</p>
          <p className="text-xs text-zinc-500">
            {searchQuery
              ? "No orders match your search query."
              : "No deliveries in this status category. Switch to 'All' or book a new delivery."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const dropPoint = order.points?.[1];
            const isCancelable = ["new", "available", "active", "delayed"].includes(order.status);
            const tracking =
              dropPoint?.tracking_url ||
              order.points?.[0]?.tracking_url ||
              `https://borzodelivery.com/in/track/${order.order_id}`;

            return (
              <Card key={order.order_id} className="flex flex-col justify-between hover:border-zinc-700/80 transition-colors">
                <CardContent className="p-4 space-y-3">
                  {/* Top: Order # & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-white">
                      #{order.order_id}
                      {order.order_name && (
                        <span className="text-[11px] text-zinc-500 font-normal ml-1">
                          ({order.order_name})
                        </span>
                      )}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Recipient Details */}
                  {dropPoint?.contact_person?.name ? (
                    <div>
                      <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                        <User className="h-3 w-3 text-rose-400 shrink-0" />
                        <span className="truncate">{dropPoint.contact_person.name}</span>
                      </div>
                      {dropPoint.contact_person.phone && (
                        <span className="text-[11px] font-mono text-zinc-400 pl-4 block mt-0.5">
                          {formatPhone(dropPoint.contact_person.phone)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-zinc-300 line-clamp-1">
                      {order.matter || "Nepali Tales Food Order"}
                    </div>
                  )}

                  {/* Route Summary */}
                  <div className="space-y-1 text-[11px] text-zinc-400">
                    <div className="flex items-start gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1" />
                      <span className="truncate text-zinc-400">{order.points?.[0]?.address || "Kitchen"}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0 mt-1" />
                      <span className="truncate text-zinc-300 font-medium">{dropPoint?.address || "Destination"}</span>
                    </div>
                  </div>

                  {/* Courier Card if Assigned */}
                  {order.courier && (
                    <div className="rounded-lg border border-sky-800/40 bg-sky-950/30 p-2.5 text-xs flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                          Courier Assigned
                        </span>
                        <span className="font-semibold text-white text-xs block">
                          {order.courier.name} {order.courier.surname}
                        </span>
                        <span className="text-[11px] text-zinc-300 font-mono block">
                          {formatPhone(order.courier.phone)}
                        </span>
                      </div>
                      <a
                        href={`tel:${order.courier.phone}`}
                        className="rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-medium px-2.5 py-1"
                      >
                        Call
                      </a>
                    </div>
                  )}

                  {/* Fare & Timestamps */}
                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 text-[11px] font-mono">
                      {order.created_datetime ? order.created_datetime.slice(11, 16) : ""} &middot;{" "}
                      {order.created_datetime ? order.created_datetime.slice(0, 10) : ""}
                    </span>
                    <span className="font-bold text-zinc-100 font-mono text-sm tabular-nums">
                      {formatCurrency(order.payment_amount)}
                    </span>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 text-[11px] h-8"
                    >
                      Details
                    </Button>

                    {tracking && (
                      <a href={tracking} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="h-8 gap-1 text-[11px]" title="Live Tracking">
                          <ExternalLink className="h-3 w-3 text-zinc-400" />
                          Track
                        </Button>
                      </a>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyWhatsApp(order)}
                      className="h-8 px-2.5 text-[11px]"
                      title="Copy WhatsApp Message"
                    >
                      {copiedId === order.order_id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5 text-zinc-400" />
                      )}
                    </Button>

                    {isCancelable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelOrder(order.order_id)}
                        disabled={cancelingId === order.order_id}
                        className="h-8 px-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                        title="Cancel Order"
                      >
                        {cancelingId === order.order_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Ban className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Order #{selectedOrder.order_id}</h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  Placed: {selectedOrder.created_datetime}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Courier Block */}
            {selectedOrder.courier && (
              <div className="rounded-xl border border-sky-800/40 bg-sky-950/20 p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider block">Assigned Driver</span>
                  <span className="text-xs font-bold text-white">
                    {selectedOrder.courier.name} {selectedOrder.courier.surname}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-300 block">
                    {formatPhone(selectedOrder.courier.phone)}
                  </span>
                </div>
                {selectedOrder.points?.[1]?.tracking_url && (
                  <a href={selectedOrder.points[1].tracking_url} target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="sm" className="h-8 gap-1 text-[11px]">
                      <ExternalLink className="h-3 w-3" /> Live GPS
                    </Button>
                  </a>
                )}
              </div>
            )}

            {/* Route Points */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Route Addresses</span>
              {selectedOrder.points?.map((pt: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">
                      {idx === 0 ? "Pickup (Nepali Tales Kitchen)" : "Drop Destination"}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">ID: {pt.point_id || "N/A"}</span>
                  </div>
                  <p className="text-zinc-300">{pt.address}</p>
                  <div className="flex justify-between text-zinc-400 text-[11px] pt-1 border-t border-zinc-800/40">
                    <span>Contact: {pt.contact_person?.name || "N/A"} ({formatPhone(pt.contact_person?.phone)})</span>
                    <span>Window: {pt.required_finish_datetime?.slice(11, 16) || "N/A"}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Breakdown */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Base Courier Fee:</span>
                <span className="font-mono text-zinc-200">{formatCurrency(selectedOrder.delivery_fee_amount)}</span>
              </div>
              <div className="flex justify-between text-zinc-200 font-semibold pt-1 border-t border-zinc-800">
                <span>Total Payment:</span>
                <span className="font-mono text-emerald-400 font-bold">{formatCurrency(selectedOrder.payment_amount)}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedOrder(null)}
              className="w-full text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
