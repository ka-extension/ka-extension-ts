const path = require("path");

module.exports = {
  entry: { 
    main: "./src/index.ts"
  },
  output: {
    filename: "index.js",
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