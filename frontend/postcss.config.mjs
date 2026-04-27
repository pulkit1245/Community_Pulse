/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {}, // "@tailwindcss/postcss" ko hata kar sirf "tailwindcss" karein
    autoprefixer: {},
  },
};

export default config;