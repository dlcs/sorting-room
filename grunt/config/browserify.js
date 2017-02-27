// grunt/config/browserify.js

module.exports = {
  dev: {
    options: {
      browserifyOptions: {
        debug: true,
      },
      transform: [['babelify', { presets: ['es2015', 'react'] }]],
    },
    src: ['src/js/script.js'],
    dest: 'build/assets/js/script.js',
  },

  dist: {
    options: {
      transform: [['babelify', { presets: ['es2015', 'react'] }]],
    },
    src: ['src/js/script.js'],
    dest: 'dist/assets/js/script.js',
  },
};
