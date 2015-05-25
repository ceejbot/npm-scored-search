/*global describe:true, it:true, before:true, after:true */

var
    demand  = require('must'),
    rimraf  = require('rimraf'),
    sinon   = require('sinon'),
    mocks   = require('./mocks'),
    Backend = require('../lib/npm2norch'),
    Server  = require('../lib/server');

var packageDoc = require('./fixtures/scurry.json');

describe('follower backend', function()
{
    var server;
    var goodOpts =
    {
        target: 'http://localhost:5555'
    };

    before(function(done)
    {
        var goodConfig =
        {
            name:    'test-1',
            metrics: new mocks.StubMetricsEmitter(),
            redis:   'http://localhost:6379',
            index:   './test/backend'
        };
        server = new Server(goodConfig);
        server.listen(5555, 'localhost', done);
    });

    describe('constructor', function()
    {
        it('can be constructed', function()
        {
            var backend = new Backend(goodOpts);
            backend.must.be.instanceof(Backend);
        });

        it('must implement the two methods of a working backend', function()
        {
            var backend = new Backend(goodOpts);

            backend.must.have.property('handlePublish');
            backend.handlePublish.must.be.a.function();
            backend.must.have.property('handleUnpublish');
            backend.handleUnpublish.must.be.a.function();
        });

        it('creates two async queues', function()
        {
            var backend = new Backend(goodOpts);

            backend.must.have.property('changeQueue');
            backend.must.have.property('deleteQueue');
        });
    });

    describe('handlePublish()', function()
    {
        it('enqueues a change task', function(done)
        {
            var backend = new Backend(goodOpts);
            backend.changeQueue = new mocks.MockQueue();

            var cb = function()
            {
                backend.changeQueue.push.calledOnce.must.be.true();
                backend.changeQueue.push.calledWith({ change: {id: 'yes'}, doc: 'doc'}).must.be.true();
                done();
            };

            backend.handlePublish({ id: 'yes'}, 'doc', cb);
        });
    });

    describe('fetchDownloadCounts()', function()
    {
        it('fetches the, you know, download counts', function(done)
        {
            var backend = new Backend(goodOpts);

            backend.fetchDownloadCounts('express', 'month', function(err, result)
            {
                demand(err).not.exist();
                result.must.be.a.number();
                result.must.be.above(0);
                done();
            });
        });

        it('is called by handleChange()', function(done)
        {
            this.timeout(7000);
            var backend = new Backend(goodOpts);
            var spy = sinon.spy(backend, 'fetchDownloadCounts');

            var task =
            {
                change: { id: 'scurry'},
                doc: packageDoc
            };
            backend.handleChange(task, function(err, result)
            {
                demand(err).not.exist();
                spy.called.must.be.true();

                result.must.be.an.object();
                result.must.have.property('dlScore');
                result.dlScore.must.be.a.number();
                result.must.have.property('dlWeek');
                result.dlWeek.must.be.a.number();

                spy.restore();
                done();
            });
        });
    });

    describe('handleChange()', function()
    {
        it('has tests');

        it('sets dl counts to 0 when the downloads API fails', function(done)
        {
            var backend = new Backend(goodOpts);
            var task =
            {
                change: { id: 'no-dls'},
                doc: { name: 'no-dls'}
            };
            backend.handleChange(task, function(err, result)
            {
                demand(err).not.exist();
                result.must.have.property('dlScore');
                result.dlScore.must.be.a.number();
                result.dlScore.must.equal(0);
                result.must.have.property('dlWeek');
                result.dlWeek.must.equal(0);
                done();
            });
        });

    });

    describe('handleUnpublish()', function()
    {
        it('has tests');
    });

    describe('handleDelete()', function()
    {
        it('enqueues a delete task', function(done)
        {
            var backend = new Backend(goodOpts);
            backend.deleteQueue = new mocks.MockQueue();

            var cb = function(err, task)
            {
                demand(err).not.exist();
                task.must.be.a.string();
                task.must.equal('goodbyeworld');
                backend.deleteQueue.push.calledOnce.must.be.true();
                backend.deleteQueue.push.calledWith('goodbyeworld').must.be.true();
                done();
            };

            backend.handleUnpublish('goodbyeworld', cb);
        });
    });

    after(function(done)
    {
        server.close(function()
        {
            rimraf('./test/backend', done);
        });
    });
});
