import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { formatPhone } from "../lib/utils";

export function WebhookLogs() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const callbackUrl = "https://test.nepalitales.com/api/borzo/webhook";
  const activeToken = "90BA3628912AA7768780F03A9D9A52A6AFCEA25A";

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/borzo/webhooks");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await fetch("/api/borzo/webhooks", { method: "DELETE" });
      setEvents([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const payload = {
        event_type: "order_status_changed",
        order_id: 98325694,
        status: "active",
        status_description: "Courier Salman Aziz Ahmad is on the way to Nepali Tales Kitchen",
        courier: {
          courier_id: 7704738,
          name: "Salman",
          surname: "Aziz Ahmad",
          phone: "919112572641",
          latitude: "19.280098",
          longitude: "72.930355",
        },
        timestamp: new Date().toISOString(),
      };
      await fetch("/api/borzo/webhooks/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      fetchLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const copyText = (text: string, type: "url" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#111214] tracking-tight">
            Webhook & Status Callback Monitor
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time webhook listener receiving automated courier updates from Borzo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulate}
            disabled={simulating}
            className="h-9 text-xs font-semibold"
          >
            {simulating ? "Simulating..." : "Simulate Event"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="h-9 text-xs font-semibold"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={events.length === 0}
            className="h-9 text-xs text-zinc-600 hover:text-rose-600"
          >
            Clear
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="text-xs font-bold text-[#111214]">
            Borzo Cabinet Callback Settings
          </div>
          <a
            href="https://borzodelivery.com/in/cabinet/integration"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#0066FF] hover:underline font-medium"
          >
            Open Integration Cabinet
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-[#F7F8FA] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#111214]">1. Callback URL</span>
              <button
                type="button"
                onClick={() => copyText(callbackUrl, "url")}
                className="text-xs text-[#0066FF] hover:underline font-semibold cursor-pointer"
              >
                {copiedUrl ? "Copied!" : "Copy URL"}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-white font-mono text-[11px] text-emerald-700 select-all break-all border border-zinc-200/70">
              {callbackUrl}
            </div>
            <p className="text-[11px] text-zinc-500">
              Paste into the <strong>Callback URL</strong> box in your Borzo Cabinet.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-[#F7F8FA] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#111214]">2. Callback Token</span>
              <button
                type="button"
                onClick={() => copyText(activeToken, "token")}
                className="text-xs text-[#0066FF] hover:underline font-semibold cursor-pointer"
              >
                {copiedToken ? "Copied!" : "Copy Token"}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-white font-mono text-[11px] text-[#111214] select-all break-all border border-zinc-200/70">
              {activeToken}
            </div>
            <p className="text-[11px] text-zinc-500">
              Verified token from your Borzo cabinet for cryptographic HMAC-SHA256 authentication.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#111214]">
            Received Events ({events.length})
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">Auto-refreshes every 5s</span>
        </div>

        {events.length === 0 ? (
          <Card className="border-dashed border-zinc-200 py-16 px-6 text-center space-y-1.5">
            <p className="text-xs font-semibold text-[#111214]">No webhook events received yet</p>
            <p className="text-xs text-zinc-500">
              Place a delivery order or click <strong>Simulate Event</strong> to test receipt.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {events.map((evt, idx) => (
              <Card key={evt.id || idx} className="p-4 space-y-2.5 font-mono text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[#0066FF] font-bold">
                      {evt.body?.event_type || "order_status_changed"}
                    </span>
                    {evt.body?.order_id && (
                      <Badge variant="secondary">Order #{evt.body.order_id}</Badge>
                    )}
                    {evt.body?.status && (
                      <Badge variant="info">{evt.body.status}</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    {evt.isSignatureValid === true && (
                      <span className="text-emerald-700 font-semibold text-[10px]">Verified HMAC</span>
                    )}
                    <span>{new Date(evt.receivedAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {evt.body?.courier && (
                  <div className="rounded-xl bg-[#F7F8FA] p-3 text-[11px] text-zinc-700 flex flex-wrap gap-4">
                    <span><strong>Courier:</strong> {evt.body.courier.name} {evt.body.courier.surname}</span>
                    <span><strong>Phone:</strong> {formatPhone(evt.body.courier.phone)}</span>
                    {evt.body.courier.latitude && (
                      <span><strong>Coordinates:</strong> {evt.body.courier.latitude}, {evt.body.courier.longitude}</span>
                    )}
                  </div>
                )}

                <details className="text-[11px] text-zinc-500 pt-1 cursor-pointer">
                  <summary className="hover:text-[#111214] font-sans font-medium">View Raw Payload</summary>
                  <pre className="mt-2 rounded-xl bg-[#111214] p-3 text-[11px] text-zinc-200 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(evt.body, null, 2)}
                  </pre>
                </details>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
