'use strict';

const env = {
    argv: require('yargs').argv,
    bemPrefix: {elemPrefix: '__', modPrefix: '_', modDlmtr: '--'},
    noBemPrefix: {elemPrefix: '-', modPrefix: '-', modDlmtr: '-'},
    src: {
        jade: ['./assets/pages/!(_)*.jade'],
        json: './assets/data/data.json',
        scss: ['assets/styles/**/style.scss']
    },
    watch: {
        jade: [
            'assets/data/**/*.json',
            'assets/pages/**/*.jade',
            'assets/components/**/*.jade',
            'assets/mixins/**/*.jade'
        ],
        scss: [
            'assets/components/**/*.scss',
            'assets/styles/**/*.scss'
        ]
    },
    browserSync: {
        server: {baseDir: "./app/"},
        open: false
    }
}

import gulp            from 'gulp';
import del             from 'del';
import mainBowerFiles  from 'main-bower-files';
import runSequence     from 'run-sequence';
import fs              from 'fs';
import perfectionist   from 'perfectionist';
import pxtorem         from 'postcss-pxtorem';
import selector        from 'postcss-custom-selectors';
import focusHover      from 'postcss-focus-hover';
import mqpacker        from "css-mqpacker";
import autoprefixer    from 'autoprefixer';
import browserSync     from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';

let $ = gulpLoadPlugins({});

let PROCESSORS = [
    pxtorem({
        root_value: 14,
        selector_black_list: ['html']
    }),
    autoprefixer({ browsers: ['last 2 versions', '> 1%'] }),
    mqpacker,
    selector,
    focusHover
]

let BOWER_MAIN_FILES_CONFIG = {
    includeDev: true,
    paths:{
        bowerDirectory: './assets/bower',
        bowerJson: './bower.json'
    }
}

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
        .pipe($.sassGlobImport())
        .pipe($.sass().on('error', $.notify.onError()))
        .pipe($.postcss(PROCESSORS))
        .pipe($.csso())
        .pipe($.postcss([perfectionist({})]))
        .pipe(gulp.dest('./app/css'))
        .pipe(reload({stream: true}))
})

gulp.task('build', () =>{runSequence('scss', 'jade')})

gulp.task('default', ['browserSync', 'build'], () => {
    $.watch(env.watch.scss, () => gulp.start('scss'));
    $.watch(env.watch.jade, () => gulp.start('jade'));
})
