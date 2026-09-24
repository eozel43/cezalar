/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				// Kurumsal palet: lacivert ana renk + nötr (slate) griler
				primary: {
					50: '#EEF3F8',
					100: '#D6E1EE',
					200: '#ADC3DC',
					300: '#7F9FC4',
					400: '#4F78A6',
					500: '#2B5585',
					600: '#1F446E',
					700: '#183759',
					800: '#122B46',
					900: '#0C1D30',
				},
				neutral: {
					50: '#F8FAFC',
					100: '#F1F5F9',
					200: '#E2E8F0',
					300: '#CBD5E1',
					400: '#94A3B8',
					500: '#64748B',
					600: '#475569',
					700: '#334155',
					800: '#1E293B',
					900: '#0F172A',
				},
				semantic: {
					success: '#2F7D4F',
					warning: '#A16207',
					error: '#B42318',
					info: '#2B5585',
				},
				background: {
					page: '#F4F6F9',
					surface: '#FFFFFF',
					elevated: '#FFFFFF',
				},
				// Legacy support
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				foreground: 'hsl(var(--foreground))',
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
			},
			fontSize: {
				'caption': ['12px', { lineHeight: '1.4' }],
				'body-sm': ['13px', { lineHeight: '1.5' }],
				'body': ['14px', { lineHeight: '1.55' }],
				'body-lg': ['16px', { lineHeight: '1.6' }],
				'heading-sm': ['15px', { lineHeight: '1.4', fontWeight: '600' }],
				'heading-md': ['17px', { lineHeight: '1.4', fontWeight: '600' }],
				'heading-lg': ['22px', { lineHeight: '1.3', fontWeight: '600' }],
				'heading-xl': ['26px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
			},
			borderRadius: {
				'sm': '4px',
				'md': '6px',
				'lg': '8px',
				'xl': '12px',
			},
			boxShadow: {
				'sm': '0 1px 2px rgba(15, 23, 42, 0.06)',
				'md': '0 4px 12px rgba(15, 23, 42, 0.08)',
				'lg': '0 12px 32px rgba(15, 23, 42, 0.12)',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}