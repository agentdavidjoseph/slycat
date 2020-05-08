const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// Commenting out ExportNodeModules plugin because it crashes with Babel7
// const ExportNodeModules = require('webpack-node-modules-list');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  plugins: [
    // Don't need to add UglifyJSPlugin here because production mode automatically does that
    // new UglifyJSPlugin({
    //   sourceMap: true
    // }),
    // Deletes the web-server/dist folder so that old files don't remain there, only fresh ones from the last run.
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
  ],
  devServer: {
    // Only compiles on refresh, not on file change. But does not work, complains of running webpack twice.
    // lazy: true,

    // Disable live reloading. Useful when trying to run two branches side by side.
    // inline: false,

    // Where non-webpack generated files are located on the filesystem.
    // contentBase: [path.join(__dirname, 'web-server/plugins/slycat-project-wizards'), path.join(__dirname, 'web-server/plugins/slycat-model-wizards')],
    
    // Public URL of served files. Commended out because we want them available at the root URL.
    publicPath: '/',
    // compress: true,
    host: '0.0.0.0',
    port: 9000,
    https: true,
    index: 'slycat_projects.html',
    proxy: {
      '/api': {
        target: 'https://haproxy:443',
        pathRewrite: {'^/api' : ''},
        secure: false,
      },
    },
    historyApiFallback: {
      rewrites: [
        // { from: /^\/$/, to: '/views/landing.html' },
        // { from: /^\/subpage/, to: '/views/subpage.html' },
        // If the URL begins with projects/ (note the trailing slash), serve up the single project page
        { from: /^\/projects\//, to: '/slycat_project.html' },
        // If the URL begins with projects (note no trailing slash), serve up the listing of all projects.
        // This is for backwards compatibility, since we used to redirect unknown URLs to /projects to give the user
        // a projects listing.
        { from: /^\/projects/, to: '/slycat_projects.html' },
        { from: /^\/models/, to: '/slycat_model.html' },
        { from: /^\/login/, to: '/slycat_login.html' },
        { from: /^\/pages/, to: '/slycat_page.html' },
        // { from: /./, to: '/views/404.html' },
      ]
    }
  }
});