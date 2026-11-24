import React, { useState } from "react";
import { Terminal, Send, Copy, Check, Loader2, Sparkles, Code2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Input } from "./ui/input";

const TEMPLATES: Record<string, { label: string; endpoint: string; method: "GET" | "POST"; payload?: any }> = {
  calculateOrder: {
    label: "Calculate Fare",
    endpoint: "/calculate-order",
    method: "POST",
    payload: {
      type: "standard",
      matter: "Food order - Nepali Tales (Momos & Curry)",
      vehicle_type_id: 8,
      total_weight_kg: 1,
      points: [
        {
          address: "Metropolis Aquaris Phase 2, Ghodbunder Rd, Kasarvadavali, Thane West, Maharashtra 400615",
          contact_person: { phone: "917585080407", name: "Nepali Tales Kitchen" },
        },
        {
          address: "Hiranandani Estate, Thane West, Maharashtra 400607",
          contact_person: { phone: "919820000001", name: "Family Recipient" },
        },
      ],
    },
  },
  createOrder: {
    label: "Create Live Order",
    endpoint: "/create-order",
    method: "POST",
    payload: {
      type: "standard",
      matter: "Fresh Steamed Momos & Jhol Curry",
      vehicle_type_id: 8,
      total_weight_kg: 1,
      points: [
        {
          address: "Metropolis Aquaris Phase 2, Ghodbunder Rd, Kasarvadavali, Thane West, Maharashtra 400615",
          contact_person: { phone: "917585080407", name: "Nepali Tales Kitchen" },
          note: "Ground Floor Pickup",
        },
        {
          address: "Viviana Mall, Eastern Express Hwy, Thane West, Maharashtra 400606",
          contact_person: { phone: "919820000002", name: "Recipient" },
          client_order_id: "NT-LIVE-01",
          note: "Deliver to food court entrance",
        },
      ],
    },
  },
  listOrders: {
    label: "List Recent Orders",
    endpoint: "/orders?count=10",
    method: "GET",
  },
  cancelOrder: {
    label: "Cancel Order",
    endpoint: "/cancel-order",
    method: "POST",
    payload: {
      order_id: 1250032,
    },
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
    const rawToken = token || "1AD41C9342210CAF081601ABA8A30EB851514A89";
    const fullUrl = `https://robot-in.borzodelivery.com/api/business/1.8${endpoint}`;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            Raw API Inspector & cURL Studio
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Execute low-level requests directly against Borzo Business API v1.8, test edge payloads, and export ready-to-run cURLs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyCurl} className="font-mono text-xs">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            {copied ? "Copied cURL" : "Copy cURL"}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSend} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
            Execute Request
          </Button>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Preset Templates:
        </span>
        {Object.entries(TEMPLATES).map(([key, tmpl]) => (
          <button
            key={key}
            onClick={() => handleTemplateChange(key)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer border ${
              selectedTemplate === key
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            {tmpl.label}
          </button>
        ))}
      </div>

      {/* Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Request Config */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-zinc-400" />
                Request Configuration
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">v1.8</Badge>
            </div>
            <CardDescription>Target endpoint and JSON body</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as "GET" | "POST")}
                className="h-9 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
              <Input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/calculate-order"
                className="font-mono text-xs flex-1"
              />
            </div>

            {method === "POST" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-400">JSON Payload Body</label>
                  <span className="text-[10px] text-zinc-400 font-mono">application/json</span>
                </div>
                <textarea
                  rows={14}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  spellCheck={false}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Response Card */}
        <Card className="flex flex-col min-h-[460px]">
          <CardHeader className="pb-3 border-b border-zinc-800/80">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Live Response
              </CardTitle>
              {response?._debug && (
                <div className="flex items-center gap-2">
                  <Badge variant={response._debug.httpStatus === 200 ? "success" : "destructive"} className="font-mono text-[10px]">
                    HTTP {response._debug.httpStatus}
                  </Badge>
                  <span className="text-[11px] font-mono text-zinc-400">{response._debug.durationMs}ms</span>
                </div>
              )}
            </div>
            <CardDescription>Formatted JSON returned from Borzo Business API</CardDescription>
          </CardHeader>

          <CardContent className="flex-1 p-4 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-2 py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                <span className="text-xs font-mono">Awaiting Borzo API handshake...</span>
              </div>
            ) : response ? (
              <pre className="flex-1 bg-zinc-950 p-4 rounded-lg border border-zinc-800/80 font-mono text-xs text-zinc-300 overflow-auto max-h-[500px]">
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-xs py-16 text-center">
                <Terminal className="w-8 h-8 text-zinc-400 mb-2" />
                Execute a request or pick a preset template to inspect the live response.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
