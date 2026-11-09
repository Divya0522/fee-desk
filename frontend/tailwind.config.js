/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper:          '#FAF8F4',
        white:          '#FFFFFF',
        ink:            '#14211F',
        body:           '#4A5654',
        muted:          '#7A8582',
        line:           '#E7E3DA',
        brand:          '#0E4D44',
        'brand-hover':  '#0A3B34',
        'brand-tint':   '#E6F0EE',
        accent:         '#D98A1E',
        dark:           '#0F2421',
        'dark-text':    '#F3F1EA',
        // Status palette
        'status-paid':        '#1F7A4D',
        'status-paid-bg':     '#E8F4EC',
        'status-due':         '#9A5B0B',
        'status-due-bg':      '#FFF4E0',
        'status-overdue':     '#B3261E',
        'status-overdue-bg':  '#FDECEA',
      },
      maxWidth: {
        container: '1200px',
      },
      fontFamily: {
        serif:    ['Fraunces', 'Georgia', 'serif'],
        sans:     ['Inter', 'system-ui', 'sans-serif'],
        'hi-serif': ['Noto Serif Devanagari', 'serif'],
        'hi-sans':  ['Noto Sans Devanagari', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 33, 31, 0.05)',
      },
    },
  },
  plugins: [],
}
