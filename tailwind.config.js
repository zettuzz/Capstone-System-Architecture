/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Terminal Mono Color System from the design
        'primary': '#ffffff',
        'background-light': '#f5f8f8',
        'background-dark': '#141313',
        'surface': '#1c1b1b',
        'surface-highlight': '#353434',
        'text-main': '#e5e2e1',
        'text-muted': '#8e9192',
        'charcoal': '#201f1f',
        'outline-dim': '#444748',
        // For backward compatibility with existing code
        'surface-dim': '#1c1b1b',
        'surface-bright': '#353434',
        'surface-container-lowest': '#141313',
        'surface-container-low': '#1c1b1b',
        'surface-container': '#353434',
        'surface-container-high': '#353434',
        'surface-container-highest': '#353434',
        'on-surface': '#e5e2e1',
        'on-surface-variant': '#8e9192',
        'inverse-surface': '#e5e2e1',
        'inverse-on-surface': '#141313',
        outline: '#444748',
        'outline-variant': '#8e9192',
        'surface-tint': '#ffffff',
      },
      fontFamily: {
        // Typography System
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Geist', 'sans-serif'],
      },
      fontSize: {
        // We'll keep the existing font sizes for now, but note the design uses:
        //   text-[48px] for h1, text-[14px] for input, text-[13px] for pills, text-[11px] for enter hint
        // We can add these as needed, but for now we'll rely on the existing system and override in JSX.
      },
      borderRadius: {
        // Shape language: all radii set to 0px as per design
        'none': '0px',
        'sm': '0px',
        'md': '0px',
        'lg': '0px',
        'xl': '0px',
        'full': '0px',
      },
      boxShadow: {
        // Elevation & Depth - only white glow for interaction states (as per design system)
        // However, the design uses a white border for focus and hover, not a glow.
        // We'll keep the interaction glow for now, but note the design doesn't use it.
        'interaction': '0 0 8px 0px rgba(255, 255, 255, 0.3)',
      },
      borderWidth: {
        '1': '1px',
      },
    },
  },
  plugins: [],
}