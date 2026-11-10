export type Brand = "gmail" | "whatsapp" | "instagram" | "tiktok" | "x";

const NOTE = "M14 4v10.5a3.5 3.5 0 11-3.5-3.5M14 4a4.5 4.5 0 004.5 4.5";

/** The five contact brands in their own colours, each 24×24. */
export function BrandLogo({ brand, size = 24 }: { brand: Brand; size?: number }) {
  const common = { width: size, height: size, "aria-hidden": true as const, focusable: "false" as const };
  switch (brand) {
    case "gmail":
      return (
        <svg {...common} viewBox="52 42 88 66">
          <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
          <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
          <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
          <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
          <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path fill="#25d366" d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2z" />
          <path fill="none" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" d="M8.6 8.4c.4 3.2 2.8 5.6 6.3 6.4l1.2-1.8-2.2-1.1-1 1a4.6 4.6 0 01-2.3-2.3l1-1-1.1-2.2-1.9.4z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <defs>
            <radialGradient id="ig" cx="30%" cy="107%" r="150%">
              <stop offset="0" stopColor="#fdf497" />
              <stop offset="0.1" stopColor="#fdf497" />
              <stop offset="0.5" stopColor="#fd5949" />
              <stop offset="0.6" stopColor="#d6249f" />
              <stop offset="0.9" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig)" />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth={1.8} />
          <circle cx="17.3" cy="6.7" r="1.1" fill="#fff" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" strokeWidth={2.4} strokeLinecap="round">
          <path stroke="#25f4ee" d={NOTE} transform="translate(-0.8 -0.8)" />
          <path stroke="#fe2c55" d={NOTE} transform="translate(0.8 0.8)" />
          <path stroke="#000" d={NOTE} />
        </svg>
      );
    case "x":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path fill="#000" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
        </svg>
      );
  }
}
