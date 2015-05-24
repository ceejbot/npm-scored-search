/*global describe:true, it:true, before:true, after:true */

var
    demand = require('must'),
    path   = require('path'),
    Scorched = require('../index');

describe('exports', function()
{
    it('exports a query server constructor', function()
    {
        Scorched.must.have.property('Server');
        Scorched.Server.must.be.a.function();
    });

    it('exports a registry-follower backend constructor', function()
    {
        Scorched.must.have.property('Indexer');
        Scorched.Indexer.must.be.a.function();
    });

    it('exports a norch search-index adapter', function()
    {
        Scorched.must.have.property('Norch');
        Scorched.Norch.must.be.a.function();
    });
});
