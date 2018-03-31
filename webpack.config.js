const path = require("path");

module.exports = {
  entry: { 
    index: "./src/index.ts",
    background: "./src/background.ts",
    popup: "./src/popup.ts",
    content: "./src/content.ts"
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
            loader: "ts-loader"
        }
    ]
  },
  resolve: {
      extensions: [ ".ts" ]
  },
  devtool: "source-map"
};