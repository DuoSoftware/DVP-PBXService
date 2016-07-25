var xmlBuilder = require('xmlbuilder');
var config = require('config');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var util = require('util');
var underscore = require('underscore');

var createNotFoundResponse = function()
{
    try
    {
        var doc = xmlBuilder.create('document');
        doc.att('type', 'freeswitch/xml')
            .ele('section').att('name', 'result')
            .ele('result').att('status', 'not found')
            .up()
            .up()
            .end({pretty: true});

        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\r\n" + doc.toString({pretty: true});
    }
    catch(ex)
    {
        return createNotFoundResponse();
    }

};

var createPBXStateChangeDialplan = function(reqId, context, destinationPattern, companyId, tenantId, dvpCallDirection)
{
    try
    {
        if (!destinationPattern)
        {
            destinationPattern = "";
        }

        if (!context)
        {
            context = "";
        }

        var doc = xmlBuilder.create('document');

        var cond = doc.att('type', 'freeswitch/xml')
            .ele('section').att('name', 'dialplan').att('description', 'RE Dial Plan For FreeSwitch')
            .ele('context').att('name', context)
            .ele('extension').att('name', 'test')
            .ele('condition').att('field', 'destination_number').att('expression', destinationPattern)


        cond.ele('action').att('application', 'set').att('data', 'DVP_ADVANCED_OP_ACTION=PABX_STATUS_CHANGE')
            .up()

        if(companyId)
        {
            cond.ele('action').att('application', 'set').att('data', 'companyid=' + companyId)
                .up()
        }
        if(tenantId)
        {
            cond.ele('action').att('application', 'set').att('data', 'tenantid=' + tenantId)
                .up()
        }

        if(dvpCallDirection)
        {
            cond.ele('action').att('application', 'set').att('data', 'DVP_CALL_DIRECTION=' + dvpCallDirection)
                .up()
        }

        cond.ele('action').att('application', 'speak').att('data', 'flite|kal|FreeSWITCH is awesome')
            .up()
            .ele('action').att('application', 'hangup')
            .up()

        cond.end({pretty: true});


        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\r\n" + doc.toString({pretty: true});

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.createPBXStateChangeDialplan] - [%s] - Exception occurred creating xml', reqId, ex);
        return createNotFoundResponse();
    }

};

var CreateVoicePortalDialplan = function(reqId, pbxUserInfo, context, destinationPattern, ignoreEarlyMedia, luaFile)
{
    try
    {
        if (!destinationPattern)
        {
            destinationPattern = "";
        }

        if (!context)
        {
            context = "";
        }

        var bypassMedia = "bypass_media=false";

        var ignoreEarlyM = "ignore_early_media=false";

        var pin = '';
        var userId = '';
        var templateId = '';
        var status = '';
        var action = '';
        var companyId = '';
        var tenantId = '';
        var voicemailStatus = 'false';
        var forwardBusyId = 'none';
        var forwardNoAnswerId = 'none';

        if(pbxUserInfo)
        {
            if(pbxUserInfo.Pin)
            {
                pin = pbxUserInfo.Pin;
            }
            if(pbxUserInfo.UserUuid)
            {
                userId = pbxUserInfo.UserUuid;
            }

            if(pbxUserInfo.VoicemailEnabled)
            {
                voicemailStatus = pbxUserInfo.VoicemailEnabled.toString();
            }

            if(pbxUserInfo.UserStatus)
            {
                status = pbxUserInfo.UserStatus;
            }

            if(pbxUserInfo.CompanyId)
            {
                companyId = pbxUserInfo.CompanyId.toString();
            }
            if(pbxUserInfo.TenantId)
            {
                tenantId = pbxUserInfo.TenantId.toString();
            }

            if(pbxUserInfo.AdvancedRouteMethod)
            {
                action = pbxUserInfo.AdvancedRouteMethod;
            }

            if(pbxUserInfo.Forwarding && pbxUserInfo.Forwarding.length > 0)
            {
                var fwdBusyRec = underscore.find(pbxUserInfo.Forwarding, function(fwd){ return fwd.DisconnectReason === 'BUSY'; });

                if(fwdBusyRec)
                {
                    forwardBusyId = fwdBusyRec.id.toString();
                }

                var fwdNoAnsRec = underscore.find(pbxUserInfo.Forwarding, function(fwd){ return fwd.DisconnectReason === 'NO_ANSWER'; });

                if(fwdNoAnsRec)
                {
                    forwardNoAnswerId = fwdNoAnsRec.id.toString();
                }
            }

            if(pbxUserInfo.PBXUserTemplate)
            {
                if (pbxUserInfo.PBXUserTemplate.id)
                {
                    templateId = pbxUserInfo.PBXUserTemplate.id.toString();
                }
            }

            if(pin && status && action && userId && companyId && tenantId)
            {
                var luaParams = util.format('%s \'%s\' \'%s\' \'%s\' \'%s\' \'%s\' \'%s\' \'%s\' \'%s\' \'%s\' \'%s\'', luaFile, companyId, tenantId, pin, userId, templateId, status, action, voicemailStatus, forwardBusyId, forwardNoAnswerId);

                var doc = xmlBuilder.create('document');

                doc.att('type', 'freeswitch/xml')
                    .ele('section').att('name', 'dialplan').att('description', 'RE Dial Plan For FreeSwitch')
                    .ele('context').att('name', context)
                    .ele('extension').att('name', 'test')
                    .ele('condition').att('field', 'destination_number').att('expression', destinationPattern)
                    .ele('action').att('application', 'set').att('data', 'continue_on_fail=true')
                    .up()
                    .ele('action').att('application', 'set').att('data', 'hangup_after_bridge=true')
                    .up()
                    .ele('action').att('application', 'set').att('data', ignoreEarlyM)
                    .up()
                    .ele('action').att('application', 'set').att('data', bypassMedia)
                    .up()
                    .ele('action').att('application', 'lua').att('data', luaParams)
                    .up()
                    .ele('action').att('application', 'hangup')
                    .up()
                    .up()
                    .up()
                    .up()
                    .up()

                    .end({pretty: true});


                return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\r\n" + doc.toString({pretty: true});
            }
            else
            {
                return createNotFoundResponse();
            }
        }
        else
        {
            return createNotFoundResponse();
        }

    }
    catch(ex)
    {
        logger.error('[DVP-DynamicConfigurationGenerator.CreateSendBusyMessageDialplan] - [%s] - Exception occurred creating xml', reqId, ex);
        return createNotFoundResponse();
    }

};

module.exports.createNotFoundResponse = createNotFoundResponse;
module.exports.CreateVoicePortalDialplan = CreateVoicePortalDialplan;
module.exports.createPBXStateChangeDialplan = createPBXStateChangeDialplan;