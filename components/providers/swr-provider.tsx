"use client"

import { SWRConfig } from "swr"
import { authedFetcher } from "@/lib/swr-fetcher"

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: authedFetcher,
        refreshInterval: 5000, // poll every 5s for near-live updates
        revalidateOnFocus: true, // also refresh the moment the tab regains focus
        dedupingInterval: 2000,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  )
}
