/**
 * Directory listing types. These mirror the Go structs in
 * mirror-backend/internal/model/v1/response/directory.go.
 */

/** One row of a mirror directory. */
export interface DirectoryEntry {
  name: string
  /** Absolute path on this site: "/ubuntu/dists/" or "/ubuntu/ls-lR.gz". */
  url: string
  kind: 'directory' | 'file'
  /** Bytes; null for directories and when the server omits sizes. */
  size: number | null
  /** The upstream's own size text, shown when `size` is null. */
  size_text?: string
  /** Unix seconds; null when the server omits dates. */
  mod_time: number | null
  mod_text?: string
  entry_count?: number | null
  title?: string
}

/** Body of GET /api/v1/list/{key}/{path}/mirrors.json */
export interface DirectoryListing {
  key: string
  /** Directory path inside the mirror: "/" or "/dists/noble". */
  path: string
  /** Full path for display: "/ubuntu/dists/noble". */
  display_path: string
  /** Upstream URL this listing came from. */
  source: string
  /** Listing implementation that produced the result, e.g. "nginx-fancyindex". */
  parser: string
  fetched_at: number
  /** Parent directory, null at the mirror root. */
  parent_path: string | null
  entries: DirectoryEntry[]
}
