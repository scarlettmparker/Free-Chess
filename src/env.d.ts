interface ImportMeta {
  env: {
    VITE_PUBLIC_API_URL?: string;
    VITE_WS_URL?: string;
    DEV: boolean;
    [key: string]: unknown;
  };
}
