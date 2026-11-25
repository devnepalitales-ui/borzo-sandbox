import React, { useState, useEffect, useRef } from "react";
import { CreateOrder } from "./components/CreateOrder";
import { PriceCalculator } from "./components/PriceCalculator";
import { OrdersList } from "./components/OrdersList";

type Tab = "create" | "orders" | "calculator";

const SIDEBAR_STORAGE_KEY = "borzo-sidebar-open";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [config, setConfig] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return saved === null ? true : saved === "true";
    } catch {
      return true;
    }
  });
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : true
  );

  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const desktopExpandRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const fetchConfig = () => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error("Failed to load config:", err));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      if (e.matches) {
        setMobileMenuOpen(false);
      }
    };
    setIsDesktop(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(desktopSidebarOpen));
    } catch {
      // Ignore storage failures
    }
  }, [desktopSidebarOpen]);

  // Manage mobile drawer modality: inert main workspace, Escape key, and focus handling
  useEffect(() => {
    const mainEl = mainContainerRef.current;
    if (!isDesktop && mobileMenuOpen) {
      if (mainEl) mainEl.inert = true;
      drawerCloseRef.current?.focus();

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMobileMenuOpen(false);
          mobileTriggerRef.current?.focus();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => {
        if (mainEl) mainEl.inert = false;
        document.removeEventListener("keydown", onKeyDown);
      };
    } else if (mainEl) {
      mainEl.inert = false;
    }
  }, [isDesktop, mobileMenuOpen]);

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

  const isSidebarCollapsedOnDesktop = isDesktop && !desktopSidebarOpen;

  const handleToggleDesktopSidebar = () => {
    setDesktopSidebarOpen((prev) => {
      const next = !prev;
      if (!next) {
        requestAnimationFrame(() => desktopExpandRef.current?.focus());
      }
      return next;
    });
  };

  const handleCloseMobileDrawer = () => {
    setMobileMenuOpen(false);
    requestAnimationFrame(() => mobileTriggerRef.current?.focus());
  };

  const kitchenPhone = config?.kitchen?.phone || "917585080407";
  const formattedKitchenPhone =
    kitchenPhone.length === 12 && kitchenPhone.startsWith("91")
      ? `+91 ${kitchenPhone.slice(2, 7)} ${kitchenPhone.slice(7)}`
      : "+91 75850 80407";

  return (
    <div className="min-h-dvh bg-[#F3F4F6] text-[#111214] flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-black/[0.06] sticky top-0 z-30">
        <div className="min-w-0">
          <div className="font-bold text-sm text-[#111214] flex items-center gap-2">
            <span className="truncate">Nepali Tales</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Borzo Dispatcher</div>
        </div>

        <button
          ref={mobileTriggerRef}
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-controls="dispatch-sidebar"
          className="h-9 px-4 rounded-full bg-[#F3F4F6] hover:bg-zinc-200/80 text-xs font-semibold text-[#111214] transition-colors cursor-pointer shrink-0"
        >
          {mobileMenuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {!isDesktop && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={handleCloseMobileDrawer}
          aria-hidden="true"
        />
      )}

      {/* Left Collapsible Sidebar */}
      <aside
        id="dispatch-sidebar"
        role={!isDesktop && mobileMenuOpen ? "dialog" : undefined}
        aria-modal={!isDesktop && mobileMenuOpen ? true : undefined}
        aria-label="Sidebar navigation"
        aria-hidden={isSidebarCollapsedOnDesktop || (!isDesktop && !mobileMenuOpen)}
        inert={isSidebarCollapsedOnDesktop || (!isDesktop && !mobileMenuOpen) ? true : undefined}
        className={[
          "fixed inset-y-0 left-0 z-50 bg-white border-black/[0.06] transition-[width,transform,opacity] duration-200 ease-out overflow-clip shrink-0",
          "md:sticky md:top-0 md:z-20 md:h-dvh",
          isDesktop
            ? desktopSidebarOpen
              ? "w-[272px] border-r opacity-100 translate-x-0"
              : "w-0 border-r-0 opacity-0 pointer-events-none"
            : mobileMenuOpen
              ? "w-[280px] max-w-[85dvw] border-r translate-x-0 shadow-2xl"
              : "w-[280px] -translate-x-full pointer-events-none",
        ].join(" ")}
      >
        <div className="w-[272px] md:w-[272px] h-full flex flex-col justify-between gap-6 px-4 py-5 overflow-y-auto overscroll-contain">
          <div className="space-y-6">
            {/* Brand Header + Collapse Control */}
            <div className="px-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-zinc-600 tracking-tight truncate">
                    Nepali Tales
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>

                {isDesktop ? (
                  <button
                    type="button"
                    onClick={handleToggleDesktopSidebar}
                    aria-expanded={desktopSidebarOpen}
                    aria-controls="dispatch-sidebar"
                    aria-label="Collapse sidebar"
                    className="h-7 px-2.5 rounded-full bg-[#F3F4F6] hover:bg-zinc-200/80 text-[11px] font-semibold text-zinc-600 hover:text-[#111214] transition-colors cursor-pointer shrink-0"
                  >
                    Hide
                  </button>
                ) : (
                  <button
                    ref={drawerCloseRef}
                    type="button"
                    onClick={handleCloseMobileDrawer}
                    aria-label="Close navigation menu"
                    className="h-8 px-3 rounded-full bg-[#F3F4F6] hover:bg-zinc-200/80 text-[11px] font-semibold text-[#111214] transition-colors cursor-pointer shrink-0"
                  >
                    Close
                  </button>
                )}
              </div>

              <div className="pt-1">
                <h2 className="text-2xl font-bold tracking-tight text-[#111214] leading-[1.15]">
                  Welcome Back,
                  <br />
                  Founder!
                </h2>
                <p className="text-xs text-zinc-500 mt-1.5">Borzo delivery dispatch console</p>
              </div>
            </div>

            {/* Navigation Menu (Icon-free, aligned on consistent 12px inner inset) */}
            <nav aria-label="Primary" className="space-y-1">
              <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Menu
              </div>

              {navigationItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={`w-full flex items-center text-left px-3 py-2.5 rounded-full text-xs transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#111214] text-white font-semibold shadow-sm"
                        : "text-zinc-600 hover:text-[#111214] hover:bg-[#F3F4F6] font-medium"
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Cobalt Blue Pickup Card */}
          <div className="rounded-[24px] bg-gradient-to-br from-[#1070FF] via-[#0066FF] to-[#004EC4] text-white p-5 space-y-3.5 shadow-sm mt-auto">
            <div className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white">
              Kitchen Pickup
            </div>
            <div className="space-y-1">
              <div className="font-bold text-sm leading-tight">Thane West Kitchen</div>
              <p className="text-[11px] text-blue-50/95 leading-relaxed">
                Metropolis Aquaris Phase 2, Ghodbunder Rd, Kasarvadavali 400615
              </p>
            </div>
            <a
              href={`tel:+${kitchenPhone.replace(/\D/g, "")}`}
              className="flex items-center justify-between w-full rounded-full bg-[#111214] hover:bg-[#1E2024] px-3.5 py-2 text-[11px] font-mono text-white transition-colors"
            >
              <span>{formattedKitchenPhone}</span>
              <span className="font-sans text-[10px] font-semibold text-zinc-300">Call</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div ref={mainContainerRef} className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 max-w-[1440px] w-full mx-auto space-y-6 flex-1">
          {/* Top Page Title & Status Pills Row */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {isSidebarCollapsedOnDesktop && (
                <button
                  ref={desktopExpandRef}
                  type="button"
                  onClick={handleToggleDesktopSidebar}
                  aria-expanded={false}
                  aria-controls="dispatch-sidebar"
                  aria-label="Expand sidebar"
                  className="h-9 px-4 rounded-full bg-white border border-black/[0.06] hover:bg-zinc-50 text-xs font-semibold text-[#111214] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors cursor-pointer shrink-0"
                >
                  Menu
                </button>
              )}

              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-[#111214] tracking-tight">
                  {activeMeta.title}
                </h1>
                <p className="text-xs text-zinc-500 mt-1">{activeMeta.crumb}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-black/[0.05] px-3.5 py-1.5 text-xs font-medium text-[#111214] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>API Online</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-white border border-black/[0.05] px-3.5 py-1.5 text-xs font-mono text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="text-zinc-500">Client:</span>
                <span className="font-semibold text-[#111214]">{config?.borzo?.clientId || "8138640"}</span>
              </div>

              <div className="hidden sm:inline-flex items-center rounded-full bg-white border border-black/[0.05] px-3.5 py-1.5 text-xs font-mono text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
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
