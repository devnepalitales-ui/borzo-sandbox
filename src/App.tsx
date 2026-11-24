import React, { useState, useEffect } from "react";
import { Menu, X, ArrowUpRight, ChevronRight } from "lucide-react";
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
    { id: "create" as Tab, label: "Dispatch & Book" },
    { id: "orders" as Tab, label: "Deliveries History" },
    { id: "calculator" as Tab, label: "Fare Calculator" },
  ];

  const activeMeta = {
    create: { title: "Dispatch Overview", crumb: "Dispatch › Live Booking" },
    orders: { title: "Deliveries History", crumb: "Orders › Live Courier Tracking" },
    calculator: { title: "Fare Calculator", crumb: "Estimator › Distance & Vehicle Quotes" },
  }[activeTab];

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111214] flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-black/[0.06] sticky top-0 z-50">
        <div>
          <div className="font-bold text-sm text-[#111214] flex items-center gap-2">
            <span>Nepali Tales</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <div className="text-[11px] text-zinc-500">Borzo Dispatcher</div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-full bg-[#F3F4F6] text-[#111214] hover:bg-zinc-200 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Left Sidebar (Clean Light Bento Shell, No Icons on Tabs, No NT Logo) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-black/[0.05] flex flex-col justify-between p-5 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          {/* Greeting / Brand Header */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 tracking-tight">Nepali Tales</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#111214] leading-[1.15] pt-2">
              Welcome Back,
              <br />
              Founder!
            </h2>
            <p className="text-xs text-zinc-500 pt-0.5">Borzo delivery dispatch console</p>
          </div>

          {/* Navigation Menu (No Icons, No Quick Book Badge) */}
          <nav className="space-y-1.5">
            <div className="px-3 pb-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Menu
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
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#111214] text-white font-semibold shadow-sm"
                      : "text-zinc-600 hover:text-[#111214] hover:bg-[#F3F4F6] font-medium"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Cobalt Blue Pickup Card (Matching Reference Accent Card) */}
        <div className="rounded-[22px] bg-gradient-to-br from-[#1070FF] via-[#0066FF] to-[#004EC4] text-white p-4 space-y-3 shadow-sm mt-6">
          <div className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-semibold text-white">
            Kitchen Pickup
          </div>
          <div className="space-y-1">
            <div className="font-bold text-sm leading-tight">Thane West Kitchen</div>
            <p className="text-[11px] text-blue-100/90 leading-relaxed">
              Metropolis Aquaris Phase 2, Ghodbunder Rd, Kasarvadavali 400615
            </p>
          </div>
          <div className="inline-flex items-center justify-between w-full rounded-full bg-[#111214] px-3 py-1.5 text-[11px] font-mono text-white">
            <span>+91 75850 80407</span>
            <span className="h-4 w-4 rounded-full bg-white/15 flex items-center justify-center">
              <ArrowUpRight className="w-2.5 h-2.5 text-white" />
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-7 max-w-[1440px] w-full mx-auto space-y-5 flex-1">
          {/* Top Page Title & Status Pills Row */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#111214] tracking-tight">
                {activeMeta.title}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">{activeMeta.crumb}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-black/[0.05] px-3.5 py-1.5 text-xs font-medium text-[#111214] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>API Online</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-white border border-black/[0.05] px-3.5 py-1.5 text-xs font-mono text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="text-zinc-400">Client:</span>
                <span className="font-semibold text-[#111214]">{config?.borzo?.clientId || "8138640"}</span>
              </div>

              <div className="hidden sm:inline-flex items-center rounded-full bg-white border border-black/[0.05] px-3.5 py-1.5 text-xs font-mono text-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                test.nepalitales.com
              </div>
            </div>
          </header>

          {/* Active Bento Content */}
          <main>
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
        </div>
      </div>
    </div>
  );
}
