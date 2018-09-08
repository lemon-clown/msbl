import { paths } from './paths'
import webpack from 'webpack'


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
  ],
  mode: 'production',
  target: 'node',
  externals: paths.appExternals,
}
