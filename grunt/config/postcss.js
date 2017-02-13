// grunt/config/postcss.js

module.exports = {
  options: {
    processors: [
      require('pixrem')(), // add fallbacks for rem units
      require('autoprefixer')({browsers: 'last 2 versions'}), // add vendor prefixes
      require('cssnano')({
        safe: true
      }) // minify the result (safely)
    ]
  },
  dev: {
    options: {
      map: true
    },
    src: 'build/assets/css/*.css'
  },

  dist: {
    options: {
      map: false
    },
    src: 'dist/assets/css/*.css'
  }
}
