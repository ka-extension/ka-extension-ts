const path = require("path");

module.exports = {
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
        }
    ]
  },
  resolve: {
      extensions: [ ".ts", ".js", ".json" ]
  },
  devtool: "source-map"
};