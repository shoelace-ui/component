
/*
 * Module dependencies.
 */

var should = require('should');
var shoelace = require('..');
var Builder = require('component-builder');
var readdir = require('fs').readdirSync;
var read = require('fs').readFileSync;
var exists = require('fs').existsSync;

describe('shoelace-components', function(){
  readdir('test/cases').forEach(function(dir){
    var builder = new Builder('test/cases/' + dir);
    it('should ' + dir, function(done){
      var In = read('test/cases/' + dir + '/in.css', 'utf8');
      var Out = read('test/cases/' + dir + '/out.css', 'utf8');

      // use local `options.json` as programmatic mock
      var options = exists('test/cases/' + dir + '/options.json')
        ? JSON.parse(read('test/cases/' + dir + '/options.json', 'utf8'))
        : false;

      options ? builder.use(shoelace(options)) : builder.use(shoelace);

      builder.build(function(err, data){
        if (err) return done(err);
        data.css.should.equal(Out.trim());
        done();
      });
    });
  });
});
