"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";

interface CashFlowMonth {
  month: string;
  income: number;
  expenses: number;
}

interface CashFlowChartProps {
  data: CashFlowMonth[];
  isLoading?: boolean;
}

export function CashFlowChart({ data, isLoading = false }: CashFlowChartProps) {
  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  return (
    <EdgeCornerFrame className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            6-Month Cash Flow Overview
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Monthly income vs expenditure trajectory
          </p>
        </div>
      </div>

      {/* GPU Boundary Containment wrapper per Arc-AA protocol */}
      <div className="chart-containment w-full h-[230px] sm:h-[280px]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center h-full text-xs text-zinc-400 animate-pulse"
            >
              Loading analytics trajectory...
            </motion.div>
          ) : data.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center h-full text-xs text-zinc-400"
            >
              No historical records found for this period.
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
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
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 11, fill: "#888888" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(120, 120, 120, 0.08)", radius: 6 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      return (
                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{label}</p>
                          {payload.map((item) => (
                            <div key={item.name} className="flex items-center justify-between gap-4">
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
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                ${Number(item.value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                  />
                  <Bar
                    name="Expenses"
                    dataKey="expenses"
                    fill="var(--chart-expenses)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </EdgeCornerFrame>
  );
}
