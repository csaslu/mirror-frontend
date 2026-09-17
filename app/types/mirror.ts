/**
 * Wire types. These mirror the Go structs in
 * mirror-backend/internal/model/v1/response/mirror.go — keep both sides in step.
 */

/** `mirror_type` enum from the database schema. */
export type MirrorType = 'reverse_proxy' | 'rsync' | 'http' | 'https' | 'ftp' | 's3'

/**
 * Sync status as reported by the upstream. The known values come from
 * tunasync; an unknown string is still valid and rendered neutrally.
 */
export type MirrorStatusValue =
  | 'success'
  | 'syncing'
  | 'failed'
  | 'paused'
  | 'pre-syncing'
  | 'disabled'
  | (string & {})

/** One row of GET {apiBase}/mirrors.json. */
export interface Mirror {
  id: number
  /** Directory name on this mirror, e.g. "ubuntu". */
  key: string
  /** Optional human description; the backend stores it in Chinese. */
  comment: string
  type: MirrorType
  /** Upstream base URL or rsync URL. */
  source: string
  /** null when the status is not known yet (cold cache or unsupported upstream). */
  status: MirrorStatusValue | null
  /** Bytes; null when unknown. */
  size: number | null
  /** Unix timestamp in seconds; null when unknown. */
  last_update: number | null
}

/** The API envelope every endpoint returns. */
export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}
