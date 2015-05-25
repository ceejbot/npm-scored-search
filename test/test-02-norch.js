/*global describe:true, it:true, before:true, after:true */

var
    demand = require('must'),
    path   = require('path'),
    rimraf = require('rimraf'),
    sinon  = require('sinon'),
    Norch  = require('../lib/norch');

describe('norch', function()
{
    var norch;
    var goodConfig =
    {
        index: './test/tmp'
    };

    before(function()
    {
        norch = new Norch(goodConfig);
    });

    describe('constructor', function()
    {
        it('demands an options object', function(done)
        {
            function shouldThrow()
                { return new Norch(); }
            shouldThrow.must.throw(/options/);
            done();
        });

        it('demands a index path option', function(done)
        {
            function shouldThrow()
                { return new Norch({}); }
            shouldThrow.must.throw(/index path/);
            done();
        });

        it('can be constructed', function(done)
        {
            norch.must.be.instanceof(Norch);
            norch.must.have.property('index');
            norch.index.must.be.an.object();
            done();
        });
    });

    describe('add()', function()
    {
        it('adds a document to the index', function(done)
        {
            var pkg =
            {
                id: '@npm/test',
                description: 'I am a boring package',
                readme: '# readme\nI am some markdown.\n',
                keywords: ['npm', 'package', 'boring'],
            };
            norch.add(pkg, function(err)
            {
                demand(err).be.falsy();
                norch.index.get(pkg.id, function(err, data)
                {
                    demand(err).be.falsy();
                    data.must.be.a.string();
                    done();
                });
            });
        });

        it('can add in batches', function(done)
        {
            var list =
            [
                {
                    id: 'lovebug',
                    description: 'I am a talking car',
                    readme: '# readme\nI am some markdown.\n',
                    keywords: ['car', 'beetle', 'herbie'],
                },
                {
                    id: 'loveboat',
                    description: 'exciting and new',
                    readme: '# readme\nI am some markdown.\n',
                    keywords: ['boat', 'new', 'exciting'],
                }

            ];
            norch.add(list, function(err)
            {
                demand(err).be.falsy();
                norch.index.get('lovebug', function(err, data)
                {
                    demand(err).be.falsy();
                    data.must.be.a.string();
                    done();
                });
            });

        });
    });

    describe('get()', function()
    {
        it('calls get() on the index', function(done)
        {
            var spy = sinon.spy(norch.index, 'get');

            norch.get('test', function(err, data)
            {
                spy.called.must.be.true();
                spy.calledWith('test').must.be.true();
                spy.restore();
                done();
            });
        });

        it('returns a parsed object', function(done)
        {
            norch.get('@npm/test', function(err, data)
            {
                demand(err).be.falsy();
                data.must.be.an.object();
                data.must.have.property('id');
                data.id.must.be.an.array();
                data.id[0].must.equal('@npm/test');
                done();
            });
        });
    });

    describe('matches()', function()
    {
        it('calls match() on the index', function(done)
        {
            var spy = sinon.spy(norch.index, 'match');

            norch.matches('@npm', function(err, matches)
            {
                demand(err).be.falsy();
                spy.called.must.be.true();
                spy.calledWith('@npm').must.be.true();
                spy.restore();
                done();
            });
        });

        it('responds with an array of ids', function(done)
        {
            norch.matches('love', function(err, matches)
            {
                demand(err).be.falsy();
                matches.must.be.an.array();
                matches.length.must.equal(2);
                matches[0].must.equal('loveboat');
                done();
            });
        });
    });

    describe('search()', function()
    {
        it('has tests');
    });

    describe('remove()', function()
    {
        it('calls del() on the index', function(done)
        {
            var spy = sinon.spy(norch.index, 'del');

            norch.remove('@npm/test', function(err)
            {
                demand(err).be.falsy();
                spy.called.must.be.true();
                spy.calledWith('@npm/test').must.be.true();
                spy.restore();
                done();
            });
        });

        it('removes the object', function(done)
        {
            norch.get('@npm/test', function(err, data)
            {
                demand(err).not.exist();
                demand(data).not.exist();
                done();
            });
        });
    });

    after(function(done)
    {
        rimraf(goodConfig.index, done);
    });
});
