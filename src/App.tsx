import React, { useState, useEffect } from "react";
import {
  Send,
  Calculator,
  Package,
  Bell,
  Terminal,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
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
        ? "Switch to LIVE PRODUCTION mode? Real couriers will be assigned and real charges will apply."
        : "Switch to TEST SANDBOX mode? Uses robotapitest with simulated deliveries.";
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation & Status Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Logo & Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-red-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-rose-600/30">
              🇳🇵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">Nepali Tales Delivery Dispatch</h1>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1.5 ${
                    isProduction
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                      : "bg-amber-500/15 text-amber-300 border-amber-500/40"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isProduction ? "bg-rose-500 animate-pulse" : "bg-amber-400"
                    }`}
                  ></span>
                  {isProduction ? "Live Production" : "Test Sandbox"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Borzo Business API v1.8 &middot; Dispatch deliveries to friends, family & customers
              </p>
            </div>
          </div>

          {/* Environment & Cabinet Controls */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Deployment Domain Pill */}
            <div className="hidden sm:flex bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 items-center gap-2">
              <span className="text-slate-400">Host:</span>
              <span className="font-mono text-emerald-400 font-medium">test.nepalitales.com</span>
            </div>

            {/* Client ID */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-slate-400">Client ID:</span>
              <span className="font-mono text-white font-semibold">{config?.borzo?.clientId || "8138640"}</span>
            </div>

            {/* Mode Switcher Button */}
            <button
              onClick={handleToggleEnv}
              disabled={switchingEnv}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isProduction
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  : "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/40"
              }`}
              title="Click to switch between Live Production and Test Sandbox"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${switchingEnv ? "animate-spin" : ""}`} />
              {isProduction ? "Switch to Test Mode" : "Switch to Live Mode"}
            </button>

            {/* Cabinet Link */}
            <a
              href={
                isProduction
                  ? "https://borzodelivery.com/in/cabinet/integration"
                  : "https://apitest.borzodelivery.com/in/cabinet/integration"
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Borzo Cabinet
            </a>
          </div>
        </div>

        {/* Live Warning Banner if Production */}
        {isProduction && (
          <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-rose-950/60 border-t border-rose-900/40 px-4 py-1.5 text-center text-[11px] text-rose-300 flex items-center justify-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>
              <strong>LIVE PRODUCTION MODE ACTIVE:</strong> Orders placed here will book real Borzo bike couriers from Nepali Tales Kitchen (Metropolis Rivera, Kasarvadavali, Thane).
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-slate-800/80 pt-1">
          <button
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "create"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Send className="w-4 h-4" />
            1. Book Delivery Service
          </button>
          <button
            onClick={() => setActiveTab("calculator")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "calculator"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calculator className="w-4 h-4" />
            2. Price Estimator
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "orders"
                ? "border-sky-500 text-sky-400 bg-sky-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Package className="w-4 h-4" />
            3. Orders & Courier Tracker
          </button>
          <button
            onClick={() => setActiveTab("webhooks")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "webhooks"
                ? "border-amber-500 text-amber-400 bg-amber-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bell className="w-4 h-4" />
            4. Webhook & Callback Status
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "raw"
                ? "border-purple-500 text-purple-400 bg-purple-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-4 h-4" />
            5. Raw API Playground
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-4 text-center text-xs text-slate-500">
        Nepali Tales Cloud Kitchen &middot; Metropolis Rivera / Aquaris Phase 2, Kasarvadavali, Thane West 400615 &middot; Powered by Borzo Business API v1.8
      </footer>
    </div>
  );
}
