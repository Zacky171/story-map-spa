const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  plugins: [
    // Override: exclude sw.js dari public supaya tidak konflik dengan dev server
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          globOptions: { ignore: ['**/index.html', '**/sw.js'] }
        }
      ]
    })
  ],
  devServer: {
    static: './dist',
    port: 3000,
    open: true,
    hot: true,
    proxy: [
      {
        context: ['/v1', '/uploads'],
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    ]
  }
});
