var restify = require('restify');
var nodeUuid = require('node-uuid');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var config = require('config');
var pbxBackendHandler = require('./PbxBackendHandler.js');
var dbModel = require('dvp-dbmodels');
var extApi = require('./PbxExternalApiAccess.js');
var underscore = require('underscore');
var xmlBuilder = require('./XmlDialplanBuilder.js');
var moment = require('moment');

var hostIp = config.Host.Ip;
var hostPort = config.Host.Port;
var hostVersion = config.Host.Version;

var server = restify.createServer({
    name: 'localhost',
    version: '1.0.0'
});

restify.CORS.ALLOW_HEADERS.push('authorization');
server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());


var FeatureCodeHandler = function(reqId, dnis, companyId, tenantId, callback)
{
    try
    {
        var firstCharacter = dnis.charAt(0);

        if(firstCharacter === '*')
        {
            //process feature codes
            var splitArr = dnis.split('*', 2);

            pbxBackendHandler.GetFeatureCodesForCompanyDB(reqId, companyId, tenantId, function(err, fc)
            {
                if(fc)
                {

                    var op = undefined;
                    var number = undefined;

                    if(fc.Barge)
                    {
                        var regEx = '^' + fc.Barge + '[^\s]*';
                        var dnisRegExPattern = new RegExp(regEx);

                        if(dnisRegExPattern.test(splitArr[1]))
                        {
                            number = splitArr[1].replace(fc.Barge, '');
                            op = 'BARGE';
                        }

                    }
                    if(fc.Intercept)
                    {
                        var regEx = '^' + fc.Intercept + '[^\s]*';
                        var dnisRegExPattern = new RegExp(regEx);

                        if(dnisRegExPattern.test(splitArr[1]))
                        {
                            number = splitArr[1].replace(fc.Intercept, '');
                            op = 'INTERCEPT';
                        }

                    }
                    if(fc.Park)
                    {
                        var regEx = '^' + fc.Park + '[^\s]*';
                        var dnisRegExPattern = new RegExp(regEx);

                        if(dnisRegExPattern.test(splitArr[1]))
                        {
                            number = splitArr[1].replace(fc.Park, '');
                            op = 'PARK';
                        }

                    }

                    if(fc.VoiceMail)
                    {
                        var regEx = '^' + fc.VoiceMail + '[^\s]*';
                        var dnisRegExPattern = new RegExp(regEx);

                        if(dnisRegExPattern.test(splitArr[1]))
                        {
                            number = splitArr[1].replace(fc.VoiceMail, '');
                            op = 'VOICEMAIL';
                        }

                    }

                    if(fc.PickUp)
                    {
                        var regEx = '^' + fc.PickUp + '[^\s]*';
                        var dnisRegExPattern = new RegExp(regEx);

                        if(dnisRegExPattern.test(splitArr[1]))
                        {
                            number = splitArr[1].replace(fc.PickUp, '');
                            op = 'PICKUP';
                        }

                    }

                    callback(undefined, op, number);

                }
                else
                {
                    callback(undefined, undefined, undefined);
                }
            })

        }
        else
        {
            callback(undefined, undefined, undefined);
        }
    }
    catch(ex)
    {
        callback(ex, undefined, undefined);
    }
};

