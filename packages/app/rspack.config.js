const path = require('path');
const {rspack} = require('@rspack/core');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    compress: true,
    port: 9000,
    open: true
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource', // 使用资源模块类型
        generator: {
          filename: 'images/[hash][ext][query]', // 输出文件的名称和路径
        },
      },
    ]
  },
  plugins: [
    new rspack.HtmlRspackPlugin()
  ],
  mode: 'development' // 或 'production' 视情况而定
};

