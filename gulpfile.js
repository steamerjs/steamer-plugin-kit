const gulp  = require("gulp");

const pkgName = "steamer-plugin-kit";

function compile() {
    return gulp.src('./index.js')
        .pipe(gulp.dest('./node_modules/' + pkgName));
}

function copy() {
    return gulp.src('./package.json')
        .pipe(gulp.dest('./node_modules/' + pkgName));
}

gulp.task('default', gulp.parallel(compile, copy));
gulp.task('dev', function() {
	gulp.watch(['./index.js', './package.json'], gulp.parallel(compile, copy));
});

