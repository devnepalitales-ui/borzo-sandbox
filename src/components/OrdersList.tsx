import React, { useState, useEffect } from "react";
import {
  Package,
  RefreshCw,
  AlertCircle,
  Ban,
  ExternalLink,
  User,
  CheckCircle2,
  Loader2,
  X,
  Share2,
  Check,
  Search,
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
        return <Badge variant="blue">Active &middot; En Route</Badge>;
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
    <div className="space-y-4">
      {/* Filter & Controls Bento Card */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "available", "active", "completed", "canceled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === status
                  ? "bg-[#111214] text-white shadow-sm"
                  : "bg-[#F3F4F6] text-zinc-600 hover:text-[#111214] hover:bg-zinc-200/70"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <Input
              placeholder="Search name, phone, order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 rounded-full h-9 text-xs"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="gap-1.5 h-9 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Alert Notices */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Orders Grid */}
      {loading && orders.length === 0 ? (
        <Card className="py-20 text-center space-y-3">
          <Loader2 className="h-7 w-7 animate-spin mx-auto text-[#0066FF]" />
          <p className="text-xs text-zinc-500">Loading orders from Borzo...</p>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="py-16 text-center space-y-2 border-dashed border-zinc-200">
          <Package className="h-8 w-8 mx-auto text-zinc-400" />
          <p className="text-sm font-semibold text-[#111214]">No orders found</p>
          <p className="text-xs text-zinc-500">
            {searchQuery
              ? "No orders match your search query."
              : "No deliveries in this status category."}
          </p>
        </Card>
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
              <Card key={order.order_id} className="flex flex-col justify-between hover:border-zinc-300 transition-colors">
                <CardContent className="p-5 space-y-3.5">
                  {/* Top: Order # & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#111214]">
                      #{order.order_id}
                      {order.order_name && (
                        <span className="text-[11px] text-zinc-400 font-normal ml-1">
                          ({order.order_name})
                        </span>
                      )}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Recipient */}
                  {dropPoint?.contact_person?.name ? (
                    <div>
                      <div className="text-sm font-semibold text-[#111214] flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#0066FF] shrink-0" />
                        <span className="truncate">{dropPoint.contact_person.name}</span>
                      </div>
                      {dropPoint.contact_person.phone && (
                        <span className="text-[11px] font-mono text-zinc-500 pl-5 block mt-0.5">
                          {formatPhone(dropPoint.contact_person.phone)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-[#111214] line-clamp-1">
                      {order.matter || "Nepali Tales Food Order"}
                    </div>
                  )}

                  {/* Route Summary */}
                  <div className="rounded-2xl bg-[#F7F8FA] p-3 space-y-1.5 text-[11px] text-zinc-600">
                    <div className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                      <span className="truncate text-zinc-500">{order.points?.[0]?.address || "Kitchen"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0066FF] shrink-0 mt-1" />
                      <span className="truncate text-[#111214] font-medium">{dropPoint?.address || "Destination"}</span>
                    </div>
                  </div>

                  {/* Courier Card if Assigned */}
                  {order.courier && (
                    <div className="rounded-2xl bg-[#111214] text-white p-3 text-xs flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block">
                          Courier Assigned
                        </span>
                        <span className="font-semibold text-white text-xs block">
                          {order.courier.name} {order.courier.surname}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono block">
                          {formatPhone(order.courier.phone)}
                        </span>
                      </div>
                      <a
                        href={`tel:${order.courier.phone}`}
                        className="rounded-full bg-[#0066FF] hover:bg-[#0052D4] text-white text-[11px] font-semibold px-3 py-1.5"
                      >
                        Call
                      </a>
                    </div>
                  )}

                  {/* Fare & Timestamps */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[11px] font-mono">
                      {order.created_datetime ? order.created_datetime.slice(11, 16) : ""} &middot;{" "}
                      {order.created_datetime ? order.created_datetime.slice(0, 10) : ""}
                    </span>
                    <span className="font-bold text-[#111214] font-mono text-base tabular-nums">
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
                        <Button variant="outline" size="sm" className="h-8 gap-1 text-[11px]">
                          <ExternalLink className="h-3 w-3 text-zinc-500" />
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
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5 text-zinc-500" />
                      )}
                    </Button>

                    {isCancelable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelOrder(order.order_id)}
                        disabled={cancelingId === order.order_id}
                        className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-black/[0.06] rounded-[24px] max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#111214]">Order #{selectedOrder.order_id}</h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  Placed: {selectedOrder.created_datetime}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-2 text-zinc-400 hover:text-[#111214] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedOrder.courier && (
              <div className="rounded-2xl bg-[#111214] text-white p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">
                    Assigned Driver
                  </span>
                  <span className="text-sm font-bold text-white">
                    {selectedOrder.courier.name} {selectedOrder.courier.surname}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 block">
                    {formatPhone(selectedOrder.courier.phone)}
                  </span>
                </div>
                {selectedOrder.points?.[1]?.tracking_url && (
                  <a href={selectedOrder.points[1].tracking_url} target="_blank" rel="noreferrer">
                    <Button variant="primary" size="sm" className="h-8 gap-1 text-[11px]">
                      <ExternalLink className="h-3 w-3" /> Live GPS
                    </Button>
                  </a>
                )}
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Route Addresses
              </span>
              {selectedOrder.points?.map((pt: any, idx: number) => (
                <div key={idx} className="rounded-2xl bg-[#F7F8FA] p-3.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#111214]">
                      {idx === 0 ? "Pickup (Nepali Tales Kitchen)" : "Drop Destination"}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">ID: {pt.point_id || "N/A"}</span>
                  </div>
                  <p className="text-zinc-600">{pt.address}</p>
                  <div className="flex justify-between text-zinc-500 text-[11px] pt-1 border-t border-zinc-200/70">
                    <span>
                      Contact: {pt.contact_person?.name || "N/A"} ({formatPhone(pt.contact_person?.phone)})
                    </span>
                    <span>Window: {pt.required_finish_datetime?.slice(11, 16) || "N/A"}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-[#F7F8FA] p-4 text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-500">
                <span>Base Courier Fee:</span>
                <span className="font-mono text-[#111214] font-medium">
                  {formatCurrency(selectedOrder.delivery_fee_amount)}
                </span>
              </div>
              <div className="flex justify-between text-[#111214] font-bold pt-1.5 border-t border-zinc-200/70">
                <span>Total Payment:</span>
                <span className="font-mono text-[#0066FF] text-sm">
                  {formatCurrency(selectedOrder.payment_amount)}
                </span>
              </div>
            </div>

            <Button variant="dark" size="sm" onClick={() => setSelectedOrder(null)} className="w-full h-9">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
