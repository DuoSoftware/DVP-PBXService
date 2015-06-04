var restify = require('restify');
var nodeUuid = require('node-uuid');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;
var config = require('config');
var pbxBackendHandler = require('./PbxBackendHandler.js');
var dbModel = require('DVP-DBModels');
var extApi = require('./PbxExternalApiAccess.js');

var hostIp = config.Host.Ip;
var hostPort = config.Host.Port;
var hostVersion = config.Host.Version;

var server = restify.createServer({
    name: 'localhost',
    version: '1.0.0'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());


server.post('/DVP/API/' + hostVersion + '/PBXService/GeneratePBXConfig', function(req, res, next)
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
        var tenantId = 3;
        var userUuid = '';
        var fromUserUuid = '';

        if(extraData)
        {
            userUuid = extraData['UserUuid'];
            fromUserUuid = extraData['FromUserUuid'];
        }

        if(direction === 'IN')
        {
            //try getting user for did


                    pbxBackendHandler.GetAllPbxUserDetailsByIdDB(reqId, userUuid, companyId, tenantId, function(err, pbxDetails)
                    {
                        if(err || !pbxDetails)
                        {
                            var jsonResponse = JSON.stringify(pbxUserConf);
                            res.end(jsonResponse);
                        }
                        else
                        {
                            if(pbxDetails.PBXUserTemplate)
                            {
                                var usrStatus = pbxDetails.PBXUserTemplate.UserStatus;
                                var advancedMethod = pbxDetails.PBXUserTemplate.AdvancedRouteMethod;
                                var voicemailEnabled = pbxDetails.VoicemailEnabled;
                                var bypassMedia = pbxDetails.BypassMedia;

                                if(usrStatus === 'DND')
                                {
                                    //xml DND response
                                    pbxUserConf.OperationType = 'DND';
                                    pbxUserConf.UserRefId = userUuid;
                                    var jsonResponse = JSON.stringify(pbxUserConf);
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
                                                res.end(jsonResponse);
                                            }
                                            else
                                            {
                                                //Get follow me config and create xml
                                                pbxUserConf.OperationType = 'FOLLOW_ME';
                                                pbxUserConf.UserRefId = userUuid;
                                                pbxUserConf.FollowMe = fmList;
                                                pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                                pbxUserConf.BypassMedia = bypassMedia;
                                                var jsonResponse = JSON.stringify(pbxUserConf);
                                                res.end(jsonResponse);
                                            }

                                        });

                                    }
                                    else if(advancedMethod === 'FORWARD')
                                    {
                                        pbxUserConf.OperationType = 'FORWARD';
                                        pbxUserConf.UserRefId = userUuid;
                                        pbxUserConf.Forward = undefined;
                                        pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                        pbxUserConf.BypassMedia = bypassMedia;
                                        var jsonResponse = JSON.stringify(pbxUserConf);
                                        res.end(jsonResponse);

                                    }
                                    else
                                    {
                                        pbxUserConf.OperationType = 'USER_DIAL';
                                        pbxUserConf.UserRefId = userUuid;
                                        pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                        pbxUserConf.BypassMedia = bypassMedia;

                                        var jsonResponse = JSON.stringify(pbxUserConf);
                                        res.end(jsonResponse);
                                    }
                                }
                                else if(userStatus === 'CALL_DIVERT')
                                {
                                    //pick outbound rule and create outbound gateway xml
                                    pbxUserConf.OperationType = 'CALL_DIVERT';
                                    pbxUserConf.UserRefId = userUuid;
                                    pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                    pbxUserConf.BypassMedia = bypassMedia;

                                    var jsonResponse = JSON.stringify(pbxUserConf);
                                    res.end(jsonResponse);
                                }
                                else
                                {
                                    pbxUserConf.OperationType = 'USER_DIAL';
                                    pbxUserConf.UserRefId = userUuid;
                                    pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                    pbxUserConf.BypassMedia = bypassMedia;

                                    var jsonResponse = JSON.stringify(pbxUserConf);
                                    res.end(jsonResponse);
                                }

                            }
                            else
                            {
                                var jsonResponse = JSON.stringify(pbxUserConf);
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
                        var jsonResponse = JSON.stringify(pbxUserConf);
                        res.end(jsonResponse);
                    }
                    else
                    {
                        if(fromUserUuid)
                        {
                            pbxBackendHandler.GetPbxUserByIdDB(reqId, fromUserUuid, companyId, tenantId, function(err, fromPbxUser)
                            {
                                if(!err && fromPbxUser)
                                {
                                    pbxUserConf.DodNumber = fromPbxUser.DodNumber;
                                    pbxUserConf.DodActive = fromPbxUser.DodActive;

                                    if(pbxDetails.PBXUserTemplate)
                                    {
                                        var usrStatus = pbxDetails.PBXUserTemplate.UserStatus;
                                        var advancedMethod = pbxDetails.PBXUserTemplate.AdvancedRouteMethod;
                                        var voicemailEnabled = pbxDetails.VoicemailEnabled;
                                        var bypassMedia = pbxDetails.BypassMedia;

                                        if(usrStatus === 'DND')
                                        {
                                            //xml DND response
                                            pbxUserConf.OperationType = 'DND';
                                            pbxUserConf.UserRefId = userUuid;
                                            var jsonResponse = JSON.stringify(pbxUserConf);
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
                                                        res.end(jsonResponse);
                                                    }
                                                    else
                                                    {
                                                        //Get follow me config and create xml
                                                        pbxUserConf.OperationType = 'FOLLOW_ME';
                                                        pbxUserConf.UserRefId = userUuid;
                                                        pbxUserConf.FollowMe = fmList;
                                                        pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                                        pbxUserConf.BypassMedia = bypassMedia;
                                                        var jsonResponse = JSON.stringify(pbxUserConf);
                                                        res.end(jsonResponse);
                                                    }

                                                });

                                            }
                                            else if(advancedMethod === 'FORWARD')
                                            {
                                                pbxUserConf.OperationType = 'FORWARD';
                                                pbxUserConf.UserRefId = userUuid;
                                                pbxUserConf.Forward = undefined;
                                                pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                                pbxUserConf.BypassMedia = bypassMedia;
                                                var jsonResponse = JSON.stringify(pbxUserConf);
                                                res.end(jsonResponse);

                                            }
                                            else
                                            {
                                                pbxUserConf.OperationType = 'USER_DIAL';
                                                pbxUserConf.UserRefId = userUuid;
                                                pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                                pbxUserConf.BypassMedia = bypassMedia;

                                                var jsonResponse = JSON.stringify(pbxUserConf);
                                                res.end(jsonResponse);
                                            }
                                        }
                                        else if(userStatus === 'CALL_DIVERT')
                                        {
                                            //pick outbound rule and create outbound gateway xml
                                            pbxUserConf.OperationType = 'CALL_DIVERT';
                                            pbxUserConf.UserRefId = userUuid;
                                            pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                            pbxUserConf.BypassMedia = bypassMedia;

                                            var jsonResponse = JSON.stringify(pbxUserConf);
                                            res.end(jsonResponse);
                                        }
                                        else
                                        {
                                            pbxUserConf.OperationType = 'USER_DIAL';
                                            pbxUserConf.UserRefId = userUuid;
                                            pbxUserConf.VoicemailEnabled = voicemailEnabled;
                                            pbxUserConf.BypassMedia = bypassMedia;

                                            var jsonResponse = JSON.stringify(pbxUserConf);
                                            res.end(jsonResponse);
                                        }

                                    }
                                    else
                                    {
                                        var jsonResponse = JSON.stringify(pbxUserConf);
                                        res.end(jsonResponse);
                                    }

                                }
                            })
                        }
                    }
                })
            }
            else
            {
                var jsonResponse = JSON.stringify(pbxUserConf);
                res.end(jsonResponse);
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

server.put('/DVP/API/' + hostVersion + '/PBXService/NewFollowMeConfig/:userUuid', function(req, res, next)
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
            var fmData = dbModel.FollowMe.build({

                DestinationNumber: req.body.DestinationNumber,
                RingTimeout: req.body.RingTimeout,
                Priority: req.body.Priority,
                CompanyId: 1,
                TenantId: 3,
                ObjClass: 'PBX',
                ObjType: 'FOLLOW_ME',
                ObjCategory: req.body.ObjCategory
            });

            pbxBackendHandler.AddFollowMeDB(reqId, userUuid, 1, 3, fmData, function (err, isSuccess, addResult) {
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

server.del('/DVP/API/' + hostVersion + '/PBXService/FollowMeConfig/:fmId', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var fmId = req.params.fmId;

        logger.debug('[DVP-PBXService.DeleteFollowMeConfig] - [%s] - HTTP Request Received - Req Params - fmId : %s', reqId, fmId);

        if(fmId && securityToken)
        {

            pbxBackendHandler.DeleteFollowMeDB(reqId, fmId, 1, 3, function (err, delResult)
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

server.put('/DVP/API/' + hostVersion + '/PBXService/NewPbxUser/:sipUserUuid', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-PBXService.NewPbxUser] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            var sipUserUuid = req.body.SipUserUuid;

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
                        CompanyId: 1,
                        TenantId: 3,
                        ObjClass: 'PBX',
                        ObjType: 'PBXUSER',
                        ObjCategory: 'GENERAL'
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
                            var jsonString = messageFormatter.FormatMessage(err, "Add PBX User Failed", true, addResult);
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

server.put('/DVP/API/' + hostVersion + '/PBXService/NewPbxUserTemplate', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-PBXService.NewPbxUserTemplate] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            var userStatus = req.body.UserStatus;
            var callDivertNum = req.body.CallDivertNumber;
            var advRouteMethod = req.body.AdvancedRouteMethod;

            if((userStatus === 'DND' || userStatus === 'CALL_DIVERT' || userStatus === 'AVAILABLE') && (advRouteMethod === 'FORWARD' || advRouteMethod === 'FOLLOW_ME' || advRouteMethod === 'NONE'))
            {
                var pbxUsrTemplate = dbModel.PBXUserTemplate.build({

                    UserStatus: userStatus,
                    FollowMeMechanism: 'SEQUENTIAL',
                    CallDivertNumber: callDivertNum,
                    AdvancedRouteMethod: advRouteMethod,
                    CompanyId: 1,
                    TenantId: 3,
                    ObjClass: 'PBX',
                    ObjType: 'PBXUSER',
                    ObjCategory: 'TEMPLATE'
                });

                pbxBackendHandler.AddPbxUserTemplateDB(reqId, pbxUsrTemplate, function(err, addResult)
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
                var jsonString = messageFormatter.FormatMessage(new Error('Unsupported user status or advanced route method'), "Unsupported user status or advanced route method", false, false);
                logger.debug('[DVP-PBXService.NewPbxUserTemplate] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }
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

server.post('/DVP/API/' + hostVersion + '/PBXService/AssignPbxTemplate', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-PBXService.AssignPbxTemplate] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            var pbxUserUuid = req.body.PbxUserUuid;
            var tempId = req.body.TemplateId;

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

server.post('/DVP/API/' + hostVersion + '/PBXService/UnAssignPbxTemplate', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-PBXService.UnAssignPbxTemplate] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            var pbxUserUuid = req.body.PbxUserUuid;

            if(pbxUserUuid)
            {
                pbxBackendHandler.UnAssignTemplateFromUserDB(reqId, pbxUserUuid, 1, 3, function(err, unAssignResult)
                {
                    if(err)
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
                var jsonString = messageFormatter.FormatMessage(new Error('Pbx user id not given'), "Pbx user id not given", false, false);
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

server.del('/DVP/API/' + hostVersion + '/PBXService/PbxUser/:pbxUserUuid', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var pbxUserUuid = req.params.pbxUserUuid;

        logger.debug('[DVP-PBXService.DeletePBXUser] - [%s] - HTTP Request Received - Req Params - PbxUserUuid : %s', reqId, pbxUserUuid);

        if(pbxUserUuid && securityToken)
        {

            pbxBackendHandler.DeletePbxUserDB(reqId, pbxUserUuid, 1, 3, function (err, delResult)
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

server.del('/DVP/API/' + hostVersion + '/PBXService/PbxUserTemplate/:templateId', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var templateId = req.params.templateId;

        logger.debug('[DVP-PBXService.DeletePBXUserTemplate] - [%s] - HTTP Request Received - Req Params - TemplateId : %s', reqId, templateId);

        if(templateId && securityToken)
        {

            pbxBackendHandler.DeletePbxUserTemplateDB(reqId, templateId, 1, 3, function (err, delResult)
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

server.get('/DVP/API/' + hostVersion + '/PBXService/PbxUserByUuid/:uuid', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var uuid = req.params.uuid;

        logger.debug('[DVP-PBXService.GetPbxUserByUuid] - [%s] - HTTP Request Received - Req Params - uuid : %s', reqId, uuid);

        if(uuid && securityToken)
        {

            pbxBackendHandler.GetPbxUserByIdDB(reqId, uuid, 1, 3, function (err, pbxUser)
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

server.get('/DVP/API/' + hostVersion + '/PBXService/FollowMeById/:id', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var id = req.params.id;

        logger.debug('[DVP-PBXService.FollowMeById] - [%s] - HTTP Request Received - Req Params - id : %s', reqId, id);

        if(id && securityToken)
        {

            pbxBackendHandler.GetFollowMeByIdDB(reqId, id, 1, 3, function (err, fmInfo)
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

server.get('/DVP/API/' + hostVersion + '/PBXService/PbxUserTemplateById/:id', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var id = req.params.id;

        logger.debug('[DVP-PBXService.PbxUserTemplateById] - [%s] - HTTP Request Received - Req Params - uuid : %s', reqId, id);

        if(id && securityToken)
        {

            pbxBackendHandler.GetPbxUserTemplateByIdDB(reqId, id, 1, 3, function (err, pbxUserTemplate)
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

server.get('/DVP/API/' + hostVersion + '/PBXService/PbxUsersByCompany', function(req, res, next)
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

server.get('/DVP/API/' + hostVersion + '/PBXService/PbxUserTemplatesByCompany', function(req, res, next)
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

server.get('/DVP/API/' + hostVersion + '/PBXService/FollowMeConfigForUser/:userUuid', function(req, res, next)
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

server.post('/DVP/API/' + hostVersion + '/PBXService/PbxMasterData', function(req, res, next)
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

server.get('/DVP/API/' + hostVersion + '/PBXService/PbxMasterData/:id', function(req, res, next)
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