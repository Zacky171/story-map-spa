const { merge } = require('webpack-merge');
const path = require('path');
const { InjectManifest } = require('workbox-webpack-plugin');
const common = require('./webpack.common.js');

module.exports = (env, argv) => merge(common, {
  mode: 'production',
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  plugins: [
    new InjectManifest({
      swSrc: path.resolve(__dirname, 'src/sw.js'),
      swDest: 'sw.js',
    }),
  ],
});
