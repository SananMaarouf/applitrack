import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Some Node/jsdom combinations expose localStorage but throw on access (or do
// not provide it at all). Tests use it for the onboarding flag, so supply a
// tiny in-memory implementation when needed.
if (!window.localStorage) {
  const values = new Map<string, string>()
  const storage = {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => {
      values.set(key, String(value))
    },
  }

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  })
}

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}
