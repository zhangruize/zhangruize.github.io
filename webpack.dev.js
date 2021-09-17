const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebpackShellPluginNext = require('webpack-shell-plugin-next')

function getPlugins (env) {
  let plugins = []
  let type = env.type

  if (type == 'normal') {
    plugins.push(
      new HtmlWebpackPlugin({
        title: 'Zrek`s blog',
        template: './' + env.type + '/index.html'
      })
    )
  } else if (type == 'static') {
    plugins.push(
      new WebpackShellPluginNext({
        onDoneWatch: {
          scripts: [`node ./dist/${env.type}/bundle.js --outputDir=dist/static/output`],
          blocking: false,
          parallel: true
        }
      })
    )
  }
  return plugins
}

module.exports = env => ({
  entry: {
    index: './' + env.type
  },
  target: env.type == 'static' ? 'node' : 'web',
  context: path.resolve(__dirname, 'src'),
  mode: env.mode,
  devtool: 'inline-source-map',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/' + env.type),
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  plugins: getPlugins(env),
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
})
