const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'taddy.min.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // Новое правило для SCSS/SASS
      {
        test: /\.(scss|sass)$/,
        use: [
          'style-loader',  // Встраивает стили в DOM
          'css-loader',   // Преобразует CSS в CommonJS
          'sass-loader'   // Компилирует SASS/SCSS в CSS
        ],
      },
    ],
  },
  mode: 'production',
};
