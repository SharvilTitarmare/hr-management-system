const PALETTE = [
  { stripe: "bg-[oklch(0.92_0.24_128)]", dot: "bg-[oklch(0.92_0.24_128)]" }, // lime
  { stripe: "bg-[oklch(0.64_0.24_6)]", dot: "bg-[oklch(0.64_0.24_6)]" }, // magenta
  { stripe: "bg-[oklch(0.75_0.14_190)]", dot: "bg-[oklch(0.75_0.14_190)]" }, // teal
  { stripe: "bg-[oklch(0.8_0.15_75)]", dot: "bg-[oklch(0.8_0.15_75)]" }, // amber
  { stripe: "bg-[oklch(0.65_0.2_285)]", dot: "bg-[oklch(0.65_0.2_285)]" }, // violet
]

/** Deterministically assigns one of the brand accent colors to a department name. */
export function departmentColor(department: string) {
  let hash = 0
  for (let i = 0; i < department.length; i++) {
    hash = (hash * 31 + department.charCodeAt(i)) % PALETTE.length
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
