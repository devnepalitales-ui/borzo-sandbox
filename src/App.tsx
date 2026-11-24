import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Phone,
} from "lucide-react";
import { Badge } from "./components/ui/badge";
import { CreateOrder } from "./components/CreateOrder";
import { PriceCalculator } from "./components/PriceCalculator";
import { OrdersList } from "./components/OrdersList";

type Tab = "create" | "orders" | "calculator";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [config, setConfig] = useState<any>(null);
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

  const navigationItems = [
    {
      id: "create" as Tab,
      label: "Dispatch & Book",
      description: "Book courier from kitchen",
    },
    {
      id: "orders" as Tab,
      label: "Deliveries History",
      description: "Track live couriers & orders",
    },
    {
      id: "calculator" as Tab,
      label: "Fare Calculator",
      description: "Quick quote & distance test",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-rose-500/20 selection:text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950 sticky top-0 z-50">
        <div>
          <div className="font-bold text-sm text-zinc-100 flex items-center gap-2">
            <span>Nepali Tales</span>
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 font-mono">
              <span className="h-1.5 w-1.5 rounded-full mr-1 bg-rose-400 animate-pulse" />
              Live
            </Badge>
          </div>
          <div className="text-[11px] text-zinc-500">Borzo Dispatcher</div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-zinc-100 tracking-tight">
                  Nepali Tales
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Borzo Dispatcher</p>
              </div>
              <Badge variant="destructive" className="text-[9px] px-2 py-0.5 font-mono">
                <span className="h-1.5 w-1.5 rounded-full mr-1 bg-rose-400 animate-pulse" />
                Live
              </Badge>
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
              Navigation
            </div>

            {navigationItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-900/90 border border-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
                  }`}
                >
                  <div>
                    <div className={`text-xs font-semibold ${isActive ? "text-zinc-100" : "text-zinc-300"}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                      {item.description}
                    </div>
                  </div>

                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Kitchen Pickup Point Card */}
          <div className="p-3.5 mx-3 mb-3 rounded-xl bg-zinc-900/40 border border-zinc-800/70">
            <div className="text-[11px] font-semibold text-zinc-300 mb-1">
              Kitchen Pickup Point
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Metropolis Aquaris Phase 2, Ghodbunder Rd, Kasarvadavali, Thane West 400615
            </p>
            <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 font-mono">
              <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
              <span>+91 75850 80407 (Kitchen)</span>
            </div>
          </div>
        </div>

        {/* Minimal Clean Sidebar Footer */}
        <div className="p-3.5 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>test.nepalitales.com</span>
          <span className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live Borzo
          </span>
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
