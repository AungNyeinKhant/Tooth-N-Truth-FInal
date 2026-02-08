import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          cyan: '#00BCD4',
          orange: '#FF6B35',
        },
        background: {
          light: '#E8F8F9',
          white: '#FFFFFF',
          gray: '#F5F5F5',
        },
        text: {
          navy: '#1A2332',
          gray: '#666666',
          light: '#999999',
        },
        status: {
          success: '#4CAF50',
          warning: '#FFC107',
          error: '#F44336',
          info: '#2196F3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};

export default config;
