import { getAccessToken } from "@/lib/token"

export class FetchError extends Error {
  info?: unknown
  status?: number
}

/** Generic authenticated GET fetcher for useSWR(url, authedFetcher). */
export async function authedFetcher<T = unknown>(url: string): Promise<T> {
  const token = getAccessToken()
  const res = await fetch(url, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  })
  const data = await res.json()
  if (!res.ok) {
    const error = new FetchError(data.error || "Request failed")
    error.info = data
    error.status = res.status
    throw error
  }
  return data as T
}
