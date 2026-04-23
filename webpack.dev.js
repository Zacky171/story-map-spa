const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
devServer: {
    static: './dist',
port: 3000,
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

