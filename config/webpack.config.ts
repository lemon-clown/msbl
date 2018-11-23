import webpack from 'webpack'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import { paths } from './paths'


export default {
  entry: {
    main: paths.appMain,
  },
  output: {
    path: paths.appTarget,
    filename: '[name].js'
  },
  resolve: {
    modules: [ paths.appNodeModules ],
    extensions: [ '.js', '.ts', '.json' ],
    alias: {
      '@': paths.appSrc,
    },
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        include: paths.appSrc,
      },
    ],
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: '#! /usr/bin/env node',
      raw: true
    }),
    new CopyWebpackPlugin([
      {
        from: paths.appSrcConfig,
        to: paths.appTargetConfig,
        toType: 'file',
      },
    ]),
  ],
  node: {
    __filename: false,
    __dirname: false,
  },
  mode: 'production',
  target: 'node',
  externals: paths.appExternals,
}
