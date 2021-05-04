/* eslint-disable @typescript-eslint/no-var-requires */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = (env) => ({
  entry: './src/index.ts',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/i,
        include: /src/,
        exclude: /node_modules/,
        use: [
          'ts-loader',
          {
            loader: 'ifdef-loader',
            options: {
              env,
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        include: /src/,
        exclude: /node_modules/,
        sideEffects: true,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false,
            },
          },
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        include: /src/,
        exclude: /node_modules/,
        sideEffects: true,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false,
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.glsl$/i,
        include: /src/,
        exclude: /node_modules/,
        type: 'asset/source',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      title: 'BlockMaps 3D Minecraft Maps',
      template: 'src/index.html',
    }),
  ],
  devServer: {
    contentBase: path.resolve(__dirname, 'serve'),
  },
});
