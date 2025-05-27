import { defineConfig } from "vite";

export default defineConfig({
	base: "/bosab/",
	server: {
		port: 3000,
		open: true,
	},
	build: {
		target: "es2020",
		outDir: "dist",
		assetsDir: "assets",
		sourcemap: true,
	},
	resolve: {
		alias: {
			"@": "/src",
		},
	},
});
