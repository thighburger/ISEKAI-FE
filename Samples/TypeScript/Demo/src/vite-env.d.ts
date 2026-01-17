interface ImportMetaEnv {
  readonly VITE_WS_SERVER_URL: string;
  readonly VITE_API_URL: string;
  readonly VITE_FRONTEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


declare module '*.woff2' {
  const src: string;
  export default src;
}

declare module '*.ttf' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;

  export default src;

}