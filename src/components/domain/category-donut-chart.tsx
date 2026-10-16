"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";
import { X } from "lucide-react";

interface CategoryDistributionItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CategoryDonutChartProps {
  data: CategoryDistributionItem[];
  totalExpenses: number;
  isLoading?: boolean;
}

/**
 * CategoryDonutChart Primitive — Arc-AA & Emil Kowalski Standard
 * - Zero blue text selection: Pure select-none with tactile slice selection.
 * - Anti-occlusion tooltips: allowEscapeViewBox with high z-index and overflow-visible container.
 * - Interactive category drilldown: Center HUD updates to selected category metrics with spring physics.
 */
export function CategoryDonutChart({
  data,
  totalExpenses,
  isLoading = false,
}: CategoryDonutChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const selectedItem = data.find((d) => d.category === selectedCategory);

  return (
    <EdgeCornerFrame className="p-5 h-full select-none">
      {/* Header and Selection Clear Indicator */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Category Breakdown
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Monthly expenditure allocation by category
          </p>
        </div>

        {/* Tactile Active Category Tag */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.9, y: 2 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 2 }}
              onClick={() => setSelectedCategory(null)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Click to reset to total"
            >
              <span className="truncate max-w-[90px]">{selectedCategory}</span>
              <X className="w-3 h-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[280px] text-xs text-zinc-400 animate-pulse">
          Loading category allocation...
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-xs text-zinc-400">
          No expenditure data recorded for this month.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Centered Donut Graphic with Unconstrained Tooltip Viewbox */}
          <div className="relative w-full h-[180px] flex items-center justify-center overflow-visible z-20">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={74}
                  paddingAngle={3}
                  dataKey="amount"
                  strokeWidth={0}
                  isAnimationActive={false}
                  onClick={(entry) => {
                    const item = (entry as { payload?: CategoryDistributionItem })?.payload;
                    if (item && item.category) {
                      setSelectedCategory((prev) =>
                        prev === item.category ? null : item.category
                      );
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  {data.map((entry, index) => {
                    const isSelected = selectedCategory === entry.category;
                    const isAnySelected = selectedCategory !== null;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={`var(--mono-${(index % 5) + 1}, #18181b)`}
                        opacity={isAnySelected && !isSelected ? 0.35 : 1}
                        className="transition-opacity duration-200 cursor-pointer outline-none"
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 100, pointerEvents: "none" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as CategoryDistributionItem;
                    const colorIndex =
                      (data.findIndex((d) => d.category === item.category) % 5) + 1;
                    return (
                      <div className="p-3 rounded-xl bg-white/95 dark:bg-[#121215]/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 shadow-2xl shadow-zinc-950/20 dark:shadow-black/70 text-xs space-y-1 select-none pointer-events-none">
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor: `var(--mono-${colorIndex})`,
                            }}
                          />
                          {item.category}
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                          ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} (
                          {item.percentage}%)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Total / Active HUD with Directional Morphing */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center z-10">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider truncate max-w-[90px]">
                {selectedCategory ? selectedCategory : "Total"}
              </span>
              <div className="h-5 overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={selectedCategory ? selectedItem?.amount : totalExpenses}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono"
                  >
                    $
                    {(selectedCategory
                      ? selectedItem?.amount || 0
                      : totalExpenses
                    ).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </motion.span>
                </AnimatePresence>
              </div>
              {selectedItem && (
                <span className="text-[10px] font-mono text-zinc-400">
                  {selectedItem.percentage}% of total
                </span>
              )}
            </div>
          </div>

          {/* Full-Width Legend List with Interactive Tactile Selection */}
          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 [scrollbar-width:thin] z-10">
            {data.map((item, index) => {
              const shade = `var(--mono-${(index % 5) + 1})`;
              const isSelected = selectedCategory === item.category;
              return (
                <div
                  key={item.category}
                  onClick={() =>
                    setSelectedCategory((prev) =>
                      prev === item.category ? null : item.category
                    )
                  }
                  className={`group p-2 rounded-xl transition-all duration-150 cursor-pointer select-none active:scale-[0.99] ${
                    isSelected
                      ? "bg-zinc-200/80 dark:bg-zinc-800 ring-1 ring-zinc-400 dark:ring-zinc-600 shadow-sm"
                      : "bg-zinc-50/70 dark:bg-zinc-900/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: shade }}
                      />
                      <span
                        className={`truncate ${
                          isSelected
                            ? "font-semibold text-zinc-900 dark:text-zinc-50"
                            : "font-medium text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                        ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono w-11 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Compositor-only scaleX Progress Track */}
                  <div className="w-full h-1 bg-zinc-200/60 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="w-full h-full rounded-full origin-left transition-transform duration-500 ease-out"
                      style={{
                        transform: `scaleX(${Math.max(0, Math.min(100, item.percentage)) / 100})`,
                        backgroundColor: shade,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </EdgeCornerFrame>
  );
}
