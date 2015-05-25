var
    _      = require('lodash'),
    assert = require('assert'),
    Norch  = require('search-index');

var Adapter = module.exports = function Adapter(opts)
{
    assert(opts && _.isObject(opts), 'you must pass an options object');
    assert(opts.index && _.isString(opts.index), 'you must pass an index path in opts.index');

    this.norch = new Norch({ indexPath: opts.index });

    // TODO all the magic will go here
    // TODO also all the work
};

Adapter.prototype.norch   = null;

Adapter.prototype.close = function close(callback)
{
    // TODO clean up the search-index
    callback();
};

Adapter.prototype.add = function add(document, callback)
{
    callback(new Error('unimplemented'));
};

Adapter.prototype.remove = function remove(id, callback)
{
    callback(new Error('unimplemented'));
};

Adapter.prototype.matches = function matches(prefix, callback)
{
    callback(new Error('unimplemented'));
};

Adapter.prototype.search = function search(query, callback)
{
    callback(new Error('unimplemented'));
};
