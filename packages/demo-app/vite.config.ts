import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig(() => {
  const plugins = [react({
    babel: {
      plugins: [['babel-plugin-react-compiler']],
    },
  }), tailwindcss()];

  return {
    plugins
  };
});