server.post('/DVP/API/:version/PBXService/GeneratePBXConfig', function(req, res, next)
{
    var pbxUserConf = {};
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        var ani = reqBody.ANI;
        var dnis = reqBody.DNIS;
        var context = reqBody.Context;
        var direction = reqBody.Direction;
        var extraData = reqBody.ExtraData;
        var companyId = 1;
        var tenantId = 1;
        var userUuid = '';
        var fromUserUuid = '';
        var opType = undefined;
        var extExtraData = undefined;

        if(extraData)
        {
            userUuid = extraData['UserUuid'];
            fromUserUuid = extraData['FromUserUuid'];
            opType = extraData['OperationType'];
            extExtraData = extraData['ExtExtraData'];
        }


        if(direction === 'IN')
        {
            //try getting user for did


                    pbxBackendHandler.GetAllPbxUserDetailsByIdDB(reqId, userUuid, companyId, tenantId, function(err, pbxDetails)
                    {
                        if(err || !pbxDetails)
                        {
                            pbxUserConf = null;
                            var jsonResponse = JSON.stringify(pbxUserConf);
                            logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                            res.end(jsonResponse);
                        }
                        else
                        {

                                var usrStatus = pbxDetails.UserStatus;
                                var advancedMethod = pbxDetails.AdvancedRouteMethod;
                                var voicemailEnabled = pbxDetails.VoicemailEnabled;
                                var bypassMedia = pbxDetails.BypassMedia;

                            if(pbxDetails.PersonalGreetingEnabled && pbxDetails.TimeZone)
                            {
                                var utcTime = new Date().toISOString();
                                var localTime = moment(utcTime).utcOffset(pbxDetails.TimeZone);
                                var hours = localTime.hour();

                                hours = (hours+24-2)%24;

                                if(hours>12)
                                {
                                    pbxUserConf.PersonalGreeting = pbxDetails.NightGreetingFile;
                                }
                                else
                                {
                                    pbxUserConf.PersonalGreeting = pbxDetails.DayGreetingFile;
                                }

                            }

                                if(usrStatus === 'DND')
                                {
                                    //xml DND response
                                    pbxUserConf.OperationType = 'DND';
                                    pbxUserConf.UserRefId = userUuid;
                                    var jsonResponse = JSON.stringify(pbxUserConf);
                                    logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                    res.end(jsonResponse);
                                }
                                else if(usrStatus === 'AVAILABLE')
                                {
                                    //normal user xml

                                    if(advancedMethod === 'FOLLOW_ME')
                                    {
                                        pbxBackendHandler.GetFollowMeByUserDB(reqId, userUuid, companyId, tenantId, function(err, fmList)
                                        {
                                            if(err)
                                            {
                                                var jsonResponse = JSON.stringify(pbxUserConf);
                                                logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                                res.end(jsonResponse);
                                            }
                                            else
                                            {
                                                var tempEpList = [];
                                                fmList.forEach(function(fmRec)
                                                {
                                                    var tempEp =
                                                    {
                                                        DestinationNumber: fmRec.DestinationNumber,
                                                        RingTimeout: fmRec.RingTimeout,
                                                        Priority: fmRec.Priority,
                                                        ObjClass: fmRec.ObjClass,
                                                        ObjType: fmRec.ObjType,
                                                        ObjCategory: fmRec.ObjCategory
                                                    };


                                                    tempEp.BypassMedia = false;
                                                    if(fmRec.ObjCategory === 'PBXUSER' && fmRec.DestinationUser)
                                                    {
                                                        if(fmRec.DestinationUser.BypassMedia)
                                                        {
                                                            tempEp.BypassMedia = fmRec.DestinationUser.BypassMedia;
                                                        }
                                                    }

                                                    tempEpList.push(tempEp);

                                                });
                                                //Get follow me config and create xml
                                                pbxUserConf.OperationType = 'FOLLOW_ME';
                                                pbxUserConf.UserRefId = userUuid;
                                                pbxUserConf.Endpoints = tempEpList;
                                                pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                                pbxUserConf.BypassMedia = bypassMedia;

                                                var jsonResponse = JSON.stringify(pbxUserConf);
                                                logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                                res.end(jsonResponse);
                                            }

                                        });

                                    }
                                    else if(advancedMethod === 'FORWARD')
                                    {
                                        pbxBackendHandler.GetForwardingByUserDB(reqId, userUuid, companyId, tenantId, function(err, fwdList)
                                        {
                                            if(err)
                                            {
                                                var jsonResponse = JSON.stringify(pbxUserConf);
                                                logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                                res.end(jsonResponse);
                                            }
                                            else
                                            {
                                                var tempEpList = [];
                                                fwdList.forEach(function(fwdRec)
                                                {
                                                    var tempEp =
                                                    {
                                                        DestinationNumber: fwdRec.DestinationNumber,
                                                        RingTimeout: fwdRec.RingTimeout,
                                                        DisconnectReason: fwdRec.DisconnectReason,
                                                        ObjClass: fwdRec.ObjClass,
                                                        ObjType: fwdRec.ObjType,
                                                        ObjCategory: fwdRec.ObjCategory
                                                    };


                                                    tempEp.BypassMedia = false;
                                                    if(fwdRec.ObjCategory === 'PBXUSER' && fwdRec.DestinationUser)
                                                    {
                                                        if(fwdRec.DestinationUser.BypassMedia)
                                                        {
                                                            tempEp.BypassMedia = fwdRec.DestinationUser.BypassMedia;
                                                        }
                                                    }

                                                    tempEpList.push(tempEp);

                                                });
                                                //Get follow me config and create xml

                                                pbxUserConf.OperationType = 'FORWARD';
                                                pbxUserConf.UserRefId = userUuid;
                                                pbxUserConf.Endpoints = tempEpList;
                                                pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                                pbxUserConf.BypassMedia = bypassMedia;

                                                if(pbxDetails.PersonalGreetingEnabled && pbxDetails.TimeZone)
                                                {
                                                    var utcTime = new Date().toISOString();
                                                    var localTime = moment(utcTime).utcOffset(pbxDetails.TimeZone);
                                                    var hours = localTime.hour();

                                                    hours = (hours+24-2)%24;

                                                    if(hours>12)
                                                    {
                                                        pbxUserConf.PersonalGreeting = pbxDetails.NightGreetingFile;
                                                    }
                                                    else
                                                    {
                                                        pbxUserConf.PersonalGreeting = pbxDetails.DayGreetingFile;
                                                    }

                                                }

                                                var jsonResponse = JSON.stringify(pbxUserConf);
                                                logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                                res.end(jsonResponse);

                                            }
                                        });

                                    }
                                    else
                                    {
                                        pbxUserConf.OperationType = 'USER_DIAL';
                                        pbxUserConf.UserRefId = userUuid;
                                        pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                        pbxUserConf.BypassMedia = bypassMedia;
                                        pbxUserConf.RingTimeout = pbxDetails.RingTimeout;

                                        var jsonResponse = JSON.stringify(pbxUserConf);
                                        logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                        res.end(jsonResponse);
                                    }
                                }
                                else if(usrStatus === 'CALL_DIVERT')
                                {
                                    if(pbxDetails.PBXUserTemplate)
                                    {
                                        var endp =
                                        {
                                            DestinationNumber: pbxDetails.PBXUserTemplate.CallDivertNumber,
                                            ObjCategory: pbxDetails.PBXUserTemplate.ObjCategory
                                        };

                                        pbxUserConf.OperationType = 'CALL_DIVERT';
                                        pbxUserConf.Endpoints = endp;
                                        pbxUserConf.UserRefId = userUuid;
                                        pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                        pbxUserConf.BypassMedia = bypassMedia;
                                        pbxUserConf.RingTimeout = 60;

                                        if(pbxDetails.PBXUserTemplate.ObjCategory === 'PBXUSER' && pbxDetails.PBXUserTemplate.DestinationUser)
                                        {
                                            pbxBackendHandler.GetPbxUserByIdDB(reqId, pbxDetails.PBXUserTemplate.DestinationUser, 1, 1, function(err, pbxUserObj)
                                            {
                                                if(err)
                                                {
                                                    var jsonResponse = JSON.stringify(pbxUserConf);
                                                    logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                                    res.end(jsonResponse);
                                                }
                                                else if(pbxUserObj)
                                                {

                                                    endp.BypassMedia = pbxUserObj.BypassMedia;
                                                    endp.VoicemailEnabled = pbxUserObj.VoicemailEnabled;
                                                    var jsonResponse = JSON.stringify(pbxUserConf);
                                                    logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                                    res.end(jsonResponse);
                                                }
                                                else
                                                {
                                                    var jsonResponse = JSON.stringify(pbxUserConf);
                                                    logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                                    res.end(jsonResponse);
                                                }
                                            })
                                        }
                                        else
                                        {
                                            var jsonResponse = JSON.stringify(pbxUserConf);
                                            logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                            res.end(jsonResponse);
                                        }


                                    }
                                    else
                                    {
                                        pbxUserConf = null;
                                        var jsonResponse = JSON.stringify(pbxUserConf);
                                        logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                        res.end(jsonResponse);

                                    }


                                    //pick outbound rule and create outbound gateway xml

                                }
                                else
                                {
                                    pbxUserConf.OperationType = 'USER_DIAL';
                                    pbxUserConf.UserRefId = userUuid;
                                    pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                    pbxUserConf.BypassMedia = bypassMedia;
                                    pbxUserConf.RingTimeout = pbxDetails.RingTimeout;

                                    var jsonResponse = JSON.stringify(pbxUserConf);
                                    logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                    res.end(jsonResponse);
                                }


                        }
                    })
        }
        else
        {
            if(userUuid)
            {
                pbxBackendHandler.GetAllPbxUserDetailsByIdDB(reqId, userUuid, companyId, tenantId, function(err, pbxDetails)
                {
                    if(err || !pbxDetails)
                    {
                        pbxUserConf = null;
                        var jsonResponse = JSON.stringify(pbxUserConf);
                        logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                        res.end(jsonResponse);
                    }
                    else
                    {
                        var usrStatus = pbxDetails.UserStatus;
                        var advancedMethod = pbxDetails.AdvancedRouteMethod;
                        var voicemailEnabled = pbxDetails.VoicemailEnabled;
                        var bypassMedia = pbxDetails.BypassMedia;

                        if(pbxDetails.PersonalGreetingEnabled)
                        {
                            var utcTime = toISOString();
                            var localTime = moment(utcTime).utcOffset(pbxDetails.TimeZone);
                            var hours = localTime.hour();

                            hours = (hours+24-2)%24;

                            if(hours>12)
                            {
                                pbxUserConf.PersonalGreeting = pbxDetails.NightGreetingFile;
                            }
                            else
                            {
                                pbxUserConf.PersonalGreeting = pbxDetails.DayGreetingFile;
                            }

                        }

                        if(usrStatus === 'DND')
                        {
                            //xml DND response
                            pbxUserConf.OperationType = 'DND';
                            pbxUserConf.UserRefId = userUuid;
                            var jsonResponse = JSON.stringify(pbxUserConf);
                            logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                            res.end(jsonResponse);
                        }
                        else if(usrStatus === 'AVAILABLE')
                        {
                            //normal user xml

                            if(advancedMethod === 'FOLLOW_ME')
                            {
                                pbxBackendHandler.GetFollowMeByUserDB(reqId, userUuid, companyId, tenantId, function(err, fmList)
                                {
                                    if(err)
                                    {
                                        var jsonResponse = JSON.stringify(pbxUserConf);
                                        logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                        res.end(jsonResponse);
                                    }
                                    else
                                    {
                                        //Get follow me config and create xml
                                        var tempEpList = [];
                                        fmList.forEach(function(fmRec)
                                        {
                                            var tempEp =
                                            {
                                                DestinationNumber: fmRec.DestinationNumber,
                                                RingTimeout: fmRec.RingTimeout,
                                                Priority: fmRec.Priority,
                                                ObjClass: fmRec.ObjClass,
                                                ObjType: fmRec.ObjType,
                                                ObjCategory: fmRec.ObjCategory
                                            };


                                            tempEp.BypassMedia = false;
                                            if(fmRec.ObjCategory === 'PBXUSER' && fmRec.DestinationUser)
                                            {
                                                if(fmRec.DestinationUser.BypassMedia)
                                                {
                                                    tempEp.BypassMedia = fmRec.DestinationUser.BypassMedia;
                                                }
                                            }

                                            tempEpList.push(tempEp);

                                        });
                                        //Get follow me config and create xml
                                        pbxUserConf.OperationType = 'FOLLOW_ME';
                                        pbxUserConf.UserRefId = userUuid;
                                        pbxUserConf.Endpoints = tempEpList;
                                        pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                        pbxUserConf.BypassMedia = bypassMedia;

                                        var jsonResponse = JSON.stringify(pbxUserConf);
                                        logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                        res.end(jsonResponse);
                                    }

                                });

                            }
                            else if(advancedMethod === 'FORWARD')
                            {
                                pbxBackendHandler.GetForwardingByUserDB(reqId, userUuid, companyId, tenantId, function(err, fwdList)
                                {
                                    if(err)
                                    {
                                        var jsonResponse = JSON.stringify(pbxUserConf);
                                        logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                        res.end(jsonResponse);
                                    }
                                    else
                                    {
                                        var tempEpList = [];
                                        fwdList.forEach(function(fwdRec)
                                        {
                                            var tempEp =
                                            {
                                                DestinationNumber: fwdRec.DestinationNumber,
                                                RingTimeout: fwdRec.RingTimeout,
                                                DisconnectReason: fwdRec.DisconnectReason,
                                                ObjClass: fwdRec.ObjClass,
                                                ObjType: fwdRec.ObjType,
                                                ObjCategory: fwdRec.ObjCategory
                                            };


                                            tempEp.BypassMedia = false;
                                            if(fwdRec.ObjCategory === 'PBXUSER' && fwdRec.DestinationUser)
                                            {
                                                if(fwdRec.DestinationUser.BypassMedia)
                                                {
                                                    tempEp.BypassMedia = fwdRec.DestinationUser.BypassMedia;
                                                }
                                            }

                                            tempEpList.push(tempEp);

                                        });
                                        //Get follow me config and create xml

                                        pbxUserConf.OperationType = 'FORWARD';
                                        pbxUserConf.UserRefId = userUuid;
                                        pbxUserConf.Endpoints = tempEpList;
                                        pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                        pbxUserConf.BypassMedia = bypassMedia;

                                    }
                                });

                                if(pbxDetails.PersonalGreetingEnabled)
                                {
                                    var hours = new Date().getHours();

                                    hours = (hours+24-2)%24;

                                    if(hours>12)
                                    {
                                        pbxUserConf.PersonalGreeting = pbxDetails.NightGreetingFile;
                                    }
                                    else
                                    {
                                        pbxUserConf.PersonalGreeting = pbxDetails.DayGreetingFile;
                                    }

                                }

                                var jsonResponse = JSON.stringify(pbxUserConf);
                                logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                res.end(jsonResponse);

                            }
                            else
                            {
                                pbxUserConf.OperationType = 'USER_DIAL';
                                pbxUserConf.UserRefId = userUuid;
                                pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                pbxUserConf.BypassMedia = bypassMedia;
                                pbxUserConf.RingTimeout = pbxDetails.RingTimeout;

                                if(pbxDetails.PersonalGreetingEnabled)
                                {
                                    var hours = new Date().getHours();

                                    hours = (hours+24-2)%24;

                                    if(hours>12)
                                    {
                                        pbxUserConf.PersonalGreeting = pbxDetails.NightGreetingFile;
                                    }
                                    else
                                    {
                                        pbxUserConf.PersonalGreeting = pbxDetails.DayGreetingFile;
                                    }

                                }

                                var jsonResponse = JSON.stringify(pbxUserConf);
                                logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                res.end(jsonResponse);
                            }
                        }
                        else if(userStatus === 'CALL_DIVERT')
                        {
                            if(pbxDetails.PBXUserTemplate)
                            {
                                var endp =
                                {
                                    DestinationNumber: pbxDetails.PBXUserTemplate.CallDivertNumber,
                                    ObjCategory: pbxDetails.PBXUserTemplate.ObjCategory
                                };

                                pbxUserConf.OperationType = 'CALL_DIVERT';
                                pbxUserConf.Endpoints = endp;
                                pbxUserConf.UserRefId = userUuid;
                                pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                pbxUserConf.BypassMedia = bypassMedia;

                                if(pbxDetails.PBXUserTemplate.ObjCategory === 'PBXUSER' && pbxDetails.PBXUserTemplate.DestinationUser)
                                {
                                    pbxBackendHandler.GetPbxUserByIdDB(reqId, pbxDetails.PBXUserTemplate.DestinationUser, 1, 1, function(err, pbxUserObj)
                                    {
                                        if(err)
                                        {
                                            var jsonResponse = JSON.stringify(pbxUserConf);
                                            logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                            res.end(jsonResponse);
                                        }
                                        else if(pbxUserObj)
                                        {

                                            endp.BypassMedia = pbxUserObj.BypassMedia;
                                            endp.VoicemailEnabled = pbxUserObj.VoicemailEnabled;
                                            var jsonResponse = JSON.stringify(pbxUserConf);
                                            logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                            res.end(jsonResponse);
                                        }
                                        else
                                        {
                                            var jsonResponse = JSON.stringify(pbxUserConf);
                                            logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                            res.end(jsonResponse);
                                        }
                                    })
                                }
                                else
                                {
                                    var jsonResponse = JSON.stringify(pbxUserConf);
                                    logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                    res.end(jsonResponse);
                                }


                            }
                            else
                            {
                                pbxUserConf = null;
                                var jsonResponse = JSON.stringify(pbxUserConf);
                                logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                res.end(jsonResponse);

                            }

                        }
                        else
                        {
                            pbxUserConf.OperationType = 'USER_DIAL';
                            pbxUserConf.UserRefId = userUuid;
                            pbxUserConf.VoicemailEnabled = voicemailEnabled;
                            pbxUserConf.BypassMedia = bypassMedia;
                            pbxUserConf.RingTimeout = pbxDetails.RingTimeout;


                            var jsonResponse = JSON.stringify(pbxUserConf);
                            logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                            res.end(jsonResponse);
                        }

                    }
                })
            }
            else
            {
                if(opType === 'VOICE_PORTAL')
                {
                    //
                    if(fromUserUuid)
                    {
                        pbxBackendHandler.GetAllPbxUserDetailsByIdDB(reqId, fromUserUuid, companyId, tenantId, function(err, fromUsrDetails)
                        {
                            if(err)
                            {
                                var jsonResponse = JSON.stringify(pbxUserConf);
                                logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                res.end(jsonResponse);
                            }
                            else if(fromUsrDetails)
                            {
                                var xml = xmlBuilder.CreateVoicePortalDialplan(reqId, fromUsrDetails, context, '[^\\s]*', false, extExtraData);

                                pbxUserConf.OperationType = 'DIALPLAN';
                                pbxUserConf.Dialplan = xml;

                                var jsonResponse = JSON.stringify(pbxUserConf);
                                logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                res.end(jsonResponse);
                            }
                            else
                            {
                                var jsonResponse = JSON.stringify(pbxUserConf);
                                logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                res.end(jsonResponse);
                            }
                        })
                    }
                    else
                    {
                        var jsonResponse = JSON.stringify(pbxUserConf);
                        logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                        res.end(jsonResponse);
                    }

                }
                else
                {
                    FeatureCodeHandler(reqId, dnis, companyId, tenantId, function(err, feature, number)
                    {
                        if(feature)
                        {
                            pbxUserConf.OperationType = feature;
                            pbxUserConf.ExtraData = number;

                            var jsonResponse = JSON.stringify(pbxUserConf);
                            logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                            res.end(jsonResponse);
                        }
                        else
                        {
                            if(fromUserUuid)
                            {
                                pbxBackendHandler.GetPbxUserByIdDB(reqId, fromUserUuid, companyId, tenantId, function (err, fromPbxUser)
                                {
                                    if(fromPbxUser)
                                    {
                                        if(!fromPbxUser.AllowOutbound)
                                        {
                                            var outNumArr = JSON.parse(fromPbxUser.AllowedNumbers);

                                            var outNum = underscore.find(outNumArr, function (num)
                                            {
                                                return num == dnis;
                                            });

                                            if (outNum)
                                            {
                                                var endp =
                                                {
                                                    DestinationNumber: outNum,
                                                    ObjCategory: 'GATEWAY'
                                                };

                                                pbxUserConf.OperationType = 'GATEWAY';
                                                pbxUserConf.Endpoints = endp;
                                                pbxUserConf.UserRefId = userUuid;
                                                pbxUserConf.VoicemailEnabled = false;
                                                pbxUserConf.BypassMedia = false;
                                            }
                                            else
                                            {
                                                var jsonResponse = JSON.stringify(pbxUserConf);
                                                logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                                res.end(jsonResponse);
                                            }
                                        }
                                        else
                                        {
                                            var endp =
                                            {
                                                DestinationNumber: dnis,
                                                ObjCategory: 'GATEWAY'
                                            };

                                            pbxUserConf.OperationType = 'GATEWAY';
                                            pbxUserConf.Endpoints = endp;
                                            pbxUserConf.UserRefId = userUuid;
                                            pbxUserConf.VoicemailEnabled = false;
                                            pbxUserConf.BypassMedia = false;
                                        }

                                    }

                                    var jsonResponse = JSON.stringify(pbxUserConf);
                                    logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                    res.end(jsonResponse);

                                })
                            }
                            else
                            {
                                var jsonResponse = JSON.stringify(pbxUserConf);
                                logger.debug('DVP-PBXService.GeneratePBXConfig] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
                                res.end(jsonResponse);
                            }
                        }
                    });
                }
            }
        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GenerateDialplan] - [%s] - Exception Occurred', reqId, ex);
        var jsonResponse = JSON.stringify(pbxUserConf);
        logger.debug('[DVP-PBXService.GenerateDialplan] - [%s] - API RESPONSE : %s', reqId, jsonResponse);
        res.end(jsonResponse);

    }
    return next();

});

