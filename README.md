# npm-scored-search

Three components:

1. A pluggable backend for [registry-follower](https://github.com/npm/registry-follower) that stores data in a sharded norch [search-index](https://github.com/fergiemcdowall/search-index) instead of elasticsearch.
2. An adapter for a norch [search-index](https://github.com/fergiemcdowall/search-index) that exposes a simplified npm-centric api for use by...
3. A restify server that exposes a query interface. This first searches by keywords using norch, then, if given an npm user, re-weights package scores using the package.json social graph.

![Coverage](http://img.shields.io/badge/coverage-86%25-yellow.svg?style=flat)
[![Travis](http://img.shields.io/travis/ceejbot/npm-scored-search.svg?style=flat)](https://travis-ci.org/ceejbot/npm-scored-search)

## Requirements

* write access to the norch search index path, with sufficient space
* redis
* probably some kind of tls termination in front

## npm script targets

* `start`: start the service; appropriate for production environments
* `dev`: start the service with pretty-printed console logging & NODE_ENV=dev
* `test`: run tests
* `lint`: run jshint against source files
* `test-travis`: run jshint as well as tests, and enforce some minimum coverage
* `logtail`: tail production logs through a pretty-printer
* `repl`: connect to the repl socket with the default name (socket uses the node name so this *should* be different in production; correct socket name is logged at start)

## backend for registry-follower

TBD

Requires the URI for a running query server as configuration.

(TODO: open-source registry-follower, which is probably of general use once npm-specific backends are stripped out)

## adapter

TBD

Used by the server.

## server

### API exposed

TBD

### Configuration

TBD

### monitoring hooks

TODO: open-source restify-monitor, which doesn't do much of anything special or sekrit

* `/_monitor/ping`: responds with 200 'pong' if up
* `/_monitor/status`: responds with 200 and a json object with PID & memory usage information

Also creates a repl. Location of repl socket is logged at start.

### metrics

The query proxy emits the following metrics:

* `norch.start`: `'pid': process.pid`
* `norch.latency`: `'value': latency`: on each request served, how long it took

## LICENCE

ISC.
