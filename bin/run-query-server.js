#!/usr/bin/env node

var bole          = require('bole');
var Scorch        = require('../index');
var Emitter       = require('numbat-emitter');
var replify       = require('replify');
var argv          = require('yargs')
    .usage('Usage : scorch --name scorch-1 --listen localhost:5555 --redis http://localhost:6379')
    .alias('n', 'name')
    .describe('n', 'node name for metrics & logging')
    .default('n', 'scorch')
    .alias('l', 'listen')
    .describe('l', 'host:port pair to listen on')
    .default('l', 'localhost:5757')
    .alias('r', 'redis')
    .describe('r', 'host:port pair for redis')
    .alias('i', 'index')
    .describe('i', 'path for norch index file')
    .default('i', 'norch')
    .default('r', 'http://localhost:6379')
    .alias('m', 'metrics')
    .describe('m', 'numbat metrics URI; optional')
    .help('help')
    .argv
    ;

function splitHostPort(input)
{
    var pieces = input.split(':');
    return { host: pieces[0], port: pieces[1]};
}

var listen = splitHostPort(argv.listen);
var opts =
{
    name:  argv.name,
    port:  process.env.PORT || listen.port,
    host:  process.env.HOST || listen.host,
    index: argv.index,
    redis: argv.redis,
};

var logger = bole('wrapper');
var outputs = [];
if (process.env.NODE_ENV && process.env.NODE_ENV.match(/^dev/))
{
    var prettystream = require('bistre')({time: true});
    prettystream.pipe(process.stdout);
    outputs.push({ level:  'debug', stream: prettystream });
}
else
    outputs.push({level: 'info', stream: process.stdout});
bole.output(outputs);

if (argv.metrics)
{
    var metricOpts =
    {
        uri:  argv.metrics,
        node: argv.name
    };
    opts.metrics = new Emitter(metricOpts);
    logger.info('emitting metrics to ' + argv.metrics);
}
else
{
    opts.metrics = new StubMetricsEmitter();
    logger.info('metrics not enabled');
}

var server = new Scorch.Server(opts);
server.listen(opts.port, opts.host, function(err)
{
    if (err)
    {
        logger.error(err, 'while starting up on port ' + opts.port);
        process.exit(1);
    }

    var addy = server.server.address();
    logger.info('query service listening on ' + addy.address + ':' + addy.port);
    logger.info('options', opts);
    opts.metrics.metric({ name: 'scorch.start', pid: process.pid });
});

replify({ name: opts.name }, server, { config: opts });
logger.info('to connect to repl, run `rc /tmp/repl/' + opts.name + '.sock`');

function StubMetricsEmitter()
{}
StubMetricsEmitter.prototype.metric = function()
{};
