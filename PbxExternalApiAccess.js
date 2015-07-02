var httpReq = require('request');
var config = require('config');
var util = require('util');
var stringify = require('stringify');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;

var RemoteGetSipUserDetailsForUuid = function(reqId, sipUserUuid, securityToken, callback)
{
    try
    {
        logger.debug('[DVP-PBXService.RemoteGetSipUserDetailsForUuid] - [%s] -  Trying to get Sip User Details From Api - Params - sipUserUuid : %s', reqId, sipUserUuid);
        var sipUACIp = config.Services.SipUACApi.Ip;
        var sipUACPort = config.Services.SipUACApi.Port;
        var apiVersion = config.Services.SipUACApi.Version;

        if(sipUACIp && sipUACPort && apiVersion)
        {
            var httpUrl = util.format('http://%s:%d/DVP/%s/UACManagement/SipUserByUuid/%s', sipUACIp, sipUACPort, apiVersion, sipUserUuid);

            var options = {
                url: httpUrl,
                headers: {
                    'authorization': securityToken
                }
            };

            logger.debug('[DVP-PBXService.RemoteGetSipUserDetailsForUuid] - [%s] - Creating Api Url : %s', reqId, httpUrl);


            httpReq(options, function (error, response, body)
            {
                if (!error && response.statusCode == 200)
                {
                    var apiResp = JSON.parse(body);

                    logger.debug('[DVP-PBXService.RemoteGetSipUserDetailsForUuid] - [%s] - Sip UAC Api returned : %s', reqId, body);

                    callback(apiResp.Exception, apiResp.Result);
                }
                else
                {
                    logger.error('[DVP-PBXService.RemoteGetSipUserDetailsForUuid] - [%s] - Sip UAC Api call failed', reqId, error);
                    callback(error, undefined);
                }
            })
        }
        else
        {
            logger.error('[DVP-PBXService.RemoteGetSipUserDetailsForUuid] - [%s] - Sip uac service ip, port or version not set', reqId);
            callback(new Error('Sip uac service ip, port or version not set'), undefined)
        }
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.RemoteGetSipUserDetailsForUuid] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }
};

var RemoteGetSipUserDetailsForExtension = function(reqId, extension, securityToken, callback)
{
    try
    {
        logger.debug('[DVP-PBXService.RemoteGetSipUserDetailsForExtension] - [%s] -  Trying to get Sip User Details From Api - Params - extension : %s', reqId, extension);
        var sipUACIp = config.Services.SipUACApi.Ip;
        var sipUACPort = config.Services.SipUACApi.Port;
        var apiVersion = config.Services.SipUACApi.Version;

        if(sipUACIp && sipUACPort && apiVersion)
        {
            var httpUrl = util.format('http://%s:%d/DVP/API/%s/ExtensionManagement/FullExtensionDetails/%s', sipUACIp, sipUACPort, apiVersion, extension);

            var options = {
                url: httpUrl,
                headers: {
                    'authorization': securityToken
                }
            };

            logger.debug('[DVP-PBXService.RemoteGetSipUserDetailsForExtension] - [%s] - Creating Api Url : %s', reqId, httpUrl);


            httpReq(options, function (error, response, body)
            {
                if (!error && response.statusCode == 200)
                {
                    var apiResp = JSON.parse(body);

                    logger.debug('[DVP-PBXService.RemoteGetSipUserDetailsForExtension] - [%s] - Sip UAC Api returned : %s', reqId, body);

                    callback(apiResp.Exception, apiResp.Result);
                }
                else
                {
                    logger.error('[DVP-PBXService.RemoteGetSipUserDetailsForExtension] - [%s] - Sip UAC Api call failed', reqId, error);
                    callback(error, undefined);
                }
            })
        }
        else
        {
            logger.error('[DVP-PBXService.RemoteGetSipUserDetailsForExtension] - [%s] - Sip uac service ip, port or version not set', reqId);
            callback(new Error('Sip uac service ip, port or version not set'), undefined)
        }
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.RemoteGetSipUserDetailsForExtension] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }
};


var RemoteGetFileMetadata = function(reqId, uuid, securityToken, callback)
{
    try
    {
        logger.debug('[DVP-PBXService.RemoteGetFileMetadata] - [%s] -  Trying to get file meta data from api - Params - uuid : %s', reqId, uuid);

        var fileApiIp = config.Services.FileService.Ip;
        var fileApiPort = config.Services.FileService.Port;
        var fileApiVersion = config.Services.FileService.Version;

        if(fileApiIp && fileApiPort && fileApiVersion)
        {
            var httpUrl = util.format('http://%s:%d/DVP/API/%s/FIleService/FileHandler/AttachmentMetaData/%s', fileApiIp, fileApiPort, fileApiVersion, uuid);

            var options = {
                url: httpUrl,
                headers: {
                    'authorization': securityToken
                }
            };

            logger.debug('[DVP-PBXService.RemoteGetFileMetadata] - [%s] - Creating Api Url : %s', reqId, httpUrl);


            httpReq(options, function (error, response, body)
            {
                if (!error && response.statusCode == 200)
                {
                    var apiResp = JSON.parse(body);

                    logger.debug('[DVP-PBXService.RemoteGetFileMetadata] - [%s] - file service returned : %s', reqId, body);

                    callback(apiResp.Exception, apiResp.Result);
                }
                else
                {
                    logger.error('[DVP-PBXService.RemoteGetFileMetadata] - [%s] - file service call failed', reqId, error);
                    callback(error, undefined);
                }
            })
        }
        else
        {
            logger.error('[DVP-PBXService.RemoteGetSipUserDetailsForExtension] - [%s] - Sip uac service ip, port or version not set', reqId);
            callback(new Error('Sip uac service ip, port or version not set'), undefined)
        }
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.RemoteGetSipUserDetailsForExtension] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }
}

module.exports.RemoteGetSipUserDetailsForUuid = RemoteGetSipUserDetailsForUuid;
module.exports.RemoteGetSipUserDetailsForExtension =RemoteGetSipUserDetailsForExtension;
module.exports.RemoteGetFileMetadata = RemoteGetFileMetadata;