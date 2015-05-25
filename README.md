# npm-scored-search AKA scorch

Three components:

1. A pluggable backend for [registry-follower](https://github.com/npm/registry-follower) that stores data in a sharded norch [search-index](https://github.com/fergiemcdowall/search-index) instead of elasticsearch.
2. An adapter for a norch [search-index](https://github.com/fergiemcdowall/search-index) that exposes a simplified npm-centric api for use by...
3. A restify server that exposes a query interface. This first searches by keywords using norch, then, if given an npm user, re-weights package scores using the package.json social graph.

![Coverage](http://img.shields.io/badge/coverage-86%25-yellow.svg?style=flat)
[![Travis](http://img.shields.io/travis/ceejbot/npm-scored-search.svg?style=flat)](https://travis-ci.org/ceejbot/npm-scored-search)

## Requirements

* write access to the norch search index path, with sufficient space
* probably redis for caching personalized scores (eventually)
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

Used by the server to wrap the search-index api in a convenient way.

## server

### API exposed

All endpoints expect and respond with json.

* `POST /package`: add a package to the search index; body must be json
* `DELETE /package:id`: remove a package from the search index
* `GET /matches/:prefix`: respond with an array of package names that start with the prefix
* `GET /search/:terms`: uri-encoded search term string is turned into a query; response is an array of packages that match somehow

### Configuration

```
Usage: scorch --name scorch-1 --listen localhost:5555 --redis http://localhost:
6379

Options:
  -n, --name     node name for metrics & logging             [default: "scorch"]
  -l, --listen   host:port pair to listen on         [default: "localhost:5757"]
  -r, --redis    host:port pair for redis     [default: "http://localhost:6379"]
  -i, --index    path for norch index file                    [default: "norch"]
  -m, --metrics  numbat metrics URI; optional
  --help         Show help                                             [boolean]
```

### monitoring hooks

TODO: open-source restify-monitor, which doesn't do much of anything special or sekrit. (It's now published as `@ceejbot/restify-monitor` as a temp hack.)

* `/_monitor/ping`: responds with 200 'pong' if up
* `/_monitor/status`: responds with 200 and a json object with PID & memory usage information

Also creates a repl. Location of repl socket is logged at start.

### metrics

The query proxy emits the following metrics:

* `scorch.start`: `'pid': process.pid`
* `scorch.latency`: `'value': latency`: on each request served, how long it took

## LICENCE

ISC.
