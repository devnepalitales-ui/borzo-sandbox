import React, { useState, useEffect, useRef } from "react";
import { PanelLeft, SquarePen, Clock, Calculator, Phone } from "lucide-react";
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
  const collapseBtnRef = useRef<HTMLButtonElement>(null);
  const expandBtnRef = useRef<HTMLButtonElement>(null);
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
    { id: "create" as Tab, label: "Dispatch & Book", Icon: SquarePen },
    { id: "orders" as Tab, label: "Deliveries History", Icon: Clock },
    { id: "calculator" as Tab, label: "Fare Calculator", Icon: Calculator },
  ];

  const activeMeta = {
    create: { title: "Dispatch & Book", crumb: "Enter destination, select kitchen items, and book a motorbike courier" },
    orders: { title: "Deliveries History", crumb: "Track active riders and manage pending kitchen pickups" },
    calculator: { title: "Fare Calculator", crumb: "Estimate Borzo delivery rates by route and weight" },
  }[activeTab];

  const isCollapsedRail = isDesktop && !desktopSidebarOpen;

  const handleToggleDesktopSidebar = () => {
    setDesktopSidebarOpen((prev) => {
      const next = !prev;
      requestAnimationFrame(() => {
        if (next) {
          collapseBtnRef.current?.focus();
        } else {
          expandBtnRef.current?.focus();
        }
      });
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
      <div className="md:hidden flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-black/[0.08] sticky top-0 z-30">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-[#111214] flex items-center gap-2">
            <span className="truncate">Nepali Tales</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
          <div className="text-xs text-zinc-600 mt-0.5">Borzo dispatch</div>
        </div>

        <button
          ref={mobileTriggerRef}
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-controls="dispatch-sidebar"
          aria-label={mobileMenuOpen ? "Close sidebar" : "Open sidebar"}
          className="h-9 w-9 rounded-xl bg-[#F3F4F6] hover:bg-zinc-200/80 text-[#111214] flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <PanelLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
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

      {/* Left Collapsible Sidebar (Expands to 272px, collapses to 68px rail on desktop) */}
      <aside
        id="dispatch-sidebar"
        role={!isDesktop && mobileMenuOpen ? "dialog" : undefined}
        aria-modal={!isDesktop && mobileMenuOpen ? true : undefined}
        aria-label="Sidebar navigation"
        aria-hidden={!isDesktop && !mobileMenuOpen}
        inert={!isDesktop && !mobileMenuOpen ? true : undefined}
        className={[
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-black/[0.08] transition-[width,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-clip shrink-0",
          "md:sticky md:top-0 md:z-20 md:h-dvh",
          isDesktop
            ? desktopSidebarOpen
              ? "w-[272px] translate-x-0"
              : "w-[68px] translate-x-0"
            : mobileMenuOpen
              ? "w-[280px] max-w-[85dvw] translate-x-0 shadow-2xl"
              : "w-[280px] -translate-x-full pointer-events-none",
        ].join(" ")}
      >
        {isCollapsedRail ? (
          /* Collapsed Desktop Rail (ChatGPT-style narrow icon rail) */
          <div className="w-[68px] h-full flex flex-col items-center justify-between py-5 px-2 overflow-y-auto overscroll-contain">
            <div className="flex flex-col items-center gap-5 w-full">
              <button
                ref={expandBtnRef}
                type="button"
                onClick={handleToggleDesktopSidebar}
                aria-expanded={false}
                aria-controls="dispatch-sidebar"
                aria-label="Expand sidebar"
                title="Expand sidebar"
                className="h-10 w-10 rounded-xl text-zinc-600 hover:text-[#111214] hover:bg-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer"
              >
                <PanelLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>

              <nav aria-label="Primary" className="flex flex-col items-center gap-1.5 w-full">
                {navigationItems.map(({ id, label, Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      aria-label={label}
                      title={label}
                      aria-current={isActive ? "page" : undefined}
                      className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#111214] text-white"
                          : "text-zinc-600 hover:text-[#111214] hover:bg-[#F3F4F6]"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  );
                })}
              </nav>
            </div>

            <a
              href={`tel:+${kitchenPhone.replace(/\D/g, "")}`}
              aria-label={`Call Thane West Kitchen (${formattedKitchenPhone})`}
              title={`Thane West Kitchen · ${formattedKitchenPhone}`}
              className="h-10 w-10 rounded-xl bg-[#0066FF] text-white flex items-center justify-center hover:bg-[#0052D4] transition-colors shrink-0"
            >
              <Phone className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </a>
          </div>
        ) : (
          /* Expanded Sidebar */
          <div className="w-[272px] h-full flex flex-col justify-between gap-6 px-4 py-5 overflow-y-auto overscroll-contain">
            <div className="space-y-6">
              {/* Brand Header + Collapse Toggle Icon */}
              <div className="px-2 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-zinc-700 tracking-tight truncate">
                      Nepali Tales
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>

                  {isDesktop ? (
                    <button
                      ref={collapseBtnRef}
                      type="button"
                      onClick={handleToggleDesktopSidebar}
                      aria-expanded={true}
                      aria-controls="dispatch-sidebar"
                      aria-label="Collapse sidebar"
                      title="Collapse sidebar"
                      className="h-8 w-8 rounded-xl text-zinc-600 hover:text-[#111214] hover:bg-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <PanelLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      ref={drawerCloseRef}
                      type="button"
                      onClick={handleCloseMobileDrawer}
                      aria-label="Close navigation sidebar"
                      title="Close sidebar"
                      className="h-8 w-8 rounded-xl text-zinc-600 hover:text-[#111214] hover:bg-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <PanelLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div>
                  <h2 className="text-[22px] font-semibold tracking-tight text-[#111214] leading-snug">
                    Kitchen Dispatch
                  </h2>
                  <p className="text-xs text-zinc-600 mt-1">Borzo delivery workbench</p>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav aria-label="Primary" className="space-y-1">
                <div className="px-3 pb-1.5 text-xs font-medium text-zinc-500">
                  Workspace
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
                      className={`w-full flex items-center text-left px-3 py-2.5 rounded-xl text-[13px] transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#111214] text-white font-medium"
                          : "text-zinc-600 hover:text-[#111214] hover:bg-[#F3F4F6] font-normal"
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Cobalt Blue Pickup Card */}
            <div className="rounded-[20px] bg-[#0066FF] text-white p-5 space-y-3 border border-black/[0.08] mt-auto">
              <div className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white">
                Kitchen pickup
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-sm leading-snug">Thane West Kitchen</div>
                <p className="text-xs text-white/90 leading-relaxed">
                  Metropolis Aquaris Phase 2, Ghodbunder Rd, Kasarvadavali 400615
                </p>
              </div>
              <a
                href={`tel:+${kitchenPhone.replace(/\D/g, "")}`}
                className="flex items-center justify-between w-full rounded-xl bg-[#111214] hover:bg-[#1E2024] px-3.5 py-2 text-xs font-mono tabular-nums text-white transition-colors"
              >
                <span>{formattedKitchenPhone}</span>
                <span className="font-sans text-xs font-medium text-zinc-300">Call</span>
              </a>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Workspace */}
      <div ref={mainContainerRef} className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 max-w-[1440px] w-full mx-auto space-y-6 flex-1">
          {/* Top Page Title & Status Pills Row */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-[#111214] tracking-tight">
                {activeMeta.title}
              </h1>
              <p className="text-xs text-zinc-600 mt-1">{activeMeta.crumb}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="h-8 inline-flex items-center gap-2 rounded-full bg-white border border-black/[0.08] px-3 text-xs font-medium text-[#111214]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>API Online</span>
              </div>

              <div className="h-8 inline-flex items-center gap-1.5 rounded-full bg-white border border-black/[0.08] px-3 text-xs font-mono tabular-nums text-zinc-700">
                <span className="text-zinc-500 font-sans">Client</span>
                <span className="font-medium text-[#111214]">{config?.borzo?.clientId || "8138640"}</span>
              </div>

              <div className="hidden sm:inline-flex h-8 items-center rounded-full bg-white border border-black/[0.08] px-3 text-xs font-mono text-zinc-600">
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
