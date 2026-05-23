declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi
  }
}

export interface VsCodeApi {
  postMessage: (message: unknown) => void
  getState: () => unknown
  setState: (state: unknown) => void
}

export type WebviewInboundMessage =
  | { type: 'savingsUpdate'; payload: unknown }
  | { type: 'submitResult'; payload: { ok: boolean; message?: string } }
  | { type: 'hardwareUpdate'; payload: { compute_power: 'cpu' | 'gpu' } }
  | { type: 'syncEvent'; payload: { filename: string; durationMs: number; message: string; syncedAt: string } }

export type WebviewOutboundMessage =
  | { type: 'submitPreferences'; payload: unknown }
  | { type: 'getSavings' }
  | { type: 'getHardware' }
  | { type: 'ready' }

const vscodeApi: VsCodeApi | undefined =
  typeof window !== 'undefined' ? window.acquireVsCodeApi?.() : undefined

export const isVsCodeWebview = Boolean(vscodeApi)

export function postToExtension(message: WebviewOutboundMessage): void {
  vscodeApi?.postMessage(message)
}

export function onExtensionMessage(handler: (message: WebviewInboundMessage) => void): () => void {
  const listener = (event: MessageEvent<WebviewInboundMessage>) => {
    if (!event.data?.type) return
    handler(event.data)
  }

  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}

export function notifyExtensionReady(): void {
  postToExtension({ type: 'ready' })
}
