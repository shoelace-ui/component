/*
 * Module dependencies.
 */

var rework = require('rework');
var mixins = require('rework-mixins');
var calc = require('rework-calc');
var breakpoints = require('rework-breakpoints');
var modules = require('rework-modules');
var myth = require('myth');
var fs = require('fs');
var path = require('path');
var read = fs.readFileSync;

module.exports = function(builder) {
  var sl = new Shoelace(builder);
  var buildType = builder.buildType;
  builder.buildType = function(type, fn, process) {
    if (type !== 'styles') return buildType.apply(builder, arguments);
    buildType.call(builder, type, function() {
      sl.build(fn);
    }, process);
  };
  builder.hook('before styles', function(pkg) {
    sl.load(pkg);
  });
};

function Shoelace(builder) {
  this.builder = builder;
  this.modules = {};
}

Shoelace.prototype.load = function(pkg) {
  var styles = pkg.config.styles;
  if (!styles) return;

  var mods = this.modules;

  var name = pkg.config.repo || pkg.config.name;
  if (!name) throw new Error('component.json missing repo property');
  if (pkg.root) mods['index'] = name;

  styles.forEach(function(file) {
    var style = name + '/' + file;
    if (!mods[name]) mods[name] = style;

    mods[style.replace('.styl', '')] = style;
    mods[style] = get;

    var cache;
    function get() {
      if (cache) return cache;
      cache = read(pkg.path(file), 'utf8');
      return cache;
    };
  });
  pkg.config.styles = [];
};

Shoelace.prototype.build = function(fn) {

  var out = modules(this.modules)
    .use(rework.extend())
    .use(rework.colors())
    .use(rework.references())
    .use(rework.mixins(mixins))
    .use(breakpoints)
    .use(myth)
    .use(calc);

  fn(null, out.toString());
};
