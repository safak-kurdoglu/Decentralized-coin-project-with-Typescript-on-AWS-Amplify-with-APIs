const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require('webpack');

module.exports = {
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.(js)x?$/,
        exclude: /node_modules/,
        use: {
        loader: 'babel-loader',
        options: {
          "presets":['@babel/preset-env']}
      }
      },
      {
        test: /\.(ts)x?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    fallback: { "stream": require.resolve("stream-browserify"),
                "path": require.resolve("path-browserify"),
                "crypto": require.resolve("crypto-browserify"),
                "os": require.resolve("os-browserify/browser"),
                "tty": require.resolve("tty-browserify"),
                "https": require.resolve("https-browserify"),
                "http": require.resolve("stream-http"),
                "zlib": require.resolve("browserify-zlib"),
                "constants": require.resolve("constants-browserify"),
                "util": require.resolve("util/"),
                "buffer": false,
                "fs": false,
                "dgram": false,
                "dns": require.resolve("dns"),
                "process": false,
                "assert": false},
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [

    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new HtmlWebpackPlugin({
      title: 'our project', 
      template: 'public/index.html' }), 
    new MiniCssExtractPlugin({
      filename:"bundle.css"})
   ],
  devServer: {
    static: path.join(__dirname, "dist"),
    compress: true,
    port: 4000,
  },
};
