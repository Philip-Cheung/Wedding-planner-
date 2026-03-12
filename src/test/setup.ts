import '@testing-library/jest-dom'

if (typeof ResizeObserver === 'undefined') {
  ;(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
