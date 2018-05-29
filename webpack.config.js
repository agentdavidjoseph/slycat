const path = require('path');
const webpack = require('webpack');
const Visualizer = require('webpack-visualizer-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  // mode is now specified as a command line flag in package.json
	// mode: 'production',
	// mode: 'development',
  entry: {
    ui_parameter_image: './web-server/plugins/slycat-parameter-image/js/ui.js',
    slycat_projects:    './web-server/js/slycat-projects-main.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'web-server/dist')
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
  		jQuery: 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery'
    }),
    new Visualizer({
      filename: 'webpack-visualizer-stats.html'
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'webpack-bundle-analyzer-report.html',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'webpack-bundle-analyzer-stats.json',
    }),
  ],
  module: {
		rules: [
      // This enables Babel
			{ test: /\.js$/, 
				exclude: /node_modules/, 
				use: "babel-loader",
			},
      // This enables the html-loader, needed to load knockout .html templates
      { test: /\.html$/, 
        use: 'html-loader' 
      },
      // This enables the style and css loaders, which are needed to load CSS files
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      // This enabled the URL loader for loading images
      {
        test: /\.(png|jpg|gif|jp(e*)g)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              // If the file is greater than the limit (in bytes) the file-loader is used by default and all query parameters are passed to it.
              limit: 8192,
              name: '[name].[ext]',
              publicPath: '/dist',
            }
          }
        ]
      },
      // This enabled the URL loader for loading fonts, with an automatic fallback to the file-loader for fonts larger than the set limit.
      { 
        test: /\.(ttf|eot|svg|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 8192,
              name: '[name].[ext]',
              publicPath: '/dist',
            }
          }
        ]
      },
      // This enables compiling Less to CSS
      {
        test: /\.less$/,
        use: [ 
          'style-loader', // creates style nodes from JS strings
          'css-loader', // translates CSS into CommonJS
          'less-loader' // compiles Less to CSS
        ]
      },
		],
	},
};