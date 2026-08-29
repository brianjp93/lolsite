declare global {
  interface Window {
    STATIC_PREFIX?: string;
  }
}

export function staticUrl(path: string) {
  const prefix = typeof window !== "undefined" ? window.STATIC_PREFIX : undefined;
  return `${prefix ?? "/"}${path.replace(/^\/+/, "")}`;
}
