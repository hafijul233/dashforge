'use strict';

const { src, dest, series, watch } = require('gulp');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const bs = require('browser-sync').create();
const npmDist = require('gulp-npm-dist');
const htmlInjector = require('bs-html-injector');

sass.compiler = require('node-sass');

// Compile scss files to style.css file
function compileStyle() {
  return src('./src/scss/dashforge.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(dest('./dist/css'))
  .pipe(bs.stream());
}

// Compile and minify scss files to style.css file
function minifyStyle () {
  return src('./src/scss/dashforge.scss')
    .pipe(sass({outputStyle: 'compressed'}))
    .pipe(rename({suffix: '.min'}))
    .pipe(dest('./dist/css'))
    .pipe(bs.stream());
}

// Compile skins styles to css folder
function compileSkinStyle() {
  return src('./src/scss/skins/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(rename({prefix: 'skin.'}))
  .pipe(dest('./dist/css'))
  .pipe(bs.stream());
}

// Compile pages styles to css folder
function compilePageStyle() {
  return src('./src/scss/pages/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(rename({prefix: 'dashforge.'}))
  .pipe(dest('./dist/css'))
  .pipe(bs.stream());
}

// Start a server
function serve () {
  bs.use(htmlInjector, {
    files: "**/*.html"
  });

  // Now init the Browsersync server
  bs.init({
    injectChanges: true,
    server: true
  });

  // Listen to change events on HTML and reload
  watch('**/*.html').on('change', htmlInjector);

  // Provide a callback to capture ALL events to CSS
  // files - then filter for 'change' and reload all
  // css files on the page.
  watch('./src/scss/**/*.scss', series(compileStyle, minifyStyle));

  watch('./src/scss/skins/**/*.scss', compileSkinStyle);
  watch('./src/scss/pages/*.scss', compilePageStyle);

  watch(
      ['./src/scss/_variables.scss','./src/scss/bootstrap/_variables.scss'],
      series(compileStyle, compilePageStyle)
  );

}

// Copy dependencies to template/lib
function npmDep () {
  return src(npmDist(), { base:'./node_modules/' })
      .pipe(rename(function(path) {
        path.dirname = path.dirname.replace(/\/dist/, '').replace(/\\dist/, '');
      }))
      .pipe(dest('./dist/vendor'));
}

function resetAll() {
  npmDep();
  compileStyle();
  minifyStyle();
  compileSkinStyle();
  compilePageStyle();
  serve();
}

exports.compileStyle = compileStyle;
exports.minifyStyle = minifyStyle;
exports.compileSkinStyle = compileSkinStyle;
exports.compilePageStyle = compilePageStyle;
exports.serve = serve;
exports.npmDep = npmDep;
exports.refresh = resetAll;