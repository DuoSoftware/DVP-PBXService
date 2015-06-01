var xmlBuilder = require('xmlbuilder');
var config = require('config');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;
var util = require('util');

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

var CreateSendBusyMessageDialplan = function(reqId, destinationPattern, context)
{
    try
    {
        if (!destinationPattern) {
            destinationPattern = "";
        }

        if (!context) {
            context = "";
        }

        //var httpUrl = Config.Services.HttApiUrl;

        var doc = xmlBuilder.create('document');

        doc.att('type', 'freeswitch/xml')
            .ele('section').att('name', 'dialplan').att('description', 'RE Dial Plan For FreeSwitch')
            .ele('context').att('name', context)
            .ele('extension').att('name', 'test')
            .ele('condition').att('field', 'destination_number').att('expression', destinationPattern)
            .ele('action').att('application', 'answer')
            .up()
            .ele('action').att('application', 'hangup').att('data', 'USER_BUSY')
            .up()
            .up()
            .up()
            .up()
            .up()

            .end({pretty: true});


        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\r\n" + doc.toString({pretty: true});


    }
    catch(ex)
    {
        logger.error('[DVP-DynamicConfigurationGenerator.CreateSendBusyMessageDialplan] - [%s] - Exception occurred creating xml', reqId, ex);
        return createNotFoundResponse();
    }

};

var CreateRouteUserDialplan = function(reqId, extention, context, profile, destinationPattern, legTimeout, legStartDelay, origination, destination, domain, isVoicemailEnabled, group, bypassMed, ignoreEarlyMedia, originationCallerIdNumber)
{
    try
    {
        if (!destinationPattern) {
            destinationPattern = "";
        }

        if (!context) {
            context = "";
        }

        var bypassMedia = "bypass_media=true";
        if (!bypassMed)
        {
            bypassMedia = "bypass_media=false";
        }

        var ignoreEarlyM = "ignore_early_media=false";
        if (ignoreEarlyMedia)
        {
            ignoreEarlyM = "ignore_early_media=true";
        }

        var option = '';

        if (legStartDelay > 0)
            option = util.format('[leg_delay_start=%d,leg_timeout=%d,origination_caller_id_name=%s,origination_caller_id_number=%s]', legStartDelay, legTimeout, origination, originationCallerIdNumber);
        else
            option = util.format('[leg_timeout=%d,origination_caller_id_name=%s,origination_caller_id_number=%s]', legTimeout, origination, originationCallerIdNumber);

        //var httpUrl = Config.Services.HttApiUrl;

        var dnis = destination;

        if (domain)
        {
            dnis = util.format('%s@%s', dnis, domain);
        }
        var protocol = 'sofia';
        var destinationGroup = 'user';

        var calling = util.format('%s%s/%s/%s', option, protocol, destinationGroup, dnis);

        if (group)
        {
            calling = util.format("%s,pickup/%s", calling, group);
        }

        if(isVoicemailEnabled)
        {
            var doc = xmlBuilder.create('document');

            doc.att('type', 'freeswitch/xml')
                .ele('section').att('name', 'dialplan').att('description', 'RE Dial Plan For FreeSwitch')
                .ele('context').att('name', context)
                .ele('extension').att('name', 'test')
                .ele('condition').att('field', 'destination_number').att('expression', destinationPattern)
                .ele('action').att('application', 'set').att('data', 'ringback=${us-ring}')
                .up()
                .ele('action').att('application', 'set').att('data', 'continue_on_fail=true')
                .up()
                .ele('action').att('application', 'set').att('data', 'hangup_after_bridge=true')
                .up()
                .ele('action').att('application', 'set').att('data', ignoreEarlyM)
                .up()
                .ele('action').att('application', 'set').att('data', bypassMedia)
                .up()
                .ele('action').att('application', 'bind_meta_app').att('data', '3 ab s execute_extension::att_xfer XML PBXFeatures')
                .up()
                .ele('action').att('application', 'bind_meta_app').att('data', '4 ab s execute_extension::att_xfer_group XML PBXFeatures')
                .up()
                .ele('action').att('application', 'bind_meta_app').att('data', '6 ab s execute_extension::att_xfer_outbound XML PBXFeatures')
                .up()
                .ele('action').att('application', 'bind_meta_app').att('data', '5 ab s execute_extension::att_xfer_conference XML PBXFeatures')
                .up()
                .ele('action').att('application', 'bridge').att('data', calling)
                .up()
                .ele('action').att('application', 'answer')
                .up()
                .ele('action').att('application', 'voicemail').att('data', 'default %s %s', domain, extention)
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
            var doc = xmlBuilder.create('document');

            doc.att('type', 'freeswitch/xml')
                .ele('section').att('name', 'dialplan').att('description', 'RE Dial Plan For FreeSwitch')
                .ele('context').att('name', context)
                .ele('extension').att('name', 'test')
                .ele('condition').att('field', 'destination_number').att('expression', destinationPattern)
                .ele('action').att('application', 'set').att('data', 'ringback=${us-ring}')
                .up()
                .ele('action').att('application', 'set').att('data', 'continue_on_fail=true')
                .up()
                .ele('action').att('application', 'set').att('data', 'hangup_after_bridge=true')
                .up()
                .ele('action').att('application', 'set').att('data', ignoreEarlyM)
                .up()
                .ele('action').att('application', 'set').att('data', bypassMedia)
                .up()
                .ele('action').att('application', 'bind_meta_app').att('data', '3 ab s execute_extension::att_xfer XML PBXFeatures')
                .up()
                .ele('action').att('application', 'bind_meta_app').att('data', '4 ab s execute_extension::att_xfer_group XML PBXFeatures')
                .up()
                .ele('action').att('application', 'bind_meta_app').att('data', '6 ab s execute_extension::att_xfer_outbound XML PBXFeatures')
                .up()
                .ele('action').att('application', 'bind_meta_app').att('data', '5 ab s execute_extension::att_xfer_conference XML PBXFeatures')
                .up()
                .ele('action').att('application', 'bridge').att('data', calling)
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

    }
    catch(ex)
    {
        logger.error('[DVP-DynamicConfigurationGenerator.CreateSendBusyMessageDialplan] - [%s] - Exception occurred creating xml', reqId, ex);
        return createNotFoundResponse();
    }

};

module.exports.createNotFoundResponse = createNotFoundResponse;
module.exports.CreateSendBusyMessageDialplan = CreateSendBusyMessageDialplan;
module.exports.CreateRouteUserDialplan = CreateRouteUserDialplan;