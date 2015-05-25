var
    _       = require('lodash'),
    assert  = require('assert'),
    bole    = require('bole'),
    Monitor = require('@npm/restify-monitor'),
    restify = require('restify'),
    Norch   = require('./norch')
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

    this.norch = new Norch(options);

    // middleware
    this.server.use(restify.bodyParser());
    Monitor(this.server, { logger: this.logger, metrics: this.metrics });

    this.server.post('/package', this.handlePackagePost.bind(this));
    this.server.del('/package/:id', this.handlePackageDelete.bind(this));
    this.server.get('/matches/:prefix', this.handleMatches.bind(this));
    this.server.get('/search/:terms', this.handleSearch.bind(this));

    this.server.on('after', this.emitMetrics.bind(this));
};

Server.prototype.server  = null;
Server.prototype.options = null;
Server.prototype.logger  = null;
Server.prototype.metrics = null;

Server.prototype.listen = function listen(port, host, callback)
{
    this.server.listen(port, host, callback);
};

Server.prototype.close = function close(callback)
{
    this.server.close();
    this.norch.close(callback);
};

Server.prototype.emitMetrics = function emitMetrics(request, response, route, error)
{
    if (response._time && this.metrics)
    {
        var latency = Date.now() - response._time;
        this.metrics.metric({ name: 'norch.latency', value: latency });
    }
};

Server.prototype.handlePackagePost = function handlePackagePost(request, response, next)
{
    var self = this,
        package = request.body;

    if (!package || !package.id)
    {
        response.send(422);
        return next();
    }

    this.norch.add(package, function(err)
    {
        // TODO : at least log any errors; possibly respond with more
        response.json(201, { status: package.id + ' indexed' });
        next();
    });
};

Server.prototype.handlePackageDelete = function handlePackageDelete(request, response, next)
{
    var self = this,
        name = decodeURIComponent(request.params.id);
    
    this.norch.remove(name, function(err)
    {
        // TODO : at least log any errors; possibly respond with more
        response.json(204);
        next();
    });
};

Server.prototype.handleMatches = function handleMatches(request, response, next)
{
    var self = this,
        prefix = decodeURIComponent(request.params.prefix);

    this.norch.matches(prefix, function(err, matches)
    {
        // TODO
        console.log(matches);
        response.json(200, matches);
        next();
    });
};

Server.prototype.handleSearch = function handleSearch(request, response, next)
{
    var self = this,
        query = request.body;

    this.norch.search(query, function(err, results)
    {
        // TODO
        console.log(results);
        response.json(200, results);
        next();
    });
};
