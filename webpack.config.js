const path = require("path");
const webpack = require("webpack");
require("dotenv").config();

const PROD_ID = "gniggljddhajnfbkjndcgnomkddfcial";

module.exports = (env = {}) => {
  const ID = env.PROD ? PROD_ID : process.env.EXTENSION_ID;

  console.info(`Building extension with ID "${ID}" in ${env.PROD ? "production" : "development"} mode.`);

  return {
    mode: "production",
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
        extensions: [ ".ts", ".js", ".json", ".css" ]
    },
    plugins: [
      new webpack.DefinePlugin({
        EXTENSION_ID: JSON.stringify(ID),
      })
    ],
    devtool: "source-map"
  };
};