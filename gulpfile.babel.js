/**
 * Команды для запуска проекта
 * gulp - основная команда, при запуске скомпилируются стили и html
 *
 * Так же есть флаги
 * --bem запустит gulp с компиляцией по bem нотации
 * запуск gulp --bem
 */

'use strict';

import gulp            from 'gulp';
import runSequence     from 'run-sequence';
import fs              from 'fs';
import perfectionist   from 'perfectionist';
import mqpacker        from "css-mqpacker";
import autoprefixer    from 'autoprefixer';
import browserSync     from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';

const env = {
    argv: require('yargs').argv,
    bemPrefix: {elemPrefix: '__', modPrefix: '_', modDlmtr: '--'},
    noBemPrefix: {elemPrefix: '-', modPrefix: '-', modDlmtr: '-'},
    src: {
        jade: ['./assets/pages/!(_)*.jade'],
        json: './assets/data/data.json',
        scss: ['assets/scss/**/style.scss'],
        less: ['assets/less/**/style.less'],
        styl: ['assets/styl/**/style.styl']
    },
    watch: {
        jade: [
            'assets/data/**/*.json',
            'assets/pages/**/*.jade',
            'assets/components/**/*.jade',
            'assets/mixins/**/*.jade'
        ],
        scss: ['assets/scss/**/style.scss'],
        less: ['assets/less/**/style.less'],
        styl: ['assets/styl/**/style.styl']
    },
    browserSync: {
        server: {baseDir: "./app/"},
        open: false
    },
    PROCESSORS: [
        autoprefixer({ browsers: ['last 2 versions', '> 1%'] }),
        mqpacker
    ]
}

let $ = gulpLoadPlugins({});
let reload = browserSync.reload;

gulp.task('browserSync', () => {browserSync(env.browserSync)})

gulp.task('jade', () => {
    var data = JSON.parse(fs.readFileSync(env.src.json, 'utf-8'));

    return gulp.src(env.src.jade)
        .pipe($.remember('jade'))
        .pipe($.jade({locals: data }))
        .on('error', $.notify.onError())
        .pipe($.posthtml([
            require('posthtml-bem')(((env.argv.bem))?(env.bemPrefix):(env.noBemPrefix))
        ]))
        .pipe($.prettify({indent_size: 4}))
        .pipe($.replace(/&nbsp;/g, ' '))
        .pipe($.check('elem="')).on('error', $.notify.onError())
        .pipe(gulp.dest('./app/'))
        .on('end', browserSync.reload)
})

gulp.task('scss', () => {
    return gulp.src(env.src.scss)
        .pipe($.sass().on('error', $.notify.onError()))
        .pipe($.postcss(env.PROCESSORS))
        .pipe($.csso())
        .pipe($.postcss([perfectionist({})]))
        .pipe(gulp.dest('./app/css'))
        .pipe(reload({stream: true}))
})

gulp.task('less', () => {
    return gulp.src(env.src.less)
        .pipe($.less().on('error', $.notify.onError()))
        .pipe($.postcss(env.PROCESSORS))
        .pipe($.csso())
        .pipe($.postcss([perfectionist({})]))
        .pipe(gulp.dest('./app/css'))
        .pipe(reload({stream: true}))
})

gulp.task('styl', () => {
    return gulp.src(env.src.styl)
        .pipe($.stylus().on('error', $.notify.onError()))
        .pipe($.postcss(env.PROCESSORS))
        .pipe($.csso())
        .pipe($.postcss([perfectionist({})]))
        .pipe(gulp.dest('./app/css'))
        .pipe(reload({stream: true}))
})

gulp.task('build', () =>{runSequence('browserSync', 'scss', 'jade')})

gulp.task('default', ['build'], () => {
    $.watch(env.watch.scss, () => gulp.start('scss'));
    $.watch(env.watch.jade, () => gulp.start('jade'));
    $.watch(env.watch.less, () => gulp.start('less'));
    $.watch(env.watch.styl, () => gulp.start('styl'));
})
