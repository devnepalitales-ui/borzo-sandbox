import React, { useState, useEffect } from "react";
import {
  Send,
  Calculator,
  Package,
  ExternalLink,
  RefreshCw,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Truck,
  Sparkles,
  Store,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { CreateOrder } from "./components/CreateOrder";
import { PriceCalculator } from "./components/PriceCalculator";
import { OrdersList } from "./components/OrdersList";

type Tab = "create" | "orders" | "calculator";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [config, setConfig] = useState<any>(null);
  const [switchingEnv, setSwitchingEnv] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navigationItems = [
    {
      id: "create" as Tab,
      label: "Dispatch & Book",
      description: "Book courier from cloud kitchen",
      icon: Send,
      badge: "Fast Book",
    },
    {
      id: "orders" as Tab,
      label: "Deliveries History",
      description: "Track live couriers & orders",
      icon: Package,
    },
    {
      id: "calculator" as Tab,
      label: "Fare Calculator",
      description: "Quick quote & distance test",
      icon: Calculator,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-rose-500/20 selection:text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-amber-600 font-bold text-white text-xs shadow-sm shadow-rose-950/60">
            NT
          </div>
          <div>
            <div className="font-bold text-xs text-zinc-100 flex items-center gap-1.5">
              <span>Nepali Tales</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400 font-normal">Dispatcher</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">test.nepalitales.com</div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Sidebar Dashboard Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-5 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 font-black text-white shadow-md shadow-rose-950/40 text-sm tracking-wide">
                NT
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-zinc-100 tracking-tight">Nepali Tales</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-zinc-400">Borzo Dispatcher</span>
                  <Badge variant={isProduction ? "destructive" : "warning"} className="text-[9px] px-1.5 py-0">
                    <span
                      className={`h-1.5 w-1.5 rounded-full mr-1 ${
                        isProduction ? "bg-rose-400 animate-pulse" : "bg-amber-400"
                      }`}
                    />
                    {isProduction ? "Production" : "Sandbox"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Context Pill */}
            <div className="mt-3.5 pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>Client: {config?.borzo?.clientId || "8138640"}</span>
              <span className="text-zinc-400">v1.8 API</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 flex-1">
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Dispatch Console
            </div>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer group ${
                    isActive
                      ? "bg-rose-500/10 border border-rose-500/30 text-rose-300 shadow-sm shadow-rose-950/20"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200 group-hover:border-zinc-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-xs font-semibold ${isActive ? "text-rose-200" : "text-zinc-200"}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.badge ? (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isActive ? "text-rose-400 translate-x-0.5" : "text-zinc-600 group-hover:text-zinc-400"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Kitchen Pickup Point Card */}
          <div className="p-3 mx-3 mb-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-semibold text-zinc-300">Kitchen Pickup Point</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Metropolis Aquaris Phase 2, Ghodbunder Rd, Kasarvadavali, Thane West 400615
            </p>
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 font-mono">
              <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
              <span>+91 75850 80407 (Kitchen)</span>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleEnv}
              disabled={switchingEnv}
              className="h-8 text-[11px] font-medium justify-center px-2"
            >
              <RefreshCw className={`w-3 h-3 mr-1.5 ${switchingEnv ? "animate-spin" : ""}`} />
              {isProduction ? "Test Mode" : "Live Mode"}
            </Button>

            <a
              href={
                isProduction
                  ? "https://borzodelivery.com/in/cabinet/integration"
                  : "https://apitest.borzodelivery.com/in/cabinet/integration"
              }
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <Button variant="secondary" size="sm" className="w-full h-8 text-[11px] justify-center px-2">
                <ExternalLink className="w-3 h-3 text-zinc-400 mr-1.5" />
                Cabinet
              </Button>
            </a>
          </div>

          <div className="text-center pt-1 text-[10px] text-zinc-600 font-mono">
            test.nepalitales.com &middot; Borzo India
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Strip */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-zinc-100 tracking-tight">
              {activeTab === "create" && "Dispatch Delivery Order"}
              {activeTab === "orders" && "Deliveries History & Live Couriers"}
              {activeTab === "calculator" && "Instant Fare & Distance Calculator"}
            </h1>
            <span className="text-zinc-600 text-xs">&middot;</span>
            <span className="text-xs text-zinc-400">
              {activeTab === "create" && "Automated pricing, geocoding & courier dispatch"}
              {activeTab === "orders" && "Active, available and completed orders in Thane/Mumbai"}
              {activeTab === "calculator" && "Live Borzo API price estimation by vehicle and weight"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-zinc-400">API Connection:</span>
              <span className="font-semibold text-zinc-200">Online</span>
            </div>
            <div className="text-xs font-mono text-zinc-400 bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-zinc-800">
              Client ID: <span className="text-zinc-200 font-bold">{config?.borzo?.clientId || "8138640"}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full">
          {activeTab === "create" && (
            <CreateOrder
              config={config}
              onOrderCreated={() => {
                setRefreshTrigger((prev) => prev + 1);
                setActiveTab("orders");
              }}
            />
          )}
          {activeTab === "orders" && <OrdersList key={refreshTrigger} />}
          {activeTab === "calculator" && <PriceCalculator config={config} />}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-zinc-900 px-8 py-3 text-xs text-zinc-600 flex items-center justify-between">
          <span>Nepali Tales Cloud Kitchen &middot; Thane West, Maharashtra</span>
          <span className="font-mono text-zinc-500">Borzo Business API v1.8</span>
        </footer>
      </div>
    </div>
  );
}
