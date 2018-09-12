const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    index: ["whatwg-fetch", "./src/index.ts"],
    background: "./src/background.ts",
    popup: "./src/popup.ts",
    content: "./src/content.ts",
    vendor: ["whatwg-fetch"]
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
      extensions: [ ".ts", ".js", ".json", ".css" ]
  },
  devtool: "source-map"
};