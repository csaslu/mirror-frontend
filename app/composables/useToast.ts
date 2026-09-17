/**
 * Minimal toast notifications.
 *
 * A single module-level store keeps every component on the same list, and the
 * Toaster component reads it. Used for "URL copied" feedback, which otherwise
 * has nowhere to appear.
 */
export interface Toast {
  id: number
  tone: 'success' | 'error' | 'info'
  message: string
  detail?: string
}

const toasts = ref<Toast[]>([])
let nextId = 0

/** How long a toast stays on screen. */
const TOAST_TTL = 2600

function push(tone: Toast['tone'], message: string, detail?: string) {
  const id = ++nextId
  toasts.value = [...toasts.value, { id, tone, message, detail }]

  setTimeout(() => dismiss(id), TOAST_TTL)

  return id
}

function dismiss(id: number) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (message: string, detail?: string) => push('success', message, detail),
    error: (message: string, detail?: string) => push('error', message, detail),
    info: (message: string, detail?: string) => push('info', message, detail),
  }
}
