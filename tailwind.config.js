export default {
  content: ["./index.html", './src/**/*.{svelte,js,ts}'],
  theme: {
    fontFamily: {
      'sans': [
        '"SF Pro Display"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
        '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"',
        '"Segoe UI Symbol"', '"Noto Color Emoji"']
    },
    extend: {
      colors: {
        'minteshred': '#831528'
      }
    },
  },
  plugins: [],
};
