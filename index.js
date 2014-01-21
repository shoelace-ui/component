/*
 * Module dependencies.
 */

var debug = require('debug')('shoelace-component:index');
var rework = require('rework');
var modules = require('rework-modules');
var type = require('type-component');
var merge = require('merge');
var fs = require('fs');
var path = require('path');
var read = fs.readFileSync;
var exists = fs.existsSync;

/**
 * Rework plugins.
 */

var plugins = [
  // native
  ['references', null],
  ['colors', null],
  ['mixins', 'mixins'],
  ['extend', null],

  // third-party prefixed
  ['media-selector', null],
  ['palette', null],
  ['calc'],
  ['color-function'],
  ['breakpoints'],

  // third-party nonprefixed
  ['autoprefixer', null, 'rework']
];

/*
 * Default plugin settings.
 */

var defaults = require('./defaults');

/**
 * Wrap and expose `compile`.
 */

module.exports = function(builder) {
  if (builder.build) return compile(builder);
  var options = builder;
  return function(builder) {
    return compile(builder, options);
  }
}

/**
 * Instantiate and compile `Shoelace`.
 */

function compile(builder, options) {
  var sl = new Shoelace(builder, options);
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

/**
 * Take a builder and options, and return processed styles.
 * @param {Builder} builder
 * @param {Object} options
 */

function Shoelace(builder, options) {
  this.builder = builder;
  this.options = options || {};
  this.modules = {};
}

Shoelace.prototype.load = function(pkg) {
  var styles = pkg.config.styles;
  if (!styles) return;

  var mods = this.modules;

  var name = (pkg.config.repo || pkg.config.name).replace('/', '-');
  if (!name) throw new Error('component.json missing repo property');
  if (pkg.root) mods['index'] = name;

  this.packageOptions = pkg.config.options || {};

  styles.forEach(function(file) {
    var style = name + '/' + file;

    // alias the first file in the package
    if (!mods[name]) {
      mods[name] = style;
      if (pkg.parent && pkg.config.name) {
        mods[(pkg.parent.config.repo).replace('/', '-') + '/deps/' + pkg.config.name] = style;
      }
    }

    mods[style.replace('.styl', '')] = style;
    mods[style] = get;

    var cache;
    function get() {
      if (cache) return cache;
      cache = read(pkg.path(file), 'utf8');
      return cache;
    }
  });
  pkg.config.styles = [];
};

Shoelace.prototype.build = function(fn) {
  var out = modules(this.modules);
  var progOpts = this.options;
  var confOpts = this.packageOptions;

  plugins.map(function(arr){
    var name = arr[0];
    var arg = arr[1]
    var method = arr[2];

    // find plugin
    // TODO: break this out and make it smarter
    var plugin = rework[name]
      ? rework[name]
      : exists(__dirname + '/node_modules/rework-' + name)
        ? require('rework-' + name)
        : exists(__dirname + '/node_modules/' + name)
          ? require(name)
          : false;

    // merge options such that last loaded wins
    // i.e., defaults < configured options < programmatic options
    if (defaults[name]) arg = merge(arg, defaults[name]);
    if (confOpts[name]) arg = merge(arg, confOpts[name]);
    if (progOpts[name]) arg = merge(arg, progOpts[name]);

    if (arg && arg.disable) arg = null;

    // resolve plugin with arguments
    var resolved;
    switch (type(arg)) {
      case 'null':
        resolved = plugin();
        break;
      case 'object':
        resolved = plugin(arg);
        break;
      case 'string':
        resolved = plugin(require('rework-' + arg));
        break;
      default:
        resolved = plugin;
    }

    // if a method was passed, use it
    if (method) return out.use(resolved[method]);

    out.use(resolved);
  });

  fn(null, out.toString());
};
