var
    _      = require('lodash'),
    assert = require('assert'),
    bole   = require('bole'),
    Norch  = require('search-index');

var Adapter = module.exports = function Adapter(opts)
{
    assert(opts && _.isObject(opts), 'you must pass an options object');
    assert(opts.index && _.isString(opts.index), 'you must pass an index path in opts.index');

    this.index = new Norch({ indexPath: opts.index });
    this.logger = bole(opts.index);

    // TODO all the magic will go here
    // TODO also all the work
};

Adapter.prototype.index  = null;
Adapter.prototype.logger = null;
Adapter.prototype.filters = ['id', 'description', 'readme', 'keywords', 'author'];


function safeParse(input)
{
    try
        { return JSON.parse(input); }
    catch (ex)
        { return input; }
}

Adapter.prototype.close = function close(callback)
{
    // TODO clean up the search-index
    callback();
};

Adapter.prototype.get = function get(id, callback)
{
    var self = this;

    this.index.get(id, function(err, data)
    {
        if (err && err.message.match(/Key not found in database/))
            callback();
        else if (err)
            callback(err);
        else
            callback(null, safeParse(data));
    });
};

Adapter.prototype.add = function add(data, callback)
{
    var self = this;
    if (!Array.isArray(data))
        data = [data];

    this.index.add({batchName: 'packages', filters: this.filters},
        data,
        function(err)
    {
        // TODO
        callback(err);
    });
};

Adapter.prototype.remove = function remove(id, callback)
{
    var self = this;

    this.index.del(id, function(err)
    {
        if (err && err.message.match(/Key not found in database/))
            return callback();
        callback(err);
    });
};

Adapter.prototype.matches = function matches(prefix, callback)
{
    var self = this;

    this.index.match(prefix, function(err, results)
    {
        callback(err, results);
    });
};

Adapter.prototype.search = function search(query, callback)
{
    callback(new Error('unimplemented'));
};
