
/*
 * Module dependencies.
 */

var shoelace = require('..');
var Builder = require('component-builder');
var readdir = require('fs').readdirSync;
var read = require('fs').readFileSync;

describe('shoelace-components', function(){
  readdir('test/cases').forEach(function(dir){
    var builder = new Builder('test/cases/' + dir);
    it('should ' + dir, function(done){
      var In = read('test/cases/' + dir + '/in.css', 'utf8');
      var Out = read('test/cases/' + dir + '/out.css', 'utf8');
      builder.use(shoelace);
      builder.build(function(err, data){
        if (err) return done(err);
        data.css.should.equal(Out.trim());
        done();
      });
    });
  });
});
