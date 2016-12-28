/**
 * Created by dinusha on 8/8/2016.
 */


var pbxBackendHandler;
var config = require('config');

var useCache = config.UseCache;

if(useCache)
{
    pbxBackendHandler = require('./PbxCacheObjHandler.js');
}
else
{
    pbxBackendHandler = require('./PbxBackendHandler.js');
}

var changeBackendHandler = function(mode)
{
    if(mode === 'DB')
    {
        pbxBackendHandler = require('./PbxBackendHandler.js');
    }
    else if(mode === 'CACHE')
    {
        pbxBackendHandler = require('./PbxCacheObjHandler.js');
    }

};

var getBackendHandler = function()
{
    return pbxBackendHandler;
};


module.exports.changeBackendHandler = changeBackendHandler;
module.exports.getBackendHandler = getBackendHandler;
