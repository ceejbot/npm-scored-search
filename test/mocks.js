
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

exports.StubMetricsEmitter = StubMetricsEmitter;
exports.ErrorProneRedis    = ErrorProneRedis;
