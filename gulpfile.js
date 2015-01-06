var gbrowserify = require( 'gulp-browserify' ),
    gulp = require( 'gulp' ),
    buffer = require( 'vinyl-buffer' ),
    uglify = require( 'gulp-uglify' ),
    watchify = require( 'watchify' ),
    browserify = require( 'browserify' ),
    gutil = require('gulp-util'),    
    source = require('vinyl-source-stream'),
    rename = require( 'gulp-rename' );

gulp.task( 'client', function(){
  var out = gulp.src( './scripts/client/gibber/communication.lib.js' )//gulp.src( './node_modules/gibber.core.lib/scripts/gibber.js')
    .pipe( gbrowserify({ 
      standalone:'Gibber',
      bare:true, 
      ignore:[
        'gibber.graphics.lib/scripts/gibber/graphics/graphics',
        'gibber.interface.lib/scripts/gibber/interface/interface',
        'gibber.audio.lib/scripts/gibber/audio',
        'gibber.communication.lib/scripts/client/gibber/communication',        
      ]
    }) )
    .pipe( rename('gibber.communication.lib.js') )
    .pipe( gulp.dest('./build/') )
    .pipe( buffer() )
    .pipe( uglify() )
    .pipe( rename('gibber.communication.lib.min.js') )
    .pipe( gulp.dest('./build/') )
    
    return out
});

gulp.task('watch', function() {
  var bundler = watchify( browserify('./scripts/client/gibber/communication.lib.js', { standalone:'Gibber', cache: {}, packageCache: {}, fullPaths: true } ) );

  // Optionally, you can apply transforms
  // and other configuration options on the
  // bundler just as you would with browserify
  //bundler.transform('brfs');

  bundler.on('update', rebundle);

  function rebundle() {
    console.log("recompiling... ", Date.now() )
    return bundler.bundle()
      // log errors if they happen
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe( source( 'bundle.js' ) )
      .pipe( rename( 'gibber.communication.lib.js' ) )
      .pipe( gulp.dest( './build' ) )
      // .pipe( uglify() )
      // .pipe( rename('gibber.audio.lib.min.js') )
      // .pipe( gulp.dest('./build/') )
  }

  return rebundle();
});

/*
Gibber.Graphics  = require( 'gibber.graphics.lib/scripts/gibber/graphics/graphics' )( Gibber )
Gibber.Interface = require( 'gibber.interface.lib/scripts/gibber/interface/interface' )( Gibber )
*/

gulp.task( 'default', ['client'] )