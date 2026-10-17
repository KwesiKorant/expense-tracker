"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X, BarChart3, Plus } from "lucide-react";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";
import { TextReveal } from "@/components/ui/text-reveal";

interface CashFlowMonth {
  month: string;
  income: number;
  expenses: number;
}

interface CashFlowChartProps {
  data: CashFlowMonth[];
  isLoading?: boolean;
  onOpenAddModal?: () => void;
}

/**
 * CashFlowChart Primitive — Arc-AA & Emil Kowalski Standard
 * - Zero blue text selection: Pure select-none with tactile bar selection feedback.
 * - Anti-clipping: Dedicated 54px Y-axis gutter and ample padding.
 * - Fluid horizontal viewport with hidden scrollbars and directional edge arrows.
 */
export function CashFlowChart({
  data,
  isLoading = false,
  onOpenAddModal,
}: CashFlowChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  const tickingRef = useRef(false);

  // Evaluate horizontal scroll boundaries batched inside requestAnimationFrame
  // Uses state equality checks to prevent unnecessary React re-render cycles during scrolling
  const checkScrollability = useCallback(() => {
    if (!tickingRef.current) {
      window.requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) {
          const { scrollLeft, scrollWidth, clientWidth } = el;
          const left = scrollLeft > 6;
          const right = scrollLeft < scrollWidth - clientWidth - 6;
          setCanScrollLeft((prev) => (prev !== left ? left : prev));
          setCanScrollRight((prev) => (prev !== right ? right : prev));
        }
        tickingRef.current = false;
      });
      tickingRef.current = true;
    }
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = scrollRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      checkScrollability();
    });
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, [checkScrollability, data]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -180 : 180;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const selectedMonthData = data.find((d) => d.month === selectedMonth);
  const selectedNet = selectedMonthData
    ? selectedMonthData.income - selectedMonthData.expenses
    : 0;

  return (
    <EdgeCornerFrame className="p-5 h-full select-none outline-none focus:outline-none">
      {/* Header and Active Selection Badge */}
      <div className="flex items-start sm:items-center justify-between mb-4 gap-2 min-h-[40px]">
        <div className="min-w-0 flex-1">
          <TextReveal
            as="h3"
            delayMs={260}
            durationMs={720}
            yOffset={10}
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate"
          >
            6-Month Cash Flow Overview
          </TextReveal>
          <TextReveal
            as="p"
            delayMs={340}
            durationMs={720}
            yOffset={8}
            className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5"
          >
            Monthly income vs expenditure trajectory
          </TextReveal>
        </div>

        {/* Lightweight Tactile Selection Indicator with Pure Compositor Animation */}
        <AnimatePresence>
          {selectedMonth && selectedMonthData && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.85, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 8 }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              onClick={() => setSelectedMonth(null)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Click to clear selection"
            >
              <span className="font-medium text-zinc-500 dark:text-zinc-400">
                {selectedMonth}:
              </span>
              <span
                className={selectedNet >= 0 ? "text-emerald-600 dark:text-emerald-400 font-mono" : "text-rose-600 dark:text-rose-400 font-mono"}
              >
                {selectedNet >= 0 ? "+" : "-"}${Math.abs(selectedNet).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <X className="w-3 h-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ml-0.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chart Viewport Wrapper with Side Directional Indicators */}
      <div
        className="relative w-full chart-containment outline-none focus:outline-none select-none"
        onMouseDown={(e) => {
          // Zero-cost defense: Prevent browser-native focus outline transfer to internal SVG elements on mouse interaction
          e.preventDefault();
        }}
        onFocusCapture={(e) => {
          if (e.target instanceof SVGElement) {
            (e.target as unknown as HTMLElement).blur?.();
          }
        }}
      >
        {/* Left Side Scroll Indicator Arrow */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => handleScroll("left")}
              aria-label="Scroll left to view previous months"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full glass-pill border border-zinc-200 dark:border-zinc-800 shadow-md flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-90 transition-transform cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Right Side Scroll Indicator Arrow */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => handleScroll("right")}
              aria-label="Scroll right to view more months"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full glass-pill border border-zinc-200 dark:border-zinc-800 shadow-md flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-90 transition-transform cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center h-[240px] sm:h-[280px] text-xs text-zinc-400 animate-pulse"
            >
              Loading analytics trajectory...
            </motion.div>
          ) : data.length === 0 || data.every((d) => d.income === 0 && d.expenses === 0) ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center justify-center h-[240px] sm:h-[280px] px-4 text-center select-none overflow-hidden"
            >
              {/* Subtle Ghost Wireframe Bar Silhouette */}
              <div
                className="absolute inset-0 flex items-end justify-center gap-4 sm:gap-6 px-8 pb-6 opacity-[0.06] dark:opacity-[0.04] pointer-events-none"
                aria-hidden="true"
              >
                <div className="w-8 h-16 bg-zinc-950 dark:bg-white rounded-t" />
                <div className="w-8 h-28 bg-zinc-950 dark:bg-white rounded-t" />
                <div className="w-8 h-12 bg-zinc-950 dark:bg-white rounded-t" />
                <div className="w-8 h-36 bg-zinc-950 dark:bg-white rounded-t" />
                <div className="w-8 h-20 bg-zinc-950 dark:bg-white rounded-t" />
                <div className="w-8 h-24 bg-zinc-950 dark:bg-white rounded-t" />
              </div>

              {/* Foreground Content Card */}
              <div className="relative z-10 flex flex-col items-center max-w-sm">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-2 shadow-xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Awaiting Cash Flow Activity
                </h4>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                  Monthly cash flow trajectories and income vs expense ratios will generate automatically after your first logged entry.
                </p>
                {onOpenAddModal && (
                  <button
                    type="button"
                    onClick={onOpenAddModal}
                    className="btn-tactile mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record First Entry</span>
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <div
              ref={scrollRef}
              onScroll={checkScrollability}
              tabIndex={-1}
              className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden outline-none focus:outline-none focus-visible:outline-none select-none"
            >
              {/* Guaranteed minimum width to prevent detail squishing on narrow viewports */}
              <div className="w-full min-w-[500px] h-[240px] sm:h-[280px] outline-none focus:outline-none select-none">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  className="outline-none focus:outline-none select-none"
                  style={{ outline: "none" }}
                >
                  <BarChart
                    data={data}
                    tabIndex={-1}
                    style={{ outline: "none" }}
                    className="outline-none focus:outline-none select-none"
                    margin={{ top: 12, right: 16, left: 2, bottom: 4 }}
                    onClick={(state) => {
                      if (state && state.activeLabel) {
                        setSelectedMonth((prev) =>
                          prev === state.activeLabel ? null : (state.activeLabel as string)
                        );
                      }
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#888888"
                      opacity={0.15}
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val: string) => (val ? val.split(" ")[0] : "")}
                      tick={{ fontSize: 11, fill: "#888888" }}
                    />
                    <YAxis
                      width={52}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 11, fill: "#888888" }}
                    />
                    <Tooltip
                      allowEscapeViewBox={{ x: true, y: true }}
                      wrapperStyle={{ zIndex: 100, pointerEvents: "none" }}
                      cursor={{ fill: "rgba(120, 120, 120, 0.08)", radius: 6 }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        return (
                          <div className="p-3 rounded-xl glass-panel border border-zinc-200 dark:border-zinc-700 shadow-xl shadow-zinc-950/10 dark:shadow-black/60 text-xs space-y-1 select-none pointer-events-none">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                              {label}
                            </p>
                            {payload.map((item) => (
                              <div
                                key={item.name}
                                className="flex items-center justify-between gap-4"
                              >
                                <span
                                  className="flex items-center gap-1.5"
                                  style={{ color: item.color }}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  {item.name}:
                                </span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                                  $
                                  {Number(item.value).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: "10px", fontSize: "11px" }}
                    />
                    <Bar
                      name="Income"
                      dataKey="income"
                      fill="var(--chart-income)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                      isAnimationActive={false}
                      className="cursor-pointer"
                    >
                      {data.map((entry) => {
                        const isDimmed =
                          selectedMonth !== null && selectedMonth !== entry.month;
                        return (
                          <Cell
                            key={`income-${entry.month}`}
                            opacity={isDimmed ? 0.35 : 1}
                            className="transition-opacity duration-200"
                          />
                        );
                      })}
                    </Bar>
                    <Bar
                      name="Expenses"
                      dataKey="expenses"
                      fill="var(--chart-expenses)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                      isAnimationActive={false}
                      className="cursor-pointer"
                    >
                      {data.map((entry) => {
                        const isDimmed =
                          selectedMonth !== null && selectedMonth !== entry.month;
                        return (
                          <Cell
                            key={`expenses-${entry.month}`}
                            opacity={isDimmed ? 0.35 : 1}
                            className="transition-opacity duration-200"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </EdgeCornerFrame>
  );
}
