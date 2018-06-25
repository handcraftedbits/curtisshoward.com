var embedSvg = require("gulp-embed-svg");
var gulp = require("gulp");
var htmlmin = require("gulp-htmlmin");
var process = require("process");

gulp.task("default", function() {
     var htmlPath = process.cwd() + "/../public";

     return gulp.src(htmlPath + "/**/*.html")
          .pipe(embedSvg({
               root: htmlPath
          }))
          .pipe(htmlmin({
               collapseWhitespace: true
          }))
          .pipe(gulp.dest(htmlPath));
});