server.post('/DVP/API/:version/PBXService/PBXUser/:PbxUserUuid/AllowedNumbers', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-PBXService.AssignAllowedNumber] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            var pbxUserUuid = req.params.PbxUserUuid;

            var allowedNumArr = req.body.AllowedNumbers;

            if(pbxUserUuid && allowedNumArr)
            {
                pbxBackendHandler.AddPbxUserAllowedNumbersDB(reqId, pbxUserUuid, 1, 3, allowedNumArr, function(err, assignResult)
                {
                    if(err)
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "Assign PBX User allowed numbers Failed", false, false);
                        logger.debug('[DVP-PBXService.AssignAllowedNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);
                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "Assign PBX User allowed numbers Success", true, assignResult);
                        logger.debug('[DVP-PBXService.AssignAllowedNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);
                    }

                })
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(new Error('Pbx user id and assign number list not given'), "Pbx user id and assign number list not given", false, false);
                logger.debug('[DVP-PBXService.AssignAllowedNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.AssignAllowedNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AssignAllowedNumber] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.AssignAllowedNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.post('/DVP/API/:version/PBXService/PBXUser/:PbxUserUuid/DayPersonalGreeting/:FileUuid', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var pbxUserUuid = req.params.PbxUserUuid;

        var fileUuid = req.params.FileUuid;

        logger.debug('[DVP-PBXService.DayPersonalGreeting] - [%s] - HTTP Request Received - Req Params - PbxUserUuid : %s, FileUuid : %s', reqId, pbxUserUuid, fileUuid);

        if(pbxUserUuid && fileUuid && securityToken)
        {
            extApi.RemoteGetFileMetadata(reqId, fileUuid, securityToken, function (err, fileMetaData)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Exception occurred", false, false);
                    logger.debug('[DVP-PBXService.DayPersonalGreeting] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);

                }
                else if (fileMetaData && fileMetaData.Filename)
                {
                    pbxBackendHandler.SetDayPersonalGreetingDB(reqId, pbxUserUuid, fileMetaData.Filename, 1, 3, function (err, assignResult) {
                        if (err)
                        {
                            var jsonString = messageFormatter.FormatMessage(err, "Assign PBX User allowed numbers Failed", false, false);
                            logger.debug('[DVP-PBXService.DayPersonalGreeting] - [%s] - API RESPONSE : %s', reqId, jsonString);
                            res.end(jsonString);
                        }
                        else
                        {
                            var jsonString = messageFormatter.FormatMessage(err, "Assign PBX User allowed numbers Success", true, assignResult);
                            logger.debug('[DVP-PBXService.DayPersonalGreeting] - [%s] - API RESPONSE : %s', reqId, jsonString);
                            res.end(jsonString);
                        }

                    })
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(new Error('File not found'), "Exception occurred", false, false);
                    logger.debug('[DVP-PBXService.DayPersonalGreeting] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);

                }
            })


        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.DayPersonalGreeting] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.DayPersonalGreeting] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.DayPersonalGreeting] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.post('/DVP/API/:version/PBXService/PBXUser/:PbxUserUuid/NightPersonalGreeting/:FileUuid', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');

        var pbxUserUuid = req.params.PbxUserUuid;
        var fileUuid = req.params.FileUuid;

        logger.debug('[DVP-PBXService.NightPersonalGreeting] - [%s] - HTTP Request Received - Req Params - PbxUserUuid : %s, FileUuid : %s', reqId, pbxUserUuid, fileUuid);

        if(pbxUserUuid && fileUuid && securityToken)
        {
            extApi.RemoteGetFileMetadata(reqId, fileUuid, securityToken, function (err, fileMetaData)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Exception occurred", false, false);
                    logger.debug('[DVP-PBXService.NightPersonalGreeting] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);

                }
                else if (fileMetaData && fileMetaData.Filename)
                {
                    pbxBackendHandler.SetNightPersonalGreetingDB(reqId, pbxUserUuid, fileMetaData.Filename, 1, 3, function (err, assignResult) {
                        if (err)
                        {
                            var jsonString = messageFormatter.FormatMessage(err, "Assign PBX User allowed numbers Failed", false, false);
                            logger.debug('[DVP-PBXService.NightPersonalGreeting] - [%s] - API RESPONSE : %s', reqId, jsonString);
                            res.end(jsonString);
                        }
                        else
                        {
                            var jsonString = messageFormatter.FormatMessage(err, "Assign PBX User allowed numbers Success", true, assignResult);
                            logger.debug('[DVP-PBXService.NightPersonalGreeting] - [%s] - API RESPONSE : %s', reqId, jsonString);
                            res.end(jsonString);
                        }

                    })
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(new Error('File not found'), "Exception occurred", false, false);
                    logger.debug('[DVP-PBXService.NightPersonalGreeting] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);

                }
            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request params or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.NightPersonalGreeting] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.DayPersonalGreeting] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.DayPersonalGreeting] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.post('/DVP/API/:version/PBXService/PBXUser/:PbxUserUuid/PersonalGreetingStatus/:EnableStatus', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');

        var pbxUserUuid = req.params.PbxUserUuid;

        var enableStatus = req.params.EnableStatus;

        logger.debug('[DVP-PBXService.PersonalGreetingStatus] - [%s] - HTTP Request Received - Req Params - PbxUserUuid : %s, EnableStatus : %s', reqId, pbxUserUuid, enableStatus);

        if(pbxUserUuid && enableStatus && securityToken)
        {
            pbxBackendHandler.EnablePersonalGreetingDB(reqId, pbxUserUuid, enableStatus, 1, 1, function (err, assignResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Assign PBX User PersonalGreetingStatus Failed", false, false);
                    logger.debug('[DVP-PBXService.PersonalGreetingStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Assign PBX User PersonalGreetingStatus Success", true, assignResult);
                    logger.debug('[DVP-PBXService.PersonalGreetingStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request params or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.PersonalGreetingStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);
        }


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.PersonalGreetingStatus] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.PersonalGreetingStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.post('/DVP/API/:version/PBXService/PBXUser/:PbxUserUuid/AllowedNumber/:AllowedNumber/UnAssign', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');

        var pbxUserUuid = req.params.PbxUserUuid;
        var allowedNum = req.params.AllowedNumber;

        logger.debug('[DVP-PBXService.UnAssignAllowedNumber] - [%s] - HTTP Request Received - Req Params : ', reqId, pbxUserUuid, allowedNum);

        if(pbxUserUuid && allowedNum && securityToken)
        {
            pbxBackendHandler.RemovePbxUserAllowedNumberDB(reqId, pbxUserUuid, 1, 1, allowedNum, function (err, assignResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Un Assign PBX User allowed number Failed", false, false);
                    logger.debug('[DVP-PBXService.UnAssignAllowedNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Un Assign PBX User allowed number Success", true, assignResult);
                    logger.debug('[DVP-PBXService.UnAssignAllowedNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.UnAssignAllowedNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.UnAssignAllowedNumber] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.UnAssignAllowedNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.post('/DVP/API/:version/PBXService/FeatureCodeTemplate', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-PBXService.FeatureCodeTemplate] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            pbxBackendHandler.AddFeatureCodesDB(reqId, reqBody, 1, 1, function (err, assignResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Add pbx feature codes Failed", false, false);
                    logger.debug('[DVP-PBXService.FeatureCodeTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Add pbx feature codes Success", true, assignResult);
                    logger.debug('[DVP-PBXService.FeatureCodeTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.FeatureCodeTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.FeatureCodeTemplate] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.FeatureCodeTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.post('/DVP/API/:version/PBXService/PBXUser/:userUuid/FollowMe', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;
        var userUuid = req.params.userUuid;

        logger.debug('[DVP-PBXService.NewFollowMeConfig] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            //Add new PBX User Record

            pbxBackendHandler.AddFollowMeDB(reqId, userUuid, 1, 1, reqBody, securityToken, function (err, isSuccess, addResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Add follow me config failed", false, false);
                    logger.debug('[DVP-PBXService.NewFollowMeConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Add follow me success", isSuccess, addResult);
                    logger.debug('[DVP-PBXService.NewFollowMeConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })


        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.NewFollowMeConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.NewFollowMeConfig] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.NewFollowMeConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }

    return next();

});

server.post('/DVP/API/:version/PBXService/PBXUser/:userUuid/Forwarding', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;
        var userUuid = req.params.userUuid;

        logger.debug('[DVP-PBXService.NewForwardingConfig] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            //Add new PBX User Record
            var fwdData = dbModel.Forwarding.build({

                DestinationNumber: req.body.DestinationNumber,
                RingTimeout: req.body.RingTimeout,
                DisconnectReason: req.body.DisconnectReason,
                CompanyId: 1,
                TenantId: 1,
                ObjClass: 'PBX',
                ObjType: 'FORWARDING',
                ObjCategory: req.body.ObjCategory,
                IsActive: req.body.IsActive
            });

            pbxBackendHandler.AddForwardingDB(reqId, userUuid, 1, 1, fwdData, function (err, isSuccess, addResult) {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Add forwarding config failed", false, false);
                    logger.debug('[DVP-PBXService.NewForwardingConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Add forwarding success", isSuccess, addResult);
                    logger.debug('[DVP-PBXService.NewForwardingConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })


        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.NewForwardingConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.NewForwardingConfig] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.NewForwardingConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }

    return next();

});

server.del('/DVP/API/:version/PBXService/FollowMe/:fmId', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var fmId = req.params.fmId;

        logger.debug('[DVP-PBXService.DeleteFollowMeConfig] - [%s] - HTTP Request Received - Req Params - fmId : %s', reqId, fmId);

        if(fmId && securityToken)
        {

            pbxBackendHandler.DeleteFollowMeDB(reqId, fmId, 1, 1, function (err, delResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete Follow Me Failed", false, false);
                    logger.debug('[DVP-PBXService.DeleteFollowMeConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete Follow Me Success", true, delResult);
                    logger.debug('[DVP-PBXService.DeleteFollowMeConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.DeleteFollowMeConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.DeleteFollowMeConfig] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.DeleteFollowMeConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.del('/DVP/API/:version/PBXService/Forwarding/:fwdId', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var fwdId = req.params.fwdId;

        logger.debug('[DVP-PBXService.DeleteForwardingConfig] - [%s] - HTTP Request Received - Req Params - fmId : %s', reqId, fwdId);

        if(fwdId && securityToken)
        {

            pbxBackendHandler.DeleteForwardingDB(reqId, fwdId, 1, 3, function (err, delResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete Forwarding Failed", false, false);
                    logger.debug('[DVP-PBXService.DeleteForwardingConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete Forwarding Success", true, delResult);
                    logger.debug('[DVP-PBXService.DeleteForwardingConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.DeleteForwardingConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.DeleteForwardingConfig] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.DeleteForwardingConfig] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.post('/DVP/API/:version/PBXService/PbxUser', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-PBXService.NewPbxUser] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            var sipUserUuid = req.body.UserUuid;

            extApi.RemoteGetSipUserDetailsForUuid(reqId, sipUserUuid, securityToken, function(err, apiResp)
            {
                if(!err && apiResp)
                {
                    //Add new PBX User Record
                    var pbxUsrData = dbModel.PBXUser.build({

                        UserUuid: apiResp.SipUserUuid,
                        BypassMedia: reqBody.BypassMedia,
                        IgnoreEarlyMedia: reqBody.IgnoreEarlyMedia,
                        VoicemailEnabled: reqBody.VoicemailEnabled,
                        ScheduleId: reqBody.ScheduleId,
                        AllowOutbound: reqBody.AllowOutbound,
                        UserStatus: reqBody.UserStatus, //DND, CALL_DIVERT, AVAILABLE
                        AdvancedRouteMethod: reqBody.AdvancedRouteMethod, //FORWARD, FOLLOW_ME
                        FollowMeMechanism: reqBody.FollowMeMechanism,
                        CompanyId: 1,
                        TenantId: 1,
                        ObjClass: 'PBX',
                        ObjType: 'PBXUSER',
                        ObjCategory: 'GENERAL',
                        Pin: reqBody.Pin
                    });

                    pbxBackendHandler.AddPbxUserDB(reqId, pbxUsrData, function(err, addResult)
                    {
                        if(err)
                        {
                            var jsonString = messageFormatter.FormatMessage(err, "Add PBX User Failed", false, false);
                            logger.debug('[DVP-PBXService.NewPbxUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
                            res.end(jsonString);
                        }
                        else
                        {
                            var jsonString = messageFormatter.FormatMessage(err, "Add PBX User Success", true, addResult);
                            logger.debug('[DVP-PBXService.NewPbxUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
                            res.end(jsonString);
                        }

                    })

                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Add PBX User Failed", false, false);
                    logger.debug('[DVP-PBXService.NewPbxUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
            })
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.NewPbxUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.PbxUser] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.PbxUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }

    return next();

});

server.put('/DVP/API/:version/PBXService/PBXUser/:PbxUserUuid', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;
        var uuidusr = req.params.userUuid;

        logger.debug('[DVP-PBXService.UpdatePbxUser] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {

            delete reqBody.UserUuid;
            delete reqBody.CompanyId;
            delete reqBody.TenantId;

            pbxBackendHandler.UpdatePbxUserDB(reqId, uuidusr, reqBody, 1, 1, function(err, updateResult)
            {
                if(err || !updateResult)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Update PBX User Failed", false, false);
                    logger.debug('[DVP-PBXService.UpdatePbxUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Update PBX User Success", true, updateResult);
                    logger.debug('[DVP-PBXService.UpdatePbxUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.UpdatePbxUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.PbxUser] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.PbxUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }

    return next();

});

server.post('/DVP/API/:version/PBXService/PbxUserTemplate', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-PBXService.NewPbxUserTemplate] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {


                pbxBackendHandler.AddPbxUserTemplateDB(reqId, reqBody, function(err, addResult)
                {
                    if(err)
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "Add PBX User Template Failed", false, false);
                        logger.debug('[DVP-PBXService.NewPbxUserTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);
                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "Add PBX User Template Failed", true, addResult);
                        logger.debug('[DVP-PBXService.NewPbxUserTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);
                    }

                })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.NewPbxUserTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.NewPbxUserTemplate] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.NewPbxUserTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.post('/DVP/API/:version/PBXService/PbxUser/:pbxUser/SetPbxUserTemplate/:templateId', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-PBXService.AssignPbxTemplate] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            var pbxUserUuid = req.params.pbxUser;
            var tempId = req.params.templateId;

            if(pbxUserUuid && tempId)
            {
                pbxBackendHandler.AssignTemplateToUserDB(reqId, pbxUserUuid, tempId, 1, 3, function(err, assignResult)
                {
                    if(err)
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "Assign PBX User Template Failed", false, false);
                        logger.debug('[DVP-PBXService.AssignPbxTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);
                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "Assign PBX User Template Success", true, assignResult);
                        logger.debug('[DVP-PBXService.AssignPbxTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);
                    }

                })
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(new Error('Pbx user id and template id not given'), "Pbx user id and template id not given", false, false);
                logger.debug('[DVP-PBXService.AssignPbxTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.AssignPbxTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AssignPbxTemplate] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.AssignPbxTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.post('/DVP/API/:version/PBXService/PbxUser/:PbxUserUuid/PbxUserTemplate/UnAssign', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var pbxUserUuid = req.params.PbxUserUuid;

        logger.debug('[DVP-PBXService.UnAssignPbxTemplate] - [%s] - HTTP Request Received - Req Params - PbxUserUuid : %s', reqId, pbxUserUuid);

        if(pbxUserUuid && securityToken)
        {
            pbxBackendHandler.UnAssignTemplateFromUserDB(reqId, pbxUserUuid, 1, 1, function (err, unAssignResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Un assign PBX User Template Failed", false, false);
                    logger.debug('[DVP-PBXService.AssignPbxTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Un assign PBX User Template Success", true, unAssignResult);
                    logger.debug('[DVP-PBXService.AssignPbxTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request params or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.AssignPbxTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AssignPbxTemplate] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.AssignPbxTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.del('/DVP/API/:version/PBXService/PbxUser/:PbxUserUuid', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var pbxUserUuid = req.params.PbxUserUuid;

        logger.debug('[DVP-PBXService.DeletePBXUser] - [%s] - HTTP Request Received - Req Params - PbxUserUuid : %s', reqId, pbxUserUuid);

        if(pbxUserUuid && securityToken)
        {

            pbxBackendHandler.DeletePbxUserDB(reqId, pbxUserUuid, 1, 1, function (err, delResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete PBX User Failed", false, false);
                    logger.debug('[DVP-PBXService.DeletePBXUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete PBX User Success", true, delResult);
                    logger.debug('[DVP-PBXService.DeletePBXUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.DeletePBXUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.DeletePBXUser] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.DeletePBXUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.del('/DVP/API/:version/PBXService/PbxUserTemplate/:templateId', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var templateId = req.params.templateId;

        logger.debug('[DVP-PBXService.DeletePBXUserTemplate] - [%s] - HTTP Request Received - Req Params - TemplateId : %s', reqId, templateId);

        if(templateId && securityToken)
        {

            pbxBackendHandler.DeletePbxUserTemplateDB(reqId, templateId, 1, 1, function (err, delResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete PBX User Template Failed", false, false);
                    logger.debug('[DVP-PBXService.DeletePBXUserTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete PBX User Template Success", true, delResult);
                    logger.debug('[DVP-PBXService.DeletePBXUserTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-PBXService.DeletePBXUserTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.DeletePBXUserTemplate] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-PBXService.DeletePBXUserTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.get('/DVP/API/:version/PBXService/PbxUser/:PbxUserUuid', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var uuid = req.params.PbxUserUuid;

        logger.debug('[DVP-PBXService.GetPbxUserByUuid] - [%s] - HTTP Request Received - Req Params - uuid : %s', reqId, uuid);

        if(uuid && securityToken)
        {

            pbxBackendHandler.GetPbxUserByIdDB(reqId, uuid, 1, 1, function (err, pbxUser)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get PBX User By Id Failed", false, pbxUser);
                    logger.debug('[DVP-PBXService.GetPbxUserByUuid] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get PBX User By Id Success", true, pbxUser);
                    logger.debug('[DVP-PBXService.GetPbxUserByUuid] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request params or no authorization token set", false, undefined);
            logger.debug('[DVP-PBXService.GetPbxUserByUuid] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetPbxUserByUuid] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, undefined);
        logger.debug('[DVP-PBXService.GetPbxUserByUuid] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.get('/DVP/API/:version/PBXService/FollowMe/:fmId', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var id = req.params.fmId;

        logger.debug('[DVP-PBXService.FollowMeById] - [%s] - HTTP Request Received - Req Params - id : %s', reqId, id);

        if(id && securityToken)
        {

            pbxBackendHandler.GetFollowMeByIdDB(reqId, id, 1, 1, function (err, fmInfo)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get Follow Me Conf By Id Failed", false, fmInfo);
                    logger.debug('[DVP-PBXService.PbxUserTemplateById] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get Follow Me Conf By Id Success", true, fmInfo);
                    logger.debug('[DVP-PBXService.PbxUserTemplateById] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request params or no authorization token set", false, undefined);
            logger.debug('[DVP-PBXService.PbxUserTemplateById] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.PbxUserTemplateById] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, undefined);
        logger.debug('[DVP-PBXService.PbxUserTemplateById] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.get('/DVP/API/:version/PBXService/Forwarding/:fwdId', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var id = req.params.fwdId;

        logger.debug('[DVP-PBXService.ForwardingById] - [%s] - HTTP Request Received - Req Params - id : %s', reqId, id);

        if(id && securityToken)
        {

            pbxBackendHandler.GetForwardingByIdDB(reqId, id, 1, 1, function (err, fwdInfo)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get Forwarding Conf By Id Failed", false, fwdInfo);
                    logger.debug('[DVP-PBXService.ForwardingById] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get Forwarding Conf By Id Success", true, fwdInfo);
                    logger.debug('[DVP-PBXService.ForwardingById] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request params or no authorization token set", false, undefined);
            logger.debug('[DVP-PBXService.ForwardingById] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.ForwardingById] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, undefined);
        logger.debug('[DVP-PBXService.ForwardingById] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.get('/DVP/API/:version/PBXService/PbxUserTemplate/:templateId', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var id = req.params.templateId;

        logger.debug('[DVP-PBXService.PbxUserTemplateById] - [%s] - HTTP Request Received - Req Params - uuid : %s', reqId, id);

        if(id && securityToken)
        {

            pbxBackendHandler.GetPbxUserTemplateByIdDB(reqId, id, 1, 1, function (err, pbxUserTemplate)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get PBX User Template By Id Failed", false, pbxUserTemplate);
                    logger.debug('[DVP-PBXService.PbxUserTemplateById] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get PBX User Template By Id Success", true, pbxUserTemplate);
                    logger.debug('[DVP-PBXService.PbxUserTemplateById] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request params or no authorization token set", false, undefined);
            logger.debug('[DVP-PBXService.PbxUserTemplateById] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.PbxUserTemplateById] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, undefined);
        logger.debug('[DVP-PBXService.PbxUserTemplateById] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.get('/DVP/API/:version/PBXService/FeatureCodes', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');

        logger.debug('[DVP-PBXService.FeatureCodesForCompany] - [%s] - HTTP Request Received', reqId);

        if(securityToken)
        {

            pbxBackendHandler.GetFeatureCodesForCompanyDB(reqId, 1, 3, function (err, fc)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get feature codes Failed", false, fc);
                    logger.debug('[DVP-PBXService.FeatureCodesForCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get feature codes Success", true, fc);
                    logger.debug('[DVP-PBXService.FeatureCodesForCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request params or no authorization token set", false, undefined);
            logger.debug('[DVP-PBXService.FeatureCodesForCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.FeatureCodesForCompany] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, undefined);
        logger.debug('[DVP-PBXService.FeatureCodesForCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.get('/DVP/API/:version/PBXService/PbxUsers', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];
    try
    {
        var securityToken = req.header('authorization');


        logger.debug('[DVP-PBXService.GetPbxUserByCompany] - [%s] - HTTP Request Received : %s', reqId);

        if(securityToken)
        {

            pbxBackendHandler.GetPbxUsersForCompanyDB(reqId, 1, 3, function (err, pbxUserList)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get PBX Users for Company Failed", false, pbxUserList);
                    logger.debug('[DVP-PBXService.GetPbxUserByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get PBX Users for Company Success", true, pbxUserList);
                    logger.debug('[DVP-PBXService.GetPbxUserByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('No authorization token set'), "No authorization token set", false, emptyArr);
            logger.debug('[DVP-PBXService.GetPbxUserByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetPbxUserByCompany] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, emptyArr);
        logger.debug('[DVP-PBXService.GetPbxUserByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.get('/DVP/API/:version/PBXService/PbxUserTemplates', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];
    try
    {
        var securityToken = req.header('authorization');


        logger.debug('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - HTTP Request Received : %s', reqId);

        if(securityToken)
        {

            pbxBackendHandler.GetPbxUserTemplatesForCompanyDB(reqId, 1, 3, function (err, pbxTempList)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get PBX User Templates for Company Failed", false, pbxTempList);
                    logger.debug('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get PBX User Templates for Company Success", true, pbxTempList);
                    logger.debug('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('No authorization token set'), "No authorization token set", false, emptyArr);
            logger.debug('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, emptyArr);
        logger.debug('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.get('/DVP/API/:version/PBXService/PbxUser/:userUuid/FollowMe', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];
    try
    {
        var securityToken = req.header('authorization');
        var userUuid = req.params.userUuid;


        logger.debug('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - HTTP Request Received - params - userUuid : %s', reqId, userUuid);

        if(securityToken)
        {

            pbxBackendHandler.GetFollowMeByUserDB(reqId, userUuid, 1, 3, function (err, fmList)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get follow me config for user failed", false, fmList);
                    logger.debug('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get follow me config for user success", true, fmList);
                    logger.debug('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('No authorization token set'), "No authorization token set", false, emptyArr);
            logger.debug('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, emptyArr);
        logger.debug('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.get('/DVP/API/:version/PBXService/PbxUser/:userUuid/Forwarding', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];
    try
    {
        var securityToken = req.header('authorization');
        var userUuid = req.params.userUuid;


        logger.debug('[DVP-PBXService.ForwardingConfigForUser] - [%s] - HTTP Request Received - params - userUuid : %s', reqId, userUuid);

        if(securityToken)
        {

            pbxBackendHandler.GetForwardingByUserDB(reqId, userUuid, 1, 1, function (err, fmList)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get forwarding config for user failed", false, fmList);
                    logger.debug('[DVP-PBXService.ForwardingConfigForUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get forwarding config for user success", true, fmList);
                    logger.debug('[DVP-PBXService.ForwardingConfigForUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('No authorization token set'), "No authorization token set", false, emptyArr);
            logger.debug('[DVP-PBXService.ForwardingConfigForUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, emptyArr);
        logger.debug('[DVP-PBXService.PbxUserTemplatesByCompany] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

server.post('/DVP/API/:version/PBXService/PbxMasterData', function(req, res, next)
{
    var reqId = uuid.v1();

    try
    {
        var reqBody = req.body;

        logger.debug('[DVP-PBXService.AddPbxMasterData] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        pbxBackendHandler.AddPbxMasterDataDB(reqId, reqBody, function (err, result)
        {
            if (err)
            {
                logger.error('[DVP-PBXService.AddPbxMasterData] - [%s] - Exception occurred on method pbxBackendHandler.AddPbxMasterData', reqId, err);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else
            {
                logger.debug('[DVP-PBXService.AddPbxMasterData] - [%s] - Pbx master data added successfully - Returned : %s', reqId, result);
                var jsonString = messageFormatter.FormatMessage(err, "Pbx master data added successfully", result, undefined);
                res.end(jsonString);
            }
        })

    }
    catch(ex)
    {
        logger.error(format('[DVP-PBXService.AddPbxMasterData] - [%s] - Exception occurred', reqId), ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        res.end(jsonString);
    }

    return next();

});

server.get('/DVP/API/:version/PBXService/PbxMasterData/:id', function(req, res, next)
{
    var reqId = uuid.v1();

    try
    {
        var pbxId = req.params.id;

        logger.debug('[DVP-PBXService.GetPbxMasterData] - [%s] - HTTP Request Received - Req Body : ', reqId, pbxId);

        pbxBackendHandler.GetPbxMasterData(reqId, pbxId, 1, 3, function (err, result)
        {
            if (err)
            {
                logger.error('[DVP-PBXService.GetPbxMasterData] - [%s] - Exception occurred on method pbxBackendHandler.AddPbxMasterData', reqId, err);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else
            {
                logger.debug('[DVP-PBXService.GetPbxMasterData] - [%s] - Pbx master data added successfully - Returned : %s', reqId, result);
                var jsonString = messageFormatter.FormatMessage(err, "Pbx master data retrieved successfully", true, result);
                res.end(jsonString);
            }
        })

    }
    catch(ex)
    {
        logger.error(format('[DVP-PBXService.GetPbxMasterData] - [%s] - Exception occurred', reqId), ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        res.end(jsonString);
    }

    return next();

});

server.listen(hostPort, hostIp, function () {
    console.log('%s listening at %s', server.name, server.url);
});