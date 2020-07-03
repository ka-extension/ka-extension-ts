const path = require("path");

module.exports = {
	entry: {
		index: ["babel-polyfill", "whatwg-fetch", "./src/index.ts"],
		background: ["babel-polyfill", "whatwg-fetch", "./src/background.ts"],
		popup: ["babel-polyfill", "whatwg-fetch", "./src/popup.ts"],
		content: ["babel-polyfill", "whatwg-fetch", "./src/content.ts"]
	},
	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "dist")
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: [
					path.resolve(__dirname, "node_modules")
				],
				include: path.resolve(__dirname, "src"),
				use: ["cache-loader", "ts-loader"]
			},
			{
				test: /\.css$/,
				use: ["cache-loader", "raw-loader"],
				exclude: [
					path.resolve(__dirname, "node_modules")
				],
				include: path.resolve(__dirname, "styles"),
			}
		]
	},
	resolve: {
		extensions: [".ts", ".js", ".json", ".css"]
	},
	devtool: "source-map"
};
