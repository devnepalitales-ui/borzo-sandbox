import React from "react";
import { Zap, Clock, Calendar } from "lucide-react";

export type DeliveryMode = "now" | "4hour" | "schedule";

export interface ScheduleWindow {
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

export function getDefaultScheduleWindow(): ScheduleWindow {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  const start = new Date(now.getTime() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const date = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

  return { date, startTime, endTime };
}

/**
 * Formats a local date + HH:MM into Borzo's required ISO 8601 format
 * with a colon in the timezone offset (e.g. "2026-11-27T18:33:45+05:30").
 */
export function formatBorzoTimestamp(date: string, time: string): string {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${date}T${normalizedTime}${sign}${hh}:${mm}`;
}

export function buildDeliveryModePayload<
  T extends {
    type?: "standard" | "vip_delivery" | "endofday";
    vehicle_type_id?: number;
    total_weight_kg?: number;
    points: Array<Record<string, any>>;
  }
>(base: T, mode: DeliveryMode, schedule: ScheduleWindow): T {
  if (mode === "4hour") {
    // Borzo v1.8 endofday rules:
    // - vehicle_type_id is prohibited (motorbike auto-assigned)
    // - total_weight_kg is required and must be > 0
    // - required_start_datetime / required_finish_datetime are prohibited
    // - points must contain only 2 points
    const { vehicle_type_id: _omitted, ...rest } = base;
    return {
      ...rest,
      type: "endofday",
      total_weight_kg: Math.max(1, Number(base.total_weight_kg) || 1),
      points: base.points.slice(0, 2).map((pt) => {
        const { required_start_datetime: _s, required_finish_datetime: _f, ...ptRest } = pt;
        return ptRest;
      }),
    } as T;
  }

  if (mode === "schedule" && schedule.date && schedule.startTime && schedule.endTime) {
    const startIso = formatBorzoTimestamp(schedule.date, schedule.startTime);
    const endIso = formatBorzoTimestamp(schedule.date, schedule.endTime);
    return {
      ...base,
      type: "standard",
      points: base.points.map((pt, idx) =>
        idx === 0
          ? {
              ...pt,
              required_start_datetime: startIso,
              required_finish_datetime: endIso,
            }
          : pt
      ),
    };
  }

  return {
    ...base,
    type: "standard",
  };
}

export function getDeliveryModeLabel(mode: DeliveryMode): string {
  if (mode === "4hour") return "4-Hour · endofday";
  if (mode === "schedule") return "Scheduled";
  return "Deliver Now";
}

interface DeliveryModeSelectorProps {
  mode: DeliveryMode;
  onModeChange: (mode: DeliveryMode) => void;
  schedule: ScheduleWindow;
  onScheduleChange: (next: ScheduleWindow) => void;
  idPrefix?: string;
}

const OPTIONS: Array<{
  id: DeliveryMode;
  title: string;
  detail: string;
  badge?: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
}> = [
  {
    id: "now",
    title: "Deliver Now",
    detail: "Immediate dispatch",
    Icon: Zap,
  },
  {
    id: "4hour",
    title: "4-Hour Delivery",
    detail: "By 4 PM · Combined route",
    badge: "Save 30%",
    Icon: Clock,
  },
  {
    id: "schedule",
    title: "Schedule",
    detail: "Pick arrival window",
    Icon: Calendar,
  },
];

export function DeliveryModeSelector({
  mode,
  onModeChange,
  schedule,
  onScheduleChange,
  idPrefix = "delivery-mode",
}: DeliveryModeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-700">Delivery speed</span>
        <span className="text-[11px] font-mono text-zinc-500">
          {mode === "4hour" ? 'type: "endofday"' : 'type: "standard"'}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Delivery speed"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {OPTIONS.map(({ id, title, detail, badge, Icon }) => {
          const selected = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onModeChange(id)}
              className={`text-left rounded-xl border p-3 transition-colors duration-150 cursor-pointer flex flex-col justify-between gap-2 ${
                selected
                  ? "bg-[#EEF4FF] border-[#0066FF] ring-2 ring-[#0066FF]/12"
                  : "bg-[#F8F9FA] border-black/[0.08] hover:border-black/20 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    selected ? "text-[#0066FF]" : "text-zinc-500"
                  }`}
                  strokeWidth={1.5}
                  aria-hidden={true}
                />
                {badge && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                    {badge}
                  </span>
                )}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#111214] leading-snug">
                  {title}
                </div>
                <div className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                  {detail}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {mode === "4hour" && (
        <p className="rounded-xl bg-[#F8F9FA] border border-black/[0.06] px-3 py-2 text-[11px] text-zinc-600 leading-relaxed">
          Riders combine orders placed by 4 PM into routes. Borzo{" "}
          <span className="font-mono text-[#111214]">endofday</span> auto-assigns a motorbike and requires package weight.
        </p>
      )}

      {mode === "schedule" && (
        <div className="rounded-xl bg-[#F8F9FA] border border-black/[0.08] p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label htmlFor={`${idPrefix}-date`} className="text-[11px] font-medium text-zinc-700 block">
              Pickup date
            </label>
            <input
              id={`${idPrefix}-date`}
              type="date"
              value={schedule.date}
              onChange={(e) => onScheduleChange({ ...schedule, date: e.target.value })}
              className="w-full h-9 rounded-lg border border-black/[0.1] bg-white px-2.5 text-xs font-mono tabular-nums text-[#111214] focus-visible:outline-none focus-visible:border-[#0066FF]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${idPrefix}-start`} className="text-[11px] font-medium text-zinc-700 block">
              Window from
            </label>
            <input
              id={`${idPrefix}-start`}
              type="time"
              value={schedule.startTime}
              onChange={(e) => onScheduleChange({ ...schedule, startTime: e.target.value })}
              className="w-full h-9 rounded-lg border border-black/[0.1] bg-white px-2.5 text-xs font-mono tabular-nums text-[#111214] focus-visible:outline-none focus-visible:border-[#0066FF]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${idPrefix}-end`} className="text-[11px] font-medium text-zinc-700 block">
              Window until
            </label>
            <input
              id={`${idPrefix}-end`}
              type="time"
              value={schedule.endTime}
              onChange={(e) => onScheduleChange({ ...schedule, endTime: e.target.value })}
              className="w-full h-9 rounded-lg border border-black/[0.1] bg-white px-2.5 text-xs font-mono tabular-nums text-[#111214] focus-visible:outline-none focus-visible:border-[#0066FF]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
