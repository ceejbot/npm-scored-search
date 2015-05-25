var
    _       = require('lodash'),
    sinon   = require('sinon')
    ;

function StubMetricsEmitter()
    {}
StubMetricsEmitter.prototype.metric = function()
    {};

function ErrorProneRedis(opts)
{
    this.opts = opts;
}

ErrorProneRedis.prototype.del = function()
{
    var args = Array.prototype.slice.call(arguments);
    var callback = arguments[arguments.length - 1];
    callback(new Error('redis del error'));
};

ErrorProneRedis.prototype.hmget = function()
{
    var args = Array.prototype.slice.call(arguments);
    var callback = arguments[arguments.length - 1];
    callback(new Error('redis hmget error'));
};

ErrorProneRedis.prototype.hmset = function()
{
    var args = Array.prototype.slice.call(arguments);
    var callback = arguments[arguments.length - 1];
    callback(new Error('redis hmset error'));
};

ErrorProneRedis.prototype.expire = function()
{
    var args = Array.prototype.slice.call(arguments);
    var callback = arguments[arguments.length - 1];
    callback(new Error('redis expire error'));
};

var MockQueue = exports.MockQueue = function MockQueue(concurrency)
{
    this.queue = 0;
    this.push = sinon.spy(this.push.bind(this));
    this.length = sinon.spy(this.length.bind(this));
};

MockQueue.prototype.push = function(task, cb)
{
    this.queue++;
    setTimeout(function()
    {
        this.queue--;
        if (cb)
            cb(null, task);
    }, 250);
};

MockQueue.prototype.length = function()
{
    return this.queue;
};

MockQueue.prototype.resume = function()
{ };

exports.StubMetricsEmitter = StubMetricsEmitter;
exports.ErrorProneRedis    = ErrorProneRedis;
