const common = require("./webpack.common");
const merge = require("webpack-merge");
const path = require("path");

module.exports = merge(common, {
     devServer: {
          contentBase: path.join(__dirname, "dist"),
          disableHostCheck: true,
          historyApiFallback: {
               rewrites: [
                    {
                         from: /./,
                         to: "404.html"
                    }
               ]
          },
          host: "0.0.0.0",
          hot: true,
          port: 8080,
          watchContentBase: true,
          watchOptions: {
               poll: true
          },
          writeToDisk: true
     },

     watch: true
});
