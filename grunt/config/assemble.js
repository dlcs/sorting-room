// grunt/config/assemble.js

module.exports = {
  options: {
    flatten: true,
    layoutdir: 'src/views/layouts',
    partials: 'src/views/**/*.hbs', //['src/views/organisms/**/*.hbs', 'src/views/molecules/**/*.hbs', 'src/views/atoms/**/*.hbs'],
    postprocess: require('pretty'),
    prettify: { indent: 2 },
    marked: { sanitize: false },
    production: true,

    data: 'src/views/_data/*.json',
    helpers: ['handlebars-helpers', 'src/views/_helpers/*.js'],
    includes: ['src/views/organisms', 'src/views/molecules', 'src/views/atoms']
  },

  dev: {
    options: {
      layout: 'default.hbs'
    },
    files: [
      { 
        src: ['src/views/pages/*.hbs'],
        dest: 'build/'
      }
    ]
  },

  dist: {
    options: {
      layout: 'default.hbs'
    },
    files: [
      { 
        src: ['src/views/pages/*.hbs'],
        dest: 'dist/'
      }
    ]
  }
}