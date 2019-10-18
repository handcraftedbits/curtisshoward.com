const path = require("path");

const AssetsPlugin = require("assets-webpack-plugin");
const FaviconsPlugin = require("favicons-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const PostCompilePlugin = require("post-compile-webpack-plugin");
const ReplaceInFile = require("replace-in-file");
const SvgSpritemapPlugin = require("svg-spritemap-webpack-plugin");

const paths = {
     dist: {
          get _base() {
               return path.join(__dirname, "dist");
          }
     },

     hugo: {
          get _base() {
               return path.join(__dirname, "hugo");
          },

          get data() {
               return path.join(this._base, "data");
          }
     },

     src: {
          get _base() {
               return path.join(__dirname, "src");
          },

          get image() {
               return path.join(this._base, "image");
          },

          get template() {
               return path.join(this._base, "template");
          }
     }
};

module.exports = {
     entry: {
          resume: path.join(paths.src._base, "resume.js"),
          site: path.join(paths.src._base, "site.js")
     },

     output: {
          filename: "[name]-[hash].js",
          path: paths.dist._base
     },

     module: {
          rules: [
               {
                    test: /\.s?css$/,
                    use: [ MiniCssExtractPlugin.loader, "css-loader", "sass-loader" ]
               }
          ]
     },

     plugins: [
          new AssetsPlugin({
               filename: "webpack.json",
               path: paths.hugo.data
          }),

          new HtmlPlugin({
               filename: path.join(paths.hugo.data, "favicons.yaml"),
               inject: false,
               template: path.join(paths.src.template, "hugo", "data", "favicons.yaml")
          }),

          new FaviconsPlugin({
               favicons: {
                    appDescription: "The personal website of Curtiss Howard",
                    background: "#EDEDED",
                    developerURL: "https://curtisshoward.com",
                    start_url: "/",
                    theme_color: "#EDEDED"
               },
               inject: "force",
               logo: path.join(paths.src.image, "logo.svg.favicon"),
               mode: "webapp",
               prefix: "favicon"
          }),

          new MiniCssExtractPlugin({
               filename: "[name]-[hash].css"
          }),

          new PostCompilePlugin(() => {
               ReplaceInFile.sync({
                    files: path.join(paths.hugo.data, "favicons.yaml"),
                    from: [ /^</, />$/ ],
                    to: [ "tags: '<", ">'" ]
               });
          }),

          new SvgSpritemapPlugin(path.join(paths.src.image, "*.svg"), {
               output: {
                    filename: "sprites-[hash].svg"
               },

               sprite: {
                    prefix: false
               }
          })
     ]
};
