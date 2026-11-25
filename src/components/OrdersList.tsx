import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { formatCurrency, formatPhone } from "../lib/utils";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Cancelled" },
] as const;

export function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);

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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selectedOrder) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [selectedOrder]);

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm(`Are you sure you want to cancel Borzo Order #${orderId}?`)) return;
    setCancellingId(orderId);
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
        setSuccessMsg(`Order #${orderId} was cancelled successfully.`);
        fetchOrders();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to cancel order");
    } finally {
      setCancellingId(null);
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
        return <Badge variant="destructive">Cancelled</Badge>;
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
    <div className="space-y-5">
      {/* Filter & Controls Bento Card */}
      <Card className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              aria-pressed={statusFilter === filter.value}
              className={`h-9 inline-flex items-center rounded-full px-4 text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === filter.value
                  ? "bg-[#111214] text-white shadow-sm"
                  : "bg-[#F3F4F6] text-zinc-600 hover:text-[#111214] hover:bg-zinc-200/70"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex-1 sm:w-64">
            <Input
              type="search"
              aria-label="Search orders by name, phone, or order number"
              placeholder="Search name, phone, order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-full h-9 px-4 text-xs"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="h-9 px-4 shrink-0"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </Card>

      {/* Alert Notices */}
      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          {error}
        </div>
      )}
      {successMsg && (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Orders Grid */}
      {loading && orders.length === 0 ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading orders from Borzo">
          <p className="text-xs text-zinc-500 px-1">Loading orders from Borzo...</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((idx) => (
              <Card key={idx} className="p-6 space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 rounded-md bg-zinc-200/80" />
                  <div className="h-5 w-20 rounded-full bg-zinc-200/80" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-4 w-40 rounded-md bg-zinc-200/80" />
                  <div className="h-3 w-28 rounded-md bg-zinc-100" />
                </div>
                <div className="rounded-2xl bg-[#F7F8FA] p-3.5 space-y-2">
                  <div className="h-3 w-full rounded bg-zinc-200/70" />
                  <div className="h-3 w-4/5 rounded bg-zinc-200/70" />
                </div>
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <div className="h-3 w-24 rounded bg-zinc-100" />
                  <div className="h-5 w-16 rounded bg-zinc-200/80" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="py-16 px-6 text-center space-y-1.5 border-dashed border-zinc-200">
          <p className="text-sm font-semibold text-[#111214]">No orders found</p>
          <p className="text-xs text-zinc-500">
            {searchQuery
              ? "No orders match your search query."
              : "No deliveries in this status category yet."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const dropPoint = order.points?.[1];
            const isCancellable = ["new", "available", "active", "delayed"].includes(order.status);
            const tracking =
              dropPoint?.tracking_url ||
              order.points?.[0]?.tracking_url ||
              `https://borzodelivery.com/in/track/${order.order_id}`;

            return (
              <Card
                key={order.order_id}
                className="p-6 flex flex-col justify-between gap-4 hover:border-zinc-300 transition-colors"
              >
                <div className="space-y-4">
                  {/* Top: Order # & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#111214]">
                      #{order.order_id}
                      {order.order_name && (
                        <span className="text-[11px] text-zinc-500 font-normal ml-1.5">
                          ({order.order_name})
                        </span>
                      )}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Recipient */}
                  {dropPoint?.contact_person?.name ? (
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-[#111214] truncate">
                        {dropPoint.contact_person.name}
                      </div>
                      {dropPoint.contact_person.phone && (
                        <div className="text-xs font-mono text-zinc-500">
                          {formatPhone(dropPoint.contact_person.phone)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-[#111214] line-clamp-1">
                      {order.matter || "Nepali Tales Food Order"}
                    </div>
                  )}

                  {/* Route Summary */}
                  <div className="rounded-2xl bg-[#F7F8FA] p-3.5 space-y-2 text-xs">
                    <div className="flex items-baseline gap-2.5">
                      <span className="w-11 shrink-0 text-[11px] font-medium text-zinc-500">Pickup</span>
                      <span className="truncate text-zinc-600">{order.points?.[0]?.address || "Kitchen"}</span>
                    </div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="w-11 shrink-0 text-[11px] font-medium text-[#0066FF]">Drop</span>
                      <span className="truncate text-[#111214] font-medium">
                        {dropPoint?.address || "Destination"}
                      </span>
                    </div>
                  </div>

                  {/* Courier Card if Assigned */}
                  {order.courier && (
                    <div className="rounded-2xl bg-[#111214] text-white p-4 text-xs flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block">
                          Courier Assigned
                        </span>
                        <span className="font-semibold text-white text-xs block truncate">
                          {order.courier.name} {order.courier.surname}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono block">
                          {formatPhone(order.courier.phone)}
                        </span>
                      </div>
                      <a
                        href={`tel:${order.courier.phone}`}
                        className="rounded-full bg-[#0066FF] hover:bg-[#0052D4] text-white text-[11px] font-semibold px-3.5 py-1.5 shrink-0 transition-colors"
                      >
                        Call
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-3.5">
                  {/* Fare & Timestamps */}
                  <div className="pt-3 border-t border-zinc-100 flex items-baseline justify-between gap-2 text-xs">
                    <span className="text-zinc-500 text-[11px] font-mono">
                      {order.created_datetime ? order.created_datetime.slice(11, 16) : ""} &middot;{" "}
                      {order.created_datetime ? order.created_datetime.slice(0, 10) : ""}
                    </span>
                    <span className="font-bold text-[#111214] font-mono text-base tabular-nums">
                      {formatCurrency(order.payment_amount)}
                    </span>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 min-w-[76px] h-8 text-[11px]"
                    >
                      Details
                    </Button>

                    {tracking && (
                      <a href={tracking} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="h-8 text-[11px]">
                          Track
                        </Button>
                      </a>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyWhatsApp(order)}
                      className="h-8 text-[11px]"
                    >
                      {copiedId === order.order_id ? "Copied" : "WhatsApp"}
                    </Button>

                    {isCancellable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelOrder(order.order_id)}
                        disabled={cancellingId === order.order_id}
                        className="h-8 text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        {cancellingId === order.order_id ? "Cancelling..." : "Cancel"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Native Order Detail Dialog */}
      <dialog
        ref={dialogRef}
        aria-labelledby="order-detail-title"
        onClose={() => setSelectedOrder(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setSelectedOrder(null);
        }}
        className="app-dialog m-auto rounded-[24px] border border-black/[0.06] bg-white max-w-xl w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto p-6 shadow-2xl text-[#111214]"
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 id="order-detail-title" className="text-base font-bold text-[#111214]">
                    Order #{selectedOrder.order_id}
                  </h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  Placed: {selectedOrder.created_datetime}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="h-8 px-3 rounded-full bg-[#F3F4F6] hover:bg-zinc-200/80 text-xs font-semibold text-[#111214] transition-colors cursor-pointer shrink-0"
              >
                Close
              </button>
            </div>

            {selectedOrder.courier && (
              <div className="rounded-2xl bg-[#111214] text-white p-4 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">
                    Assigned Driver
                  </span>
                  <span className="text-sm font-bold text-white block">
                    {selectedOrder.courier.name} {selectedOrder.courier.surname}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 block">
                    {formatPhone(selectedOrder.courier.phone)}
                  </span>
                </div>
                {selectedOrder.points?.[1]?.tracking_url && (
                  <a href={selectedOrder.points[1].tracking_url} target="_blank" rel="noreferrer">
                    <Button variant="primary" size="sm" className="h-8 text-[11px]">
                      Live GPS
                    </Button>
                  </a>
                )}
              </div>
            )}

            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
                Route Addresses
              </span>
              {selectedOrder.points?.map((pt: any, idx: number) => (
                <div key={idx} className="rounded-2xl bg-[#F7F8FA] p-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#111214]">
                      {idx === 0 ? "Pickup (Nepali Tales Kitchen)" : "Drop Destination"}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">ID: {pt.point_id || "N/A"}</span>
                  </div>
                  <p className="text-zinc-600 leading-relaxed">{pt.address}</p>
                  <div className="flex flex-wrap justify-between gap-2 text-zinc-500 text-[11px] pt-2 border-t border-zinc-200/70">
                    <span>
                      Contact: {pt.contact_person?.name || "N/A"} ({formatPhone(pt.contact_person?.phone)})
                    </span>
                    <span>Window: {pt.required_finish_datetime?.slice(11, 16) || "N/A"}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-[#F7F8FA] p-4 text-xs divide-y divide-zinc-200/70">
              <div className="flex justify-between text-zinc-600 pb-2.5">
                <span>Base Courier Fee</span>
                <span className="font-mono text-[#111214] font-medium tabular-nums">
                  {formatCurrency(selectedOrder.delivery_fee_amount)}
                </span>
              </div>
              <div className="flex justify-between text-[#111214] font-bold pt-2.5">
                <span>Total Payment</span>
                <span className="font-mono text-[#0066FF] text-sm tabular-nums">
                  {formatCurrency(selectedOrder.payment_amount)}
                </span>
              </div>
            </div>

            <Button variant="dark" size="default" onClick={() => setSelectedOrder(null)} className="w-full h-10">
              Close
            </Button>
          </div>
        )}
      </dialog>
    </div>
  );
}
