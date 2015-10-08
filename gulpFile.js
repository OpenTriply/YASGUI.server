var gulp = require('gulp'),
    git = require('gulp-git'),
    bump = require('gulp-bump'),
    filter = require('gulp-filter'),
    tag_version = require('gulp-tag-version'),
    nodemon = require('gulp-nodemon'),
  	runSequence = require('run-sequence').use(gulp),
  	manifest = require('gulp-manifest'),
  	spawn = require('child_process').spawn;

var srcDir = './src';
var yasguiDir = './node_modules/yasgui';
var manifestFile = './server.html.manifest';

function inc(importance) {
    // get all the files to bump version in
    return gulp.src(['./package.json', './bower.json'])
        // bump the version number in those files
        .pipe(bump({type: importance}))
        // save it back to filesystem
        .pipe(gulp.dest('./'));
}

gulp.task('publish', function (done) {
  spawn('npm', ['publish'], { stdio: 'inherit' }).on('close', done);
});

gulp.task('push', function (done) {
  git.push('origin', 'gh-pages', {args: " --tags"}, function (err) {
    if (err) throw err;
  });
});

gulp.task('commitSrc', function() {
	  return gulp.src([manifestFile])
	    .pipe(git.add({args: '-f'}))
	    .pipe(git.commit("Updated manifest"));
});

gulp.task('tag', function() {
	return gulp.src(['./package.json'])
    .pipe(git.commit('version bump'))
	.pipe(tag_version());
});
gulp.task('buildManifest', function(){
  gulp.src([yasguiDir + '/dist/yasgui.min.css', yasguiDir + '/dist/yasgui.min.js'], {cwd: './'})
    .pipe(manifest({
      hash: true,
      timestamp: false,
      filename: manifestFile,
      basePath: './dist'
     }))
    .pipe(gulp.dest('./'));
});

gulp.task('bumpPatch', function() { return inc('patch'); })
gulp.task('bumpMinor', function() { return inc('minor'); })
gulp.task('bumpMajor', function() { return inc('major'); })

gulp.task('patch', function() {
	runSequence('bumpPatch', 'buildManifest', 'commitSrc', 'tag', 'publish', 'push');
});
gulp.task('minor', function() {
	runSequence('bumpMinor', 'buildManifest', 'commitDist', 'tag', 'publish', 'push');
});
gulp.task('major', function() {
	runSequence('bumpMajor', 'buildManifest', 'commitDist', 'tag', 'publish', 'push');
});


gulp.task('serve', function() {
	process.env.yasguiDev = 1;
	nodemon({ script: './src/index.js', watch: './src' })
});

gulp.task('default', function() {
  require('./src/index');
});
