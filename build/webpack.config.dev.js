const merge = require('webpack-merge')
const webpackConfig = require('./webpack.config')
const pkg = require('../package.json')

module.exports = merge(webpackConfig, {
  devtool: 'inline-source-map',

  output: {
    pathinfo: true,
    publicPath: '/',
    filename: '[name].js'
  },

  devServer: {
    host: 'localhost'
  }
})
