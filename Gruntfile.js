module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        mangle: false
      },
      target: {
        options: {
          sourceMap: true,
          sourceMapName: 'path/to/sourcemap.map'
        },
        files:{
          'js/dbhelper.min.js': 'js/dbhelper.js',
          'js/main.min.js': 'js/main.js',
          'js/restaurant_info.min.js': 'js/restaurant_info.js'
        }
      }
    },
    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'css/',
          src: ['*.css', '!*.min.css'],
          dest: 'css/',
          ext: '.min.css'
        }]
      }
    },
    responsive_images: {
      dev: {
        options: {
          engine: 'im',
          sizes: [
              {
              width: 150,
              suffix:'_small',
              quality: 30
            },{
              width: 270,
              suffix: '_medium',
              quality: 30
            },
          {
           width: 540,
           suffix: '_large',
           quality: 30
          }
        ]
        },

        /*
        You don't need to change this part if you don't change
        the directory structure.
        */
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img/',
          dest: 'images/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['images'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['images']
        },
      },
    },

    /* Copy the "fixed" images that don't go through processing into the images/directory */
    copy: {
      dev: {
        files: [{
          expand: true,
          src: 'images_src/fixed/*.{gif,jpg,png}',
          dest: 'images/'
        }]
      },
    },
  });
  
  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images', 'cssmin', 'uglify']);

};
