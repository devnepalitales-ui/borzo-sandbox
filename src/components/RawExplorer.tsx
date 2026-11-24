import React, { useState } from "react";
import { Terminal, Send, Copy, Check, Clock, AlertCircle, Loader2 } from "lucide-react";

const TEMPLATES: Record<string, { endpoint: string; method: "GET" | "POST"; payload?: any }> = {
  calculateOrder: {
    endpoint: "/calculate-order",
    method: "POST",
    payload: {
      type: "standard",
      matter: "Food order - Nepali Tales",
      vehicle_type_id: 8,
      total_weight_kg: 1,
      points: [
        {
          address: "Metropolis Rivera, Kasarvadavali, Thane West, Maharashtra 400615",
          contact_person: { phone: "919876543210", name: "Nepali Tales Kitchen" },
        },
        {
          address: "Hiranandani Estate, Thane West, Maharashtra 400607",
          contact_person: { phone: "919820000001", name: "Customer" },
        },
      ],
    },
  },
  createOrder: {
    endpoint: "/create-order",
    method: "POST",
    payload: {
      type: "standard",
      matter: "Steamed Momos & Jhol",
      vehicle_type_id: 8,
      total_weight_kg: 1,
      points: [
        {
          address: "Metropolis Rivera, Kasarvadavali, Thane West, Maharashtra 400615",
          contact_person: { phone: "919876543210", name: "Kitchen" },
          note: "Counter 2",
        },
        {
          address: "Viviana Mall, Eastern Express Hwy, Thane West, Maharashtra 400606",
          contact_person: { phone: "919820000002", name: "Customer" },
          client_order_id: "NT-TEST-01",
          note: "Deliver to food court",
        },
      ],
    },
  },
  cancelOrder: {
    endpoint: "/cancel-order",
    method: "POST",
    payload: {
      order_id: 1250032,
    },
  },
  listOrders: {
    endpoint: "/orders?count=10",
    method: "GET",
  },
};

export function RawExplorer({ token }: { token?: string }) {
  const [selectedTemplate, setSelectedTemplate] = useState("calculateOrder");
  const [endpoint, setEndpoint] = useState(TEMPLATES.calculateOrder.endpoint);
  const [method, setMethod] = useState<"GET" | "POST">(TEMPLATES.calculateOrder.method);
  const [bodyText, setBodyText] = useState(JSON.stringify(TEMPLATES.calculateOrder.payload, null, 2));
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleTemplateChange = (key: string) => {
    setSelectedTemplate(key);
    const tmpl = TEMPLATES[key];
    if (tmpl) {
      setEndpoint(tmpl.endpoint);
      setMethod(tmpl.method);
      setBodyText(tmpl.payload ? JSON.stringify(tmpl.payload, null, 2) : "");
    }
  };

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);

    let parsedPayload: any = undefined;
    if (method === "POST" && bodyText.trim()) {
      try {
        parsedPayload = JSON.parse(bodyText);
      } catch (err: any) {
        alert("Invalid JSON in request payload: " + err.message);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/borzo/raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint,
          method,
          payload: parsedPayload,
        }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setResponse({ error: err?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  const copyCurl = () => {
    const rawToken = token || "9445E42F83FBC1E811714F71ACE60EBC2979A4FE";
    const fullUrl = `https://robotapitest-in.borzodelivery.com/api/business/1.8${endpoint}`;
    let curlCmd = `curl --include --header 'X-DV-Auth-Token: ${rawToken}'`;
    if (method === "POST") {
      curlCmd += ` -H 'Content-Type: application/json' --data '${bodyText.replace(/\n/g, "").replace(/\s+/g, " ")}'`;
    }
    curlCmd += ` '${fullUrl}'`;
    navigator.clipboard.writeText(curlCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            Raw API Playground & cURL Generator
          </h2>
          <p className="text-sm text-slate-400">
            Execute any raw Borzo Business API method directly, test edge-case payloads, and export copy-pasteable cURL commands.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyCurl}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied cURL!" : "Copy as cURL"}
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Request
          </button>
        </div>
      </div>

      {/* Preset selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Quick Template:</span>
        {Object.keys(TEMPLATES).map((key) => (
          <button
            key={key}
            onClick={() => handleTemplateChange(key)}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
              selectedTemplate === key
                ? "bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 font-semibold"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Request Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as "GET" | "POST")}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold font-mono text-emerald-400 focus:outline-none"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/calculate-order"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {method === "POST" && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">JSON Request Body</label>
                <textarea
                  rows={14}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Response Viewer */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full min-h-[420px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Response</span>
              {response?._debug && (
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className={`px-2 py-0.5 rounded ${response._debug.httpStatus === 200 ? "text-emerald-400 bg-emerald-950/50" : "text-rose-400 bg-rose-950/50"}`}>
                    HTTP {response._debug.httpStatus}
                  </span>
                  <span className="text-slate-400">{response._debug.durationMs} ms</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <span className="text-xs font-mono">Executing Borzo API call...</span>
              </div>
            ) : response ? (
              <pre className="flex-1 bg-slate-950 p-4 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 overflow-auto max-h-[500px]">
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-xs">
                Click "Send Request" to see raw JSON response from Borzo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
