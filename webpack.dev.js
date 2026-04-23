const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    static: path.resolve(__dirname, 'docs'),
    port: 8080,
    open: true,
    hot: true,
    proxy: {
      '/api': {
        target: 'https://story-api.dicoding.dev/v1',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
});
