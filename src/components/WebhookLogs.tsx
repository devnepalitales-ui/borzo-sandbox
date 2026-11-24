import React, { useState, useEffect } from "react";
import {
  Bell,
  RefreshCw,
  Trash2,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Info,
  Clock,
  Radio,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
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
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Webhook & Status Callback Monitor
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time webhook listener receiving automated courier updates from Borzo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulate}
            disabled={simulating}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            {simulating ? "Simulating..." : "Simulate Event"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={events.length === 0}
            className="h-8 text-xs text-zinc-400 hover:text-rose-400"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Integration Guide Box */}
      <Card className="border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Radio className="h-3.5 w-3.5 text-rose-400" />
            Borzo Cabinet Callback Settings
          </div>
          <a
            href="https://borzodelivery.com/in/cabinet/integration"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-rose-400 hover:underline flex items-center gap-1 font-medium"
          >
            Open Integration Cabinet
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Callback URL */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">1. Callback URL</span>
              <button
                type="button"
                onClick={() => copyText(callbackUrl, "url")}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedUrl ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copiedUrl ? "Copied!" : "Copy URL"}
              </button>
            </div>
            <div className="p-2 rounded bg-zinc-900 font-mono text-[11px] text-emerald-400 select-all break-all border border-zinc-800">
              {callbackUrl}
            </div>
            <p className="text-[11px] text-zinc-500">
              Paste into the <strong>Callback URL</strong> box in your Borzo Cabinet.
            </p>
          </div>

          {/* Callback Token */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">2. Callback Token</span>
              <button
                type="button"
                onClick={() => copyText(activeToken, "token")}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedToken ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copiedToken ? "Copied!" : "Copy Token"}
              </button>
            </div>
            <div className="p-2 rounded bg-zinc-900 font-mono text-[11px] text-zinc-200 select-all break-all border border-zinc-800">
              {activeToken}
            </div>
            <p className="text-[11px] text-zinc-500">
              Verified token from your Borzo cabinet for cryptographic HMAC-SHA256 authentication.
            </p>
          </div>
        </div>
      </Card>

      {/* Events List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-300">
            Received Events ({events.length})
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">Auto-refreshes every 5s</span>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center space-y-2">
            <Clock className="h-8 w-8 text-zinc-600 mx-auto" />
            <p className="text-xs font-medium text-zinc-300">No webhook events received yet</p>
            <p className="text-[11px] text-zinc-500">
              Place a delivery order or click <strong>Simulate Event</strong> to test receipt.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {events.map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2 font-mono text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">
                      {evt.body?.event_type || "order_status_changed"}
                    </span>
                    {evt.body?.order_id && (
                      <Badge variant="secondary">Order #{evt.body.order_id}</Badge>
                    )}
                    {evt.body?.status && (
                      <Badge variant="info">{evt.body.status}</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    {evt.isSignatureValid === true && (
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                        <ShieldCheck className="h-3 w-3" /> Verified HMAC
                      </span>
                    )}
                    <span>{new Date(evt.receivedAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {evt.body?.courier && (
                  <div className="rounded-md border border-zinc-800 bg-zinc-950 p-2.5 text-[11px] text-zinc-300 flex flex-wrap gap-4">
                    <span><strong>Courier:</strong> {evt.body.courier.name} {evt.body.courier.surname}</span>
                    <span><strong>Phone:</strong> {formatPhone(evt.body.courier.phone)}</span>
                    {evt.body.courier.latitude && (
                      <span><strong>Coordinates:</strong> {evt.body.courier.latitude}, {evt.body.courier.longitude}</span>
                    )}
                  </div>
                )}

                <details className="text-[11px] text-zinc-500 pt-1 cursor-pointer">
                  <summary className="hover:text-zinc-300">View Raw Payload</summary>
                  <pre className="mt-2 rounded bg-zinc-950 p-2.5 text-[10px] text-zinc-300 overflow-x-auto whitespace-pre-wrap border border-zinc-800/80">
                    {JSON.stringify(evt.body, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
