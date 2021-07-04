const htmlWebpackPlugin = require("html-webpack-plugin");
module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
  },
  resolve: {
    extensions: [".js", ".jsx", ".json"],
  },
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-react", "@babel/preset-flow"],
              plugins: ["@babel/plugin-proposal-export-default-from"],
            },
          },
        ],
      },
    ],
  },
  plugins: [new htmlWebpackPlugin({ template: "./src/index.html" })],
};
