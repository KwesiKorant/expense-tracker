import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Open SVG Brand Logo for Expense
 * Rendered open on the UI with no bounding boxes or background containers.
 * Uses currentColor to dynamically adapt between light and dark themes.
 */
export function Logo({ size = 32, className = "", ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-label="Expense"
      role="img"
      {...props}
    >
      <g
        stroke="currentColor"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Open Coin / Analytics Ring */}
        <path d="M 396 340 A 164 164 0 1 1 340 116" />

        {/* Ascending Expense / Analytics Trend */}
        <path d="M 168 304 L 236 236 L 288 288 L 408 168" />

        {/* Trend Arrowhead */}
        <path d="M 328 168 H 408 V 248" />

        {/* Grounded Ledger Bar */}
        <path d="M 184 360 H 328" />
      </g>
    </svg>
  );
}
