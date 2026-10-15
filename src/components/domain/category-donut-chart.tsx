"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";

interface CategoryDistributionItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CategoryDonutChartProps {
  data: CategoryDistributionItem[];
  totalExpenses: number;
}

export function CategoryDonutChart({ data, totalExpenses }: CategoryDonutChartProps) {
  return (
    <EdgeCornerFrame className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Category Breakdown
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Monthly expenditure allocation by category
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-xs text-zinc-400">
          No expenditure data recorded for this month.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Donut graphic */}
          <div className="chart-containment relative w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={3}
                  dataKey="amount"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as CategoryDistributionItem;
                    return (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.category}
                        </div>
                        <p className="text-zinc-500">
                          ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} (
                          {item.percentage}%)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Total Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                Total
              </span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {data.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-zinc-400 w-10 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </EdgeCornerFrame>
  );
}
