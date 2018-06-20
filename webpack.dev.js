const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    // Where files are located on the filesystem.
    contentBase: path.join(__dirname, 'web-server/dist'),
    // Public URL of served files. Commended out because we want them available at the root URL.
    // publicPath: '',
    // compress: true,
    port: 9000,
    https: true,
    index: 'slycat_projects.html',
    proxy: {
      '/api': {
        target: 'https://localhost:443',
        pathRewrite: {'^/api' : ''},
        secure: false,
      },
    },
    historyApiFallback: {
      rewrites: [
        // { from: /^\/$/, to: '/views/landing.html' },
        // { from: /^\/subpage/, to: '/views/subpage.html' },
        { from: /^\/projects/, to: '/slycat_project.html' },
        // { from: /./, to: '/views/404.html' },
      ]
    }
  }
});