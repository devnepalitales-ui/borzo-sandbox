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
} from "lucide-react";

export function WebhookLogs() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const callbackUrl = "https://test.nepalitales.com/api/borzo/webhook";
  const recommendedToken = "nt_borzo_callback_2026";

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Borzo Webhook Receiver & Callback Guide
          </h2>
          <p className="text-sm text-slate-400">
            Real-time status callback endpoint for Borzo status updates (Courier assigned, Arrived, Delivered, Canceled).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSimulate}
            disabled={simulating}
            className="px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold cursor-pointer transition-colors"
          >
            {simulating ? "Simulating..." : "Simulate Callback"}
          </button>
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={events.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 text-xs font-medium border border-rose-500/20 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Guide Banner for Borzo Cabinet */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">What to Add in Borzo Integration Cabinet</h3>
              <p className="text-xs text-slate-400">
                Go to{" "}
                <a
                  href="https://borzodelivery.com/in/cabinet/integration"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 underline font-medium inline-flex items-center gap-1"
                >
                  borzodelivery.com/in/cabinet/integration
                  <ExternalLink className="w-3 h-3" />
                </a>{" "}
                and fill in the two fields under <strong>"Callback URL for statuses receiving"</strong>:
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Subdomain: test.nepalitales.com
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Field 1: Callback URL */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                1. Callback URL
              </span>
              <button
                type="button"
                onClick={() => copyText(callbackUrl, "url")}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedUrl ? "Copied!" : "Copy URL"}
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 select-all break-all">
              {callbackUrl}
            </div>
            <p className="text-[11px] text-slate-500">
              Paste this exact URL into the <strong>Callback URL</strong> box in your Borzo cabinet. Borzo will send all order status change notifications via HTTP POST to this endpoint.
            </p>
          </div>

          {/* Field 2: Callback Token */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                2. Callback Token
              </span>
              <button
                type="button"
                onClick={() => copyText(recommendedToken, "token")}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedToken ? "Copied!" : "Copy Token"}
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-300 select-all">
              {recommendedToken}
            </div>
            <p className="text-[11px] text-slate-500">
              Enter any secret key here (or copy the one above). Borzo uses it to compute an HMAC-SHA256 signature in the <code className="text-slate-300">X-DV-Signature</code> header so our server can authenticate genuine callbacks.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            <strong>How Borzo processes callbacks:</strong> Whenever an order updates (courier assigned, parcel picked up from Kasarvadavali kitchen, delivered, or canceled), Borzo calls your Callback URL. Our server automatically acknowledges with HTTP 200 <code className="text-slate-300">{"{\"is_successful\": true}"}</code> so Borzo knows it succeeded.
          </span>
        </div>
      </div>

      {/* Webhook Events Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Live Webhook Event Stream ({events.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Auto-refreshes every 5s</span>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs">No webhooks received yet.</p>
            <p className="text-[11px] text-slate-600">
              Place a delivery order or click <strong>"Simulate Callback"</strong> above to test event processing.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400 border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">
                      {evt.body?.event_type || "POST /api/borzo/webhook"}
                    </span>
                    {evt.body?.order_id && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-semibold">
                        Order #{evt.body.order_id}
                      </span>
                    )}
                    {evt.body?.status && (
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 uppercase font-semibold">
                        {evt.body.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {evt.isSignatureValid === true && (
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                        <ShieldCheck className="w-3 h-3" /> Verified HMAC
                      </span>
                    )}
                    <span>{new Date(evt.receivedAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {evt.body?.courier && (
                  <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 flex flex-wrap gap-4">
                    <span>
                      <strong>Courier:</strong> {evt.body.courier.name} {evt.body.courier.surname}
                    </span>
                    <span>
                      <strong>Phone:</strong> {evt.body.courier.phone}
                    </span>
                    {evt.body.courier.latitude && (
                      <span>
                        <strong>Coordinates:</strong> {evt.body.courier.latitude}, {evt.body.courier.longitude}
                      </span>
                    )}
                  </div>
                )}

                <details className="text-[11px] text-slate-500 pt-1 cursor-pointer">
                  <summary className="hover:text-slate-300">View Full JSON Payload & Headers</summary>
                  <pre className="mt-2 p-3 bg-slate-900 rounded-lg text-slate-300 overflow-x-auto text-[10px] whitespace-pre-wrap">
                    {JSON.stringify({ headers: evt.headers, body: evt.body }, null, 2)}
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
