// grunt/tasks/default.js

module.exports = function(grunt) {
  grunt.registerTask('default', ['clean:dev','assemble:dev', 'sasslint','sass:dev', 'postcss:dev', 'eslint', 'browserify:dev', 'modernizr:dev', 'copy:dev', 'browserSync:dev', 'watch']);
};
