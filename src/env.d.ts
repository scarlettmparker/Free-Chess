interface ImportMeta {
  env: {
    VITE_WS_URL?: string;
    DEV: boolean;
    [key: string]: unknown;
  };
}

export declare global {
  interface Window {
    hydratePageDataFromPostlude?: (initialData: Record<string, Record<string, unknown>>) => void;
    __serverCacheData__?: Record<string, Record<string, unknown>>;
    __locale__?: string;
    __translations__?: Record<string, Record<string, unknown>>;
    __theme__?: Record<string, string>;
    __themes__?: { name: string; values: Record<string, string> }[];
  }
}
