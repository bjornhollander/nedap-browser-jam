const path = require('path');

module.exports = {
  mode: "development",
  entry: "./src/script.js",
  output: {
    path: path.resolve(__dirname, "docs"),
    filename: "script.js"
  },
  devServer: {
    port: 9000,
    static: {
      directory: path.join(__dirname, 'docs')
    }
  }
}
