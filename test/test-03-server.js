/*global describe:true, it:true, before:true, after:true */

var
    demand = require('must'),
    bole   = require('bole'),
    path   = require('path'),
    rimraf = require('rimraf'),
    sinon  = require('sinon'),
    mocks  = require('./mocks'),
    Server = require('../lib/server.js');

function makeMockResponse()
{
    return {
        send: sinon.spy(),
        json: sinon.spy(),
        header: sinon.spy()
    };
}

function makeMockRequest()
{
    return {
        id:      function()
            { return 'test'; },
        getPath: function()
            { return '/test/path'; },
        logger:  bole('mock'),
    };
}

var goodConfig =
{
    name:    'test-1',
    metrics: new mocks.StubMetricsEmitter(),
    redis:   'http://localhost:6379',
    target:  'http://localhost:5011',
    index:   './test/testindex'
};

describe('restify server', function()
{
    var server;

    before(function(done)
    {
        server = new Server(goodConfig);
        done();
    });

    describe('constructor', function()
    {
        it('demands an options object', function(done)
        {
            function shouldThrow()
                { return new Server(); }
            shouldThrow.must.throw(/options/);
            done();
        });

        it('demands a name option', function(done)
        {
            function shouldThrow()
                { return new Server({}); }
            shouldThrow.must.throw(/name for this node/);
            done();
        });

        it('demands a metrics emitter option', function(done)
        {
            function shouldThrow()
                { return new Server({ name: 'foozle'}); }
            shouldThrow.must.throw(/metrics/);
            done();
        });

        it('can be constructed', function(done)
        {
            server.must.be.instanceof(Server);
            server.metrics.must.equal(goodConfig.metrics);
            server.must.have.property('server');
            server.server.must.be.an.object();
            done();
        });

        it('listen() calls listen on the underlying server', function(done)
        {
            var spy = sinon.spy(server.server, 'listen');
            server.listen(5555, 'localhost', function()
            {
                spy.calledWith(5555, 'localhost').must.be.true();
                server.server.listen.restore();
                done();
            });
        });
    });

    describe('POST /package', function()
    {
        it('is mounted', function(done)
        {
            server.must.have.property('handlePackagePost');
            server.handlePackagePost.must.be.a.function();
            server.server.routes.must.have.property('postpackage');
            done();
        });

        it('calls add() on the norch index', function(done)
        {
            var spy = sinon.spy(server.norch, 'add');
            var req = makeMockRequest();
            req.body = { id: 'testpkg' };

            server.handlePackagePost(req, makeMockResponse(), function()
            {
                spy.called.must.be.true();
                spy.restore();
                done();
            });
        });
    });

    describe('DELETE /package/:id', function()
    {
        it('is mounted', function(done)
        {
            server.must.have.property('handlePackageDelete');
            server.handlePackageDelete.must.be.a.function();
            server.server.routes.must.have.property('deletepackageid');
            done();
        });

        it('calls remove() on the norch index', function(done)
        {
            var spy = sinon.spy(server.norch, 'remove');
            var req = makeMockRequest();
            req.params = { id: 'testpkg' };

            server.handlePackageDelete(req, makeMockResponse(), function()
            {
                spy.called.must.be.true();
                spy.calledWith('testpkg').must.be.true();
                spy.restore();
                done();
            });
        });
    });

    describe('GET /matches/:prefix', function()
    {
        it('is mounted', function(done)
        {
            server.must.have.property('handleMatches');
            server.handleMatches.must.be.a.function();
            server.server.routes.must.have.property('getmatchesprefix');
            done();
        });

        it('calls matches() on the norch index', function(done)
        {
            var spy = sinon.spy(server.norch, 'matches');
            var req = makeMockRequest();
            req.params = { prefix: 'prefix' };

            server.handleMatches(req, makeMockResponse(), function()
            {
                spy.called.must.be.true();
                spy.calledWith('prefix').must.be.true();
                spy.restore();
                done();
            });
        });
    });

    describe('GET /search/:terms', function()
    {
        it('is mounted', function(done)
        {
            server.must.have.property('handleSearch');
            server.handleSearch.must.be.a.function();
            server.server.routes.must.have.property('getsearchterms');
            done();
        });

        it('calls search() on the norch index', function(done)
        {
            var spy = sinon.spy(server.norch, 'search');
            var req = makeMockRequest();
            req.params = { terms: encodeURIComponent('foo bar baz') };

            server.handleSearch(req, makeMockResponse(), function()
            {
                spy.called.must.be.true();
                spy.restore();
                done();
            });
        });
    });

    after(function(done)
    {
        server.close(function()
        {
            rimraf(goodConfig.index, done);
        });
    });
});
