const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

class VersionPlugin {
  apply(compiler) {
    compiler.hooks.beforeRun.tap('VersionPlugin', () => {
      const version = require('./package.json').version;
      const versionContent = `export const TADDY_VERSION = '${version}';`;
      fs.writeFileSync(path.resolve(__dirname, 'src/version.ts'), versionContent);
    });
  }
}

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'taddy.min.js',
    path: path.resolve(__dirname, 'dist/js'),
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.build.json',
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.(scss|sass)$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  plugins: [new VersionPlugin()],
  mode: 'production',
};
