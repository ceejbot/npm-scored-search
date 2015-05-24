var
    _       = require('lodash'),
    assert  = require('assert'),
    bole    = require('bole'),
    Monitor = require('@npm/restify-monitor'),
    restify = require('restify'),
    util    = require('util')
    ;

var Server = module.exports = function Server(options)
{
    assert(options, 'you must pass an options object to the constructor');
    assert(options.name && _.isString(options.name), 'you must pass a name for this node');
    assert(options.metrics && _.isObject(options.metrics), 'you must pass a metrics emitter');

    this.options = options;
    this.logger  = bole(options.name);
    this.server  = restify.createServer(options);
    this.metrics = options.metrics;

    // middleware
    this.server.use(restify.bodyParser());
    Monitor(this.server, { logger: this.logger, metrics: this.metrics });

    // TODO routes

    this.server.on('after', this.emitMetrics.bind(this));
};

Server.prototype.server  = null;
Server.prototype.options = null;
Server.prototype.logger  = null;
Server.prototype.metrics = null;

Server.prototype.listen = function(port, host, callback)
{
    this.server.listen(port, host, callback);
};

Server.prototype.emitMetrics = function(request, response, route, error)
{
    if (response._time && this.metrics)
    {
        var latency = Date.now() - response._time;
        this.metrics.metric({ name: 'norch.latency', value: latency });
    }
};
