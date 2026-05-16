export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {}
  },
  plugins: [
    ({ addVariant }) => {
      addVariant('light', '.light &');
    }
  ]
};
