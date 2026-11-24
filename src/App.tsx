import React, { useState, useEffect } from "react";
import {
  Send,
  Calculator,
  Package,
  Radio,
  Terminal,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
  MapPin,
  Phone,
  Layers,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { CreateOrder } from "./components/CreateOrder";
import { PriceCalculator } from "./components/PriceCalculator";
import { OrdersList } from "./components/OrdersList";
import { WebhookLogs } from "./components/WebhookLogs";
import { RawExplorer } from "./components/RawExplorer";

type Tab = "create" | "calculator" | "orders" | "webhooks" | "raw";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [config, setConfig] = useState<any>(null);
  const [switchingEnv, setSwitchingEnv] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchConfig = () => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error("Failed to load config:", err));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleToggleEnv = async () => {
    if (!config?.borzo?.env) return;
    const targetEnv = config.borzo.env === "production" ? "test" : "production";
    const confirmMsg =
      targetEnv === "production"
        ? "Switch to LIVE PRODUCTION mode?\n\nReal couriers will be requested from Borzo in Mumbai/Thane and real charges will apply."
        : "Switch to TEST SANDBOX mode?\n\nRequests will be routed to robotapitest with simulated couriers.";
    if (!confirm(confirmMsg)) return;

    setSwitchingEnv(true);
    try {
      const res = await fetch("/api/borzo/switch-env", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env: targetEnv }),
      });
      const data = await res.json();
      if (data.is_successful) {
        fetchConfig();
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Failed to switch env:", err);
    } finally {
      setSwitchingEnv(false);
    }
  };

  const isProduction = config?.borzo?.env === "production";

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-rose-500/20 selection:text-white">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-amber-600 font-bold text-white shadow-sm shadow-rose-950/60 text-sm">
                NT
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-zinc-100 tracking-tight">Nepali Tales</span>
                  <span className="text-zinc-500 text-xs font-normal">/</span>
                  <span className="text-xs font-medium text-zinc-300">Borzo Dispatcher</span>
                  <Badge variant={isProduction ? "destructive" : "warning"}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isProduction ? "bg-rose-400 animate-pulse" : "bg-amber-400"}`} />
                    {isProduction ? "Live Production" : "Test Sandbox"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Controls & Environment Info */}
            <div className="flex items-center gap-2.5">
              <div className="hidden md:flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400">
                <span className="text-zinc-500">Domain:</span>
                <span className="font-mono font-medium text-zinc-200">test.nepalitales.com</span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400">
                <span className="text-zinc-500">Client:</span>
                <span className="font-mono font-semibold text-zinc-200">{config?.borzo?.clientId || "8138640"}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleEnv}
                disabled={switchingEnv}
                className="h-8 gap-1.5 text-[11px]"
              >
                <RefreshCw className={`h-3 w-3 ${switchingEnv ? "animate-spin" : ""}`} />
                {isProduction ? "Switch to Test" : "Switch to Live"}
              </Button>

              <a
                href={
                  isProduction
                    ? "https://borzodelivery.com/in/cabinet/integration"
                    : "https://apitest.borzodelivery.com/in/cabinet/integration"
                }
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="secondary" size="sm" className="h-8 gap-1.5 text-[11px]">
                  <ExternalLink className="h-3 w-3 text-zinc-400" />
                  Cabinet
                </Button>
              </a>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-1 overflow-x-auto border-t border-zinc-900/80 pt-1 -mb-px">
            <button
              onClick={() => setActiveTab("create")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "create"
                  ? "border-rose-500 text-rose-400 font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              Dispatch & Book
            </button>
            <button
              onClick={() => setActiveTab("calculator")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "calculator"
                  ? "border-rose-500 text-rose-400 font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Calculator className="h-3.5 w-3.5" />
              Fare Calculator
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "orders"
                  ? "border-rose-500 text-rose-400 font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              Deliveries History
            </button>
            <button
              onClick={() => setActiveTab("webhooks")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "webhooks"
                  ? "border-rose-500 text-rose-400 font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              Webhook & Callbacks
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "raw"
                  ? "border-rose-500 text-rose-400 font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              API Inspector
            </button>
          </nav>
        </div>
      </header>

      {/* Cloud Kitchen Context Strip */}
      <div className="border-b border-zinc-900 bg-zinc-900/30 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            <span className="text-zinc-300 font-medium shrink-0">Pickup Point:</span>
            <span className="truncate text-zinc-400">
              Metropolis Aquaris Phase 2, Kasarvadavali, Thane West, MH 400615
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] shrink-0 font-mono text-zinc-400">
            <Phone className="h-3 w-3 text-zinc-500" />
            <span>+91 75850 80407 (Kitchen Dispatch)</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "create" && (
          <CreateOrder
            config={config}
            onOrderCreated={() => setRefreshTrigger((prev) => prev + 1)}
          />
        )}
        {activeTab === "calculator" && <PriceCalculator config={config} />}
        {activeTab === "orders" && <OrdersList key={refreshTrigger} />}
        {activeTab === "webhooks" && <WebhookLogs />}
        {activeTab === "raw" && <RawExplorer token={config?.borzo?.token} />}
      </main>

      {/* Restrained Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs text-zinc-500">
        Nepali Tales Cloud Kitchen &middot; Thane West &middot; Borzo Business API v1.8 Integration &middot; <span className="font-mono text-zinc-400">test.nepalitales.com</span>
      </footer>
    </div>
  );
}
