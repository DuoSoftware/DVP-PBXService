var redis = require("redis");
var Config = require('config');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;

var redisIp = Config.Redis.IpAddress;
var redisPort = Config.Redis.Port;

var client = redis.createClient(redisPort, redisIp);


var SetObjectWithExpire = function(key, value, timeout, callback)
{
    try
    {
        client.setex(key, timeout, value, function(err, response)
        {
            if(err)
            {
                logger.error('[DVP-DynamicConfigurationGenerator.SetObjectWithExpire] - REDIS ERROR', err)
            }
            else
            {
                logger.error('[DVP-DynamicConfigurationGenerator.SetObjectWithExpire] - REDIS SUCCESS', err)
            }
            callback(err, response);
        });

    }
    catch(ex)
    {
        callback(ex, undefined);
    }

};

var GetObject = function(reqId, key, callback)
{
    try
    {
        logger.debug('[DVP-DynamicConfigurationGenerator.GetObject] - [%s] - Method Params - key : %s', reqId, key);

        var start = new Date().getTime();
        client.get(key, function(err, response)
        {
            var end = new Date().getTime();
            var time = end - start;

            console.log("Redis Time : " + time);
            if(err)
            {
                logger.error('[DVP-DynamicConfigurationGenerator.GetObject] - [%s] - REDIS GET failed', reqId, err);
            }
            else
            {
                logger.debug('[DVP-DynamicConfigurationGenerator.GetObject] - [%s] - REDIS GET success', reqId);
            }

            callback(err, JSON.parse(response));
        });

    }
    catch(ex)
    {
        logger.error('[DVP-DynamicConfigurationGenerator.GetObject] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }
};

var SetObject = function(key, value, callback)
{
    try
    {
        client.set(key, value, function(err, response)
        {
            if(err)
            {
                logger.error('[DVP-DynamicConfigurationGenerator.SetObjectWithExpire] - REDIS ERROR', err)
            }
            else
            {
                logger.error('[DVP-DynamicConfigurationGenerator.SetObjectWithExpire] - REDIS SUCCESS', err)
            }
            callback(err, response);
        });

    }
    catch(ex)
    {
        callback(ex, undefined);
    }

};

var PublishToRedis = function(pattern, message, callback)
{
    try
    {
        if(client.connected)
        {
            var result = client.publish(pattern, message);
            logger.debug('[DVP-DynamicConfigurationGenerator.SetObjectWithExpire] - REDIS SUCCESS');
            callback(undefined, true);
        }
        else
        {
            callback(new Error('REDIS CLIENT DISCONNECTED'), false);
        }


    }
    catch(ex)
    {
        callback(ex, undefined);
    }
}

var GetFromSet = function(setName, callback)
{
    try
    {
        if(client.connected)
        {
            client.smembers(setName).keys("*", function (err, setValues)
            {
                if(err)
                {
                    logger.error('[DVP-DynamicConfigurationGenerator.SetObjectWithExpire] - REDIS ERROR', err)
                }
                else
                {
                    logger.debug('[DVP-DynamicConfigurationGenerator.SetObjectWithExpire] - REDIS SUCCESS')
                }
                callback(err, setValues);
            });
        }
        else
        {
            callback(new Error('REDIS CLIENT DISCONNECTED'), undefined);
        }


    }
    catch(ex)
    {
        callback(ex, undefined);
    }
};

client.on('error', function(msg)
{

});

module.exports.SetObject = SetObject;
module.exports.PublishToRedis = PublishToRedis;
module.exports.GetFromSet = GetFromSet;
module.exports.SetObjectWithExpire = SetObjectWithExpire;
module.exports.GetObject = GetObject;