/*
    This is a backend plugin for registry-follower, which is not yet a public
    module, but sure could be. (TODO ceej)
*/

var
    _         = require('lodash'),
    assert    = require('assert'),
    async     = require('async'),
    bole      = require('bole'),
    fs        = require('fs'),
    normalize = require('npm-normalize'),
    Request   = require('request')
    ;

var logger = bole('npm2norch');

var Storage = module.exports = function Storage(opts)
{
    assert(opts && _.isObject(opts), 'you must pass an options object');
    assert(opts.target && _.isString(opts.target), 'you must pass a target server uri in opts.target');

    _.extend(this, opts);

    if (!this.downloads)
        this.downloads = 'https://api.npmjs.org';

    this.backendname = 'elasticsearch';

    this.changeQueue = async.queue(this.handleChange.bind(this), 16);
    this.changeQueue.pause();
    this.deleteQueue = async.queue(this.handleDelete.bind(this), 16);
    this.deleteQueue.pause();

    this.target = opts.target;
};

Storage.prototype.backendname = 'norch';
Storage.prototype.target      = null;
Storage.prototype.downloads   = null;
Storage.prototype.changeQueue = null;
Storage.prototype.deleteQueue = null;
Storage.prototype.paused      = true;

Storage.prototype.handlePublish = function(change, doc, callback)
{
    if (!change.id) return callback();

    // We queue up batches of work to allow this follower to consume changes
    //  a little faster than serially chugging through them all.
    var self = this;

    var resume = function()
    {
        self.paused = false;
        self.changeQueue.empty = null;
        // no callback for the queue; could reconsider.
        self.changeQueue.push({ change: change, doc: doc });
        callback();
    };

    // Don't bloat by stacking up too much work.
    if (self.changeQueue.length() > 64)
    {
        self.paused = true;
        self.changeQueue.empty = resume;
    }
    else
        resume();
};

Storage.prototype.fetchDownloadCounts = function(pkg, range, callback)
{
    var opts =
    {
        method: 'GET',
        uri: this.downloads + '/downloads/point/last-' + range + '/' + pkg,
        json: true,
    };

    Request(opts, function(err, response, body)
    {
        // We swallow errors because we don't want them to interfere with indexing.
        var count = 0;
        if (!err && body && !body.error)
            count = body.downloads;
        callback(null, count);
    });
};

Storage.prototype.handleChange = function(task, callback)
{
    var self = this;
    var doc = normalize(task.doc) || task.doc;
    var change = task.change;
    if (!callback)
        callback = function()
        {};

    var toIndex =
    {
        id: change.id,
        description: doc.description,
        readme: doc.readme,
        keywords: doc.keywords
    };

    var actions =
    {
        day: function(cb)
            { self.fetchDownloadCounts(change.id, 'day', cb); },
        week: function(cb)
            { self.fetchDownloadCounts(change.id, 'week', cb); },
        month: function(cb)
            { self.fetchDownloadCounts(change.id, 'month', cb); },
    };

    async.parallel(actions, function(err, results)
    {
        toIndex.dlDay = results.day;
        toIndex.dlWeek = results.week;
        toIndex.dlMonth = results.month;
        if (toIndex.dlMonth)
            toIndex.dlScore = toIndex.dlWeek / (toIndex.dlMonth / 4);
        else
            toIndex.dlScore = 0;

        if (doc.users)
            toIndex.stars = doc.users.length;
        else
            toIndex.stars = 0;

        // TODO massage doc further into a norch-ready document blob
        var opts =
        {
            method: 'POST',
            uri: self.target + '/package',
            json: toIndex
        };

        Request(opts, function(err, res, body)
        {
            if (err)
                logError('problem adding ' + change.id + ' to index', err);
            else
                logger.info(change.id + ' indexed');
            callback(err, toIndex);
        });
    });
};

Storage.prototype.handleUnpublish = function(name, callback)
{
    // We probably aren't going to pile these up. If we do, we can apply
    // the technique above.
    this.deleteQueue.push(name, callback);
};

Storage.prototype.handleDelete = function(name, callback)
{
    var self = this;

    var opts =
    {
        method: 'DELETE',
        uri: self.target + '/package/' + encodeURIComponent(name),
        json: true,
    };

    Request(opts, function(err, res, body)
    {
        // TODO 404s and other errors
        if (err)
            logError('problem removing ' + name + ' from index', err);
        callback(err);
    });
};

function logError(message, err)
{
    logger.error(message);
    logger.error(err);
}

Storage.prototype.resume = function()
{
    this.changeQueue.resume();
    this.deleteQueue.resume();
};
