var dbModel = require('DVP-DBModels');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;
var externAccessor = require('./PbxExternalApiAccess.js');

var AddPbxMasterDataDB = function(reqId, pbxMasterData, callback)
{
    try
    {
        dbModel.PBXMasterData.find({where: [{id: pbxMasterData.id}]})
            .complete(function (err, pbxMData)
            {
                if(err)
                {
                    callback(err, false);
                }
                else
                {
                    if(pbxMData)
                    {
                        if(pbxMData.CompanyId == pbxMasterData.CompanyId && pbxMData.TenantId == pbxMasterData.TenantId)
                        {
                            //allow update
                            pbxMData.updateAttributes({BypassMedia: pbxMasterData.BypassMedia, IgnoreEarlyMedia: pbxMasterData.IgnoreEarlyMedia, VoicemailEnabled: pbxMasterData.VoicemailEnabled}).complete(function (err)
                            {
                                if(err)
                                {
                                    logger.error('[DVP-PBXService.AddPbxMasterData] PGSQL Update call rule with trunk number query failed', err);
                                    callback(err, false);
                                }
                                else
                                {
                                    logger.info('[DVP-PBXService.AddPbxMasterData] PGSQL Update call rule with trunk number query success');
                                    callback(undefined, true);
                                }

                            });
                        }
                        else
                        {
                            callback(new Error('Id provided does not belong to your company'), false);
                        }
                    }
                    else
                    {
                        //Save
                        var pbxMastData = dbModel.PBXMasterData.build({
                            BypassMedia: pbxMasterData.BypassMedia,
                            IgnoreEarlyMedia: pbxMasterData.IgnoreEarlyMedia,
                            VoicemailEnabled: pbxMasterData.VoicemailEnabled,
                            CompanyId: 1,
                            TenantId: 3,
                            ObjClass: "PBX",
                            ObjType: "PBXMASTERDATA",
                            ObjCategory: "DEFAULT"
                        });
                        pbxMastData
                            .save()
                            .complete(function (err)
                            {
                                if (err)
                                {
                                    logger.error('[DVP-PBXService.AddPbxMasterData] - [%s] - PGSQL query failed', reqId, err);
                                    callback(err, false);
                                }
                                else
                                {
                                    logger.debug('[DVP-PBXService.AddPbxMasterData] - [%s] - PGSQL query success', reqId);
                                    callback(undefined, true);
                                }

                            })
                    }
                }

            });


    }
    catch(ex)
    {
        callback(ex, false);
    }

};

var SetDayPersonalGreetingDB = function(reqId, userUuid, greetingFile, companyId, tenantId)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUser)
            {
                if(err)
                {
                    logger.error('[DVP-PBXService.SetDayPersonalGreetingDB] - [%s] - PGSQL get pbx user query failed', reqId, err);
                    callback(err, false);
                }
                else if(pbxUser)
                {
                    pbxUser.updateAttributes({DayGreetingFile: greetingFile}).complete(function (err)
                    {
                        if (err)
                        {
                            logger.error('[DVP-PBXService.SetDayPersonalGreetingDB] PGSQL Update pbx user with day greeting query failed', err);
                            callback(err, false);
                        }
                        else
                        {
                            logger.info('[DVP-PBXService.SetDayPersonalGreetingDB] PGSQL Update pbx user with day greeting query success');
                            callback(undefined, true);
                        }
                    });

                }
                else
                {
                    logger.debug('[DVP-PBXService.SetDayPersonalGreetingDB] - [%s] - PGSQL get pbx user query success', reqId);
                    callback(new Error('User not found'), false);
                }
            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.SetPersonalGreetingDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
}

var SetNightPersonalGreetingDB = function(reqId, userUuid, greetingFile, companyId, tenantId)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUser)
            {
                if(err)
                {
                    logger.error('[DVP-PBXService.SetNightPersonalGreetingDB] - [%s] - PGSQL get pbx user query failed', reqId, err);
                    callback(err, false);
                }
                else if(pbxUser)
                {
                    pbxUser.updateAttributes({NightGreetingFile: greetingFile}).complete(function (err)
                    {
                        if (err)
                        {
                            logger.error('[DVP-PBXService.SetNightPersonalGreetingDB] PGSQL Update pbx user with night greeting query failed', err);
                            callback(err, false);
                        }
                        else
                        {
                            logger.info('[DVP-PBXService.SetNightPersonalGreetingDB] PGSQL Update pbx user with night greeting query success');
                            callback(undefined, true);
                        }
                    });

                }
                else
                {
                    logger.debug('[DVP-PBXService.SetNightPersonalGreetingDB] - [%s] - PGSQL get pbx user query success', reqId);
                    callback(new Error('User not found'), false);
                }
            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.SetPersonalGreetingDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
}

var EnablePersonalGreetingDB = function(reqId, userUuid, isEnabled, companyId, tenantId)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUser)
            {
                if(err)
                {
                    logger.error('[DVP-PBXService.EnablePersonalGreetingDB] - [%s] - PGSQL get pbx user query failed', reqId, err);
                    callback(err, false);
                }
                else if(pbxUser)
                {
                    pbxUser.updateAttributes({PersonalGreetingEnabled: isEnabled}).complete(function (err)
                    {
                        if (err)
                        {
                            logger.error('[DVP-PBXService.EnablePersonalGreetingDB] PGSQL Update pbx user with enable greeting query failed', err);
                            callback(err, false);
                        }
                        else
                        {
                            logger.info('[DVP-PBXService.EnablePersonalGreetingDB] PGSQL Update pbx user with enable greeting query success');
                            callback(undefined, true);
                        }
                    });

                }
                else
                {
                    logger.debug('[DVP-PBXService.EnablePersonalGreetingDB] - [%s] - PGSQL get pbx user query success', reqId);
                    callback(new Error('User not found'), false);
                }
            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.EnablePersonalGreetingDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
}

var RemovePbxUserAllowedNumberDB = function(reqId, userUuid, companyId, tenantId, numberToRemove, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUser)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - PGSQL get pbx user by uuid query failed', reqId, err);
                    callback(err, false);
                }
                else if(pbxUser)
                {
                    logger.debug('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - PGSQL get pbx user by uuid query success', reqId);

                    if(pbxUser.AllowedNumbers)
                    {
                        var allowedNumberArr = JSON.parse(pbxUser.AllowedNumbers);

                        var index = allowedNumberArr.indexOf(numberToRemove);

                        if(index > -1)
                        {
                            allowedNumberArr.splice(index, 1);
                        }

                        pbxUser.updateAttributes({AllowedNumbers: JSON.stringify(allowedNumberArr)}).complete(function (err)
                        {
                            if(err)
                            {
                                logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] PGSQL Update pbx user with allowed numbers query failed', err);
                                callback(err, false);
                            }
                            else
                            {
                                logger.info('[DVP-PBXService.AddPbxUserAllowedNumbersDB] PGSQL Update pbx user with allowed numbers query success');
                                callback(undefined, true);
                            }

                        });

                    }
                    else
                    {
                        callback(undefined, true);
                    }
                }
                else
                {
                    logger.debug('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - PGSQL get pbx user by uuid query success', reqId);
                    callback(new Error('User not found'), false);
                }
            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var AddPbxUserAllowedNumbersDB = function(reqId, userUuid, companyId, tenantId, numberArr, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUser)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - PGSQL get pbx user by uuid query failed', reqId, err);
                    callback(err, false);
                }
                else if(pbxUser)
                {
                    logger.debug('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - PGSQL get pbx user by uuid query success', reqId);

                    if(pbxUser.AllowedNumbers)
                    {
                        var allowedNumberArr = JSON.parse(pbxUser.AllowedNumbers);

                        numberArr.forEach(function(num)
                        {
                            var index = allowedNumberArr.indexOf(num);

                            if(index <= -1)
                            {
                                allowedNumberArr.push(num);
                            }
                        })

                        pbxUser.updateAttributes({AllowedNumbers: JSON.stringify(allowedNumberArr)}).complete(function (err)
                        {
                            if(err)
                            {
                                logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] PGSQL Update pbx user with allowed numbers query failed', err);
                                callback(err, false);
                            }
                            else
                            {
                                logger.info('[DVP-PBXService.AddPbxUserAllowedNumbersDB] PGSQL Update pbx user with allowed numbers query success');
                                callback(undefined, true);
                            }

                        });

                    }
                    else
                    {
                        var allowedNumberArr = [];

                        numberArr.forEach(function(num)
                        {
                            allowedNumberArr.push(num);
                        });

                        pbxUser.updateAttributes({AllowedNumbers: JSON.stringify(allowedNumberArr)}).complete(function (err)
                        {
                            if(err)
                            {
                                logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] PGSQL Update pbx user with allowed numbers query failed', err);
                                callback(err, false);
                            }
                            else
                            {
                                logger.info('[DVP-PBXService.AddPbxUserAllowedNumbersDB] PGSQL Update pbx user with allowed numbers query success');
                                callback(undefined, true);
                            }

                        });
                    }
                }
                else
                {
                    logger.debug('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - PGSQL get pbx user by uuid query success', reqId);
                    callback(new Error('User not found'), false);
                }
            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var AddFollowMeDB = function(reqId, userUuid, companyId, tenantId, followMeData, securityToken, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUser)
            {
                if(err)
                {
                    logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Get PBX User PGSQL query failed', reqId, err);
                    callback(err, false, -1);
                }
                else if(pbxUser)
                {
                    logger.debug('[DVP-PBXService.AddFollowMeDB] - [%s] - Get PBX User PGSQL query success', reqId);
                    if(followMeData.ObjCategory === 'PBXUSER')
                    {
                        if(followMeData.DestinationUserUuid)
                        {
                            dbModel.PBXUser.find({where: [{UserUuid: followMeData.DestinationUserUuid},{TenantId: tenantId}]})
                                .complete(function (err, dstUser)
                                {
                                    if(err)
                                    {
                                        logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - PGSQL get pbx user query failed', reqId, err);
                                        callback(new Error('Cannot find a pbx user with given destination uuid'), false, -1);
                                    }
                                    else if(dstUser)
                                    {
                                        logger.debug('[DVP-PBXService.AddFollowMeDB] - [%s] - PGSQL get pbx user query success', reqId);

                                        externAccessor.RemoteGetSipUserDetailsForUuid(reqId, followMeData.DestinationUserUuid, securityToken, function(err, sipUsrObj)
                                        {
                                            if(err)
                                            {
                                                callback(err, false, -1);
                                            }
                                            else if(sipUsrObj)
                                            {
                                                var followMeConfig = dbModel.FollowMe.build({

                                                    DestinationNumber: sipUsrObj.SipExtension,
                                                    RingTimeout: followMeData.RingTimeout,
                                                    Priority: followMeData.Priority,
                                                    CompanyId: 1,
                                                    TenantId: 1,
                                                    ObjClass: 'PBX',
                                                    ObjType: 'FOLLOW_ME',
                                                    ObjCategory: followMeData.ObjCategory
                                                });

                                                followMeConfig
                                                    .save()
                                                    .complete(function (err)
                                                    {
                                                        if (err)
                                                        {
                                                            logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Insert Follow Me PGSQL query failed', reqId, err);
                                                            callback(err, false, -1);
                                                        }
                                                        else
                                                        {
                                                            logger.debug('[DVP-PBXService.AddFollowMeDB] - [%s] - Insert Follow Me PGSQL query success', reqId);

                                                            followMeConfig.addPBXUser(pbxUser, function(err, result)
                                                            {
                                                                if(err)
                                                                {
                                                                    logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Update Follow Me record with PBXUser Uuid PGSQL query failed', reqId, err);
                                                                    callback(new Error('FollowMe configuration added but error occurred while assigning it to user'), false, followMeConfig.id);
                                                                }
                                                                else
                                                                {
                                                                    logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Update Follow Me record with PBXUser Uuid PGSQL query sucess', reqId);

                                                                    followMeConfig.addDestinationUser(dstUser, function(err, result)
                                                                    {
                                                                        if(err)
                                                                        {
                                                                            logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Update Follow Me record with Destination User Uuid PGSQL query failed', reqId, err);
                                                                            callback(new Error('FollowMe configuration added but error occurred while assigning it to destination user'), false, followMeConfig.id);
                                                                        }
                                                                        else
                                                                        {
                                                                            logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Update Follow Me record with Destination user Uuid PGSQL query sucess', reqId);
                                                                            callback(undefined, true, followMeConfig.id);
                                                                        }
                                                                    });

                                                                }
                                                            });
                                                        }

                                                    })
                                            }
                                            else
                                            {
                                                callback(new Error('User not registered in Duo Voice Platform'), false, -1);
                                            }
                                        });
                                        //save and add the mapping

                                    }
                                    else
                                    {
                                        logger.debug('[DVP-PBXService.AddFollowMeDB] - [%s] - PGSQL get destination pbx user query success', reqId);
                                        callback(new Error('Cannot find a pbx user with given destination uuid'), false, -1);
                                    }
                                });
                        }
                        else
                        {
                            callback(new Error('Destination user uuid must be given for a PBXUSER category record'), false, -1);
                        }
                    }
                    else if(followMeData.ObjCategory === 'USER' || followMeData.ObjCategory === 'GATEWAY')
                    {
                        var followMeConfig = dbModel.FollowMe.build({

                            DestinationNumber: followMeData.DestinationNumber,
                            RingTimeout: followMeData.RingTimeout,
                            Priority: followMeData.Priority,
                            CompanyId: 1,
                            TenantId: 1,
                            ObjClass: 'PBX',
                            ObjType: 'FOLLOW_ME',
                            ObjCategory: followMeData.ObjCategory
                        });

                        followMeConfig
                            .save()
                            .complete(function (err)
                            {
                                if (err)
                                {
                                    logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Insert Follow Me PGSQL query failed', reqId, err);
                                    callback(err, false, -1);
                                }
                                else
                                {
                                    logger.debug('[DVP-PBXService.AddFollowMeDB] - [%s] - Insert Follow Me PGSQL query success', reqId);

                                    followMeConfig.addPBXUser(pbxUser, function(err, result)
                                    {
                                        if(err)
                                        {
                                            logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Update Follow Me record with PBXUser Uuid PGSQL query failed', reqId, err);
                                            callback(new Error('FollowMe configuration added but error occurred while assigning it to user'), false, followMeConfig.id);
                                        }
                                        else
                                        {
                                            logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Update Follow Me record with PBXUser Uuid PGSQL query sucess', reqId);


                                            callback(undefined, true, followMeConfig.id);
                                        }
                                    });
                                }

                            })
                    }
                    else
                    {
                        callback(new Error('Invalid Follow Me Category'), false, -1);
                    }

                }
                else
                {
                    logger.debug('[DVP-PBXService.AddFollowMeDB] - [%s] - Get PBX User PGSQL query success', reqId);
                    callback(new Error('PBX User not found'), false, -1);
                }

            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var GetForwardingByIdDB = function(reqId, fwdId, companyId, tenantId, callback)
{
    try
    {
        dbModel.Forwarding.find({where: [{id: fwdId},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, fwdConf)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.GetForwardingByIdDB] - [%s] - PGSQL get forwarding config by id query failed', reqId, err);
                    callback(err, undefined);
                }
                else
                {
                    logger.debug('[DVP-PBXService.GetForwardingByIdDB] - [%s] - PGSQL get forwarding config by id query success', reqId);
                    callback(err, fwdConf);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetForwardingByIdDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }

};

var GetForwardingByUserDB = function(reqId, userUuid, companyId, tenantId, callback)
{
    var emptyList = [];
    try
    {
        dbModel.Forwarding.findAll({where: [{PBXUserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, fwdConfList)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.GetForwardingByUserDB] - [%s] - PGSQL get forwarding config list by user uuid query failed', reqId, err);
                    callback(err, emptyList);
                }
                else
                {
                    logger.debug('[DVP-PBXService.GetForwardingByUserDB] - [%s] - PGSQL get forwarding config list by user uuid query success', reqId);
                    callback(err, fwdConfList);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetForwardingByUserDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, emptyList);
    }

};

var AddForwardingDB = function(reqId, userUuid, companyId, tenantId, fwdConfig, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUser)
            {
                if(err)
                {
                    logger.error('[DVP-PBXService.AddForwardingDB] - [%s] - Get PBX User PGSQL query failed', reqId, err);
                    callback(err, false, -1);
                }
                else if(pbxUser)
                {
                    logger.debug('[DVP-PBXService.AddForwardingDB] - [%s] - Get PBX User PGSQL query success', reqId);
                    fwdConfig
                        .save()
                        .complete(function (err)
                        {
                            if (err)
                            {
                                logger.error('[DVP-PBXService.AddForwardingDB] - [%s] - Insert Forwarding PGSQL query failed', reqId, err);
                                callback(err, false, -1);
                            }
                            else
                            {
                                logger.debug('[DVP-PBXService.AddForwardingDB] - [%s] - Insert Forwarding PGSQL query success', reqId);

                                fwdConfig.addPBXUser(pbxUser, function(err, result)
                                {
                                    if(err)
                                    {
                                        logger.error('[DVP-PBXService.AddForwardingDB] - [%s] - Update Follow Me record with PBXUser Uuid PGSQL query failed', reqId, err);
                                        callback(new Error('Forwarding configuration added but error occurred while assigning it to user'), false, followMeConfig.id);
                                    }
                                    else
                                    {
                                        logger.error('[DVP-PBXService.AddForwardingDB] - [%s] - Update Forward record with PBXUser Uuid PGSQL query sucess', reqId);
                                        callback(undefined, true, fwdConfig.id);
                                    }
                                });
                            }

                        })
                }
                else
                {
                    logger.debug('[DVP-PBXService.AddForwardingDB] - [%s] - Get PBX User PGSQL query success', reqId);
                    callback(new Error('PBX User not found'), false, -1);
                }

            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AddForwardingDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var DeleteForwardingDB = function(reqId, fwdId, companyId, tenantId, callback)
{
    try
    {
        dbModel.Forwarding.find({where: [{id: fwdId},{CompanyId: companyId},{TenantId: tenantId}]}).complete(function (err, fwdRec)
        {
            if (err)
            {
                logger.error('[DVP-PBXService.DeleteForwardingDB] - [%s] - PGSQL Get forwarding by Id query failed', reqId, err);
                callback(err, false);
            }
            else
            {
                logger.debug('[DVP-PBXService.DeleteForwardingDB] - [%s] - PGSQL Get forwarding by Id query success', reqId);
                fwdRec.destroy().complete(function (err, result)
                {
                    if(err)
                    {
                        logger.error('[DVP-RuleService.DeleteForwardingDB] PGSQL Delete forwarding query failed', err);
                        callback(err, false);
                    }
                    else
                    {
                        logger.error('[DVP-RuleService.DeleteForwardingDB] PGSQL Delete forwarding query success', err);
                        callback(err, true);
                    }
                });
            }

        })

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.DeleteForwardingDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
};

var DeleteFollowMeDB = function(reqId, fmId, companyId, tenantId, callback)
{
    try
    {
        dbModel.FollowMe.find({where: [{id: fmId},{CompanyId: companyId},{TenantId: tenantId}]}).complete(function (err, fmRec)
        {
            if (err)
            {
                logger.error('[DVP-PBXService.DeleteFollowMeDB] - [%s] - PGSQL Get Follow Me by Id query failed', reqId, err);
                callback(err, false);
            }
            else
            {
                logger.debug('[DVP-PBXService.DeleteFollowMeDB] - [%s] - PGSQL Get Follow Me by Id query success', reqId);
                fmRec.destroy().complete(function (err, result)
                {
                    if(err)
                    {
                        logger.error('[DVP-RuleService.DeleteFollowMeDB] PGSQL Delete pbx user query failed', err);
                        callback(err, false);
                    }
                    else
                    {
                        logger.error('[DVP-RuleService.DeleteFollowMeDB] PGSQL Delete pbx user query success', err);
                        callback(err, true);
                    }
                });
            }

        })

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.DeleteFollowMeDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
};

var GetFollowMeByIdDB = function(reqId, fmId, companyId, tenantId, callback)
{
    try
    {
        dbModel.FollowMe.find({where: [{id: fmId},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, fmConf)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.GetFollowMeByIdDB] - [%s] - PGSQL get follow me config by id query failed', reqId, err);
                    callback(err, undefined);
                }
                else
                {
                    logger.debug('[DVP-PBXService.GetFollowMeByIdDB] - [%s] - PGSQL get follow me config by id query success', reqId);
                    callback(err, fmConf);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetFollowMeByIdDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }

};

var GetFollowMeByUserDB = function(reqId, userUuid, companyId, tenantId, callback)
{
    var emptyList = [];
    try
    {
        dbModel.FollowMe.findAll({where: [{PBXUserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}], include: [{model: dbModel.PBXUser, as: 'DestinationUser'}]})
            .complete(function (err, fmConfList)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.GetFollowMeByUserDB] - [%s] - PGSQL get follow me config list by user uuid query failed', reqId, err);
                    callback(err, emptyList);
                }
                else
                {
                    logger.debug('[DVP-PBXService.GetFollowMeByUserDB] - [%s] - PGSQL get follow me config list by user uuid query success', reqId);
                    callback(err, fmConfList);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetFollowMeByUserDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, emptyList);
    }

};

var AddPbxUserDB = function(reqId, pbxUserData, callback)
{
    try
    {
        pbxUserData
            .save()
            .complete(function (err)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.AddPbxUserDB] - [%s] - PGSQL query failed', reqId, err);
                    callback(err, false);
                }
                else
                {
                    logger.debug('[DVP-PBXService.AddPbxUserDB] - [%s] - PGSQL query success', reqId);
                    callback(undefined, true);
                }

            })

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AddPbxUserDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var DeletePbxUserDB = function(reqId, pbxUserUuid, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: pbxUserUuid},{CompanyId: companyId},{TenantId: tenantId}]}).complete(function (err, userRec)
        {
            if (err)
            {
                logger.error('[DVP-PBXService.DeletePbxUserDB] - [%s] - PGSQL Get PBX User query failed', reqId, err);
                callback(err, false);
            }
            else
            {
                userRec.destroy().complete(function (err, result)
                {
                    if(err)
                    {
                        logger.error('[DVP-RuleService.DeletePbxUserDB] PGSQL Delete pbx user query failed', err);
                        callback(err, false);
                    }
                    else
                    {
                        logger.error('[DVP-RuleService.DeletePbxUserDB] PGSQL Delete pbx user query success', err);
                        callback(err, true);
                    }
                });
            }

        })

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.DeletePbxUserDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var AddFeatureCodesDB = function(reqId, featureCodeProfile, companyId, tenantId, callback)
{
    try
    {
        dbModel.FeatureCode.find({where: [{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, featureCodeTemplate)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.AddFeatureCodesDB] - [%s] - PGSQL get feature code by company query failed', reqId, err);
                    callback(err, false);
                }
                else if(featureCodeTemplate)
                {
                    logger.debug('[DVP-PBXService.AddFeatureCodesDB] - [%s] - PGSQL get feature code by company query success', reqId);


                    featureCodeTemplate.updateAttributes({PickUp: featureCodeProfile.PickUp, Intercept: featureCodeProfile.Intercept, Park: featureCodeProfile.PickUp, VoiceMail: featureCodeProfile.PickUp, Barge: featureCodeProfile.PickUp}).complete(function (err)
                    {
                        if(err)
                        {
                            logger.error('[DVP-PBXService.AddFeatureCodesDB] PGSQL Update pbx user with allowed numbers query failed', err);
                            callback(err, false);
                        }
                        else
                        {
                            logger.info('[DVP-PBXService.AddFeatureCodesDB] PGSQL Update pbx user with allowed numbers query success');
                            callback(undefined, true);
                        }

                    });
                }
                else
                {
                    logger.debug('[DVP-PBXService.AddFeatureCodesDB] - [%s] - PGSQL get feature code by company query success', reqId);

                    var fc = dbModel.FeatureCode.build({PickUp: featureCodeProfile.PickUp, Intercept: featureCodeProfile.Intercept, Park: featureCodeProfile.PickUp, VoiceMail: featureCodeProfile.PickUp, Barge: featureCodeProfile.PickUp, CompanyId: 1, TenantId: 3, ObjClass: 'PBX', ObjType: 'FeatureCodes', ObjCategory: 'FeatureCodes'});

                    fc
                        .save()
                        .complete(function (err)
                        {
                            if (err)
                            {
                                logger.error('[DVP-PBXService.AddFeatureCodesDB] - [%s] - PGSQL query failed', reqId, err);
                                callback(err, false);
                            }
                            else
                            {
                                logger.debug('[DVP-PBXService.AddFeatureCodesDB] - [%s] - PGSQL query success', reqId);
                                callback(undefined, true);
                            }

                        });
                }
            });


    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AddFeatureCodesDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var DeletePbxUserTemplateDB = function(reqId, templateId, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXUserTemplate.find({where: [{id: templateId},{CompanyId: companyId},{TenantId: tenantId}]}).complete(function (err, userTempRec)
        {
            if (err)
            {
                logger.error('[DVP-PBXService.DeletePbxUserTemplateDB] - [%s] - PGSQL Get PBX User template query failed', reqId, err);
                callback(err, false);
            }
            else
            {
                userTempRec.destroy().complete(function (err, result)
                {
                    if(err)
                    {
                        logger.error('[DVP-RuleService.DeletePbxUserTemplateDB] PGSQL Delete pbx user template query failed', err);
                        callback(err, false);
                    }
                    else
                    {
                        logger.error('[DVP-RuleService.DeletePbxUserTemplateDB] PGSQL Delete pbx user template query success', err);
                        callback(err, true);
                    }
                });
            }

        })

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.DeletePbxUserTemplateDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var AddPbxUserTemplateDB = function(reqId, pbxUserTemplate, callback)
{
    try
    {
        var callDivertUser = '';
        if(pbxUserTemplate.ObjCategory === 'PBXUSER')
        {
            callDivertUser = pbxUserTemplate.CallDivertUser;
        }

        var pbxUsrTemplate = dbModel.PBXUserTemplate.build({

            CallDivertNumber: pbxUserTemplate.CallDivertNumber,
            CallDivertUser: callDivertUser,
            CompanyId: 1,
            TenantId: 1,
            ObjClass: 'PBX',
            ObjType: 'PBXUSER',
            ObjCategory: pbxUserTemplate.ObjCategory
        });

        pbxUsrTemplate
            .save()
            .complete(function (err)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.AddPbxUserTemplateDB] - [%s] - PGSQL query failed', reqId, err);
                    callback(err, false);
                }
                else
                {
                    logger.debug('[DVP-PBXService.AddPbxUserTemplateDB] - [%s] - PGSQL query success', reqId);
                    callback(undefined, true);
                }

            })

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AddPbxUserTemplateDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var GetPbxUsersForCompanyDB = function(reqId, companyId, tenantId, callback)
{
    var emptyArr = [];
    try
    {
        dbModel.PBXUser.findAll({where: [{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUsers)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.GetPbxUsersForCompanyDB] - [%s] - PGSQL get pbx user by company query failed', reqId, err);
                    callback(err, emptyArr);
                }
                else
                {
                    logger.debug('[DVP-PBXService.GetPbxUsersForCompanyDB] - [%s] - PGSQL get pbx user by company query success', reqId);
                    callback(err, pbxUsers);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetPbxUsersForCompanyDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, emptyArr);
    }

};

var GetPbxUserTemplatesForCompanyDB = function(reqId, companyId, tenantId, callback)
{
    var emptyArr = [];
    try
    {
        dbModel.PBXUserTemplate.findAll({where: [{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUsersTemplates)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.GetPbxUserTemplatesForCompanyDB] - [%s] - PGSQL get pbx user templates by company query failed', reqId, err);
                    callback(err, emptyArr);
                }
                else
                {
                    logger.debug('[DVP-PBXService.GetPbxUserTemplatesForCompanyDB] - [%s] - PGSQL get pbx user templates by company query success', reqId);
                    callback(err, pbxUsersTemplates);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetPbxUserTemplatesForCompanyDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, emptyArr);
    }

};

var GetFeatureCodesForCompanyDB = function(reqId, companyId, tenantId, callback)
{
    try
    {
        dbModel.FeatureCode.find({where: [{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, fc)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.GetFeatureCodesForCompanyDB] - [%s] - PGSQL get feature codes query failed', reqId, err);
                    callback(err, undefined);
                }
                else
                {
                    logger.debug('[DVP-PBXService.GetFeatureCodesForCompanyDB] - [%s] - PGSQL get feature codes query success', reqId);
                    callback(err, fc);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetFeatureCodesForCompanyDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }

};

var GetPbxUserByIdDB = function(reqId, pbxUserUuid, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: pbxUserUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUser)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.GetPbxUserByIdDB] - [%s] - PGSQL get pbx user by uuid query failed', reqId, err);
                    callback(err, undefined);
                }
                else
                {
                    logger.debug('[DVP-PBXService.GetPbxUserByIdDB] - [%s] - PGSQL get pbx user by uuid query success', reqId);
                    callback(err, pbxUser);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetPbxUserByIdDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }

};

var GetAllPbxUserDetailsByIdDB = function(reqId, pbxUserUuid, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: pbxUserUuid},{CompanyId: companyId},{TenantId: tenantId}], include:[{model: dbModel.PBXUserTemplate, as:'PBXUserTemplate'},{model: dbModel.Forwarding, as:'Forwarding'}]})
            .complete(function (err, pbxUserDetails)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.GetAllPbxUserDetailsByIdDB] - [%s] - PGSQL get all pbx user details by uuid query failed', reqId, err);
                    callback(err, undefined);
                }
                else
                {
                    logger.debug('[DVP-PBXService.GetAllPbxUserDetailsByIdDB] - [%s] - PGSQL get all pbx user details by uuid query success', reqId);
                    callback(err, pbxUserDetails);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetAllPbxUserDetailsByIdDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }

};

var GetPbxUserTemplateByIdDB = function(reqId, templateId, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXUserTemplate.find({where: [{id: templateId},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUserTempl)
            {
                if (err)
                {
                    logger.error('[DVP-PBXService.GetPbxUserTemplateByIdDB] - [%s] - PGSQL get pbx user template by id query failed', reqId, err);
                    callback(err, undefined);
                }
                else
                {
                    logger.debug('[DVP-PBXService.GetPbxUserTemplateByIdDB] - [%s] - PGSQL get pbx user templae by id query success', reqId);
                    callback(err, pbxUserTempl);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetPbxUserTemplateByIdDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }

};

var GetPbxMasterData = function(reqId, pbxMasterId, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXMasterData.find({where: [{id: pbxMasterId},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxMData)
            {
                callback(err, pbxMData);
            });
    }
    catch(ex)
    {
        callback(ex, false);
    }

};

var UnAssignTemplateFromUserDB = function(reqId, pbxUserUuid, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: pbxUserUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUsr)
            {
                if(err)
                {
                    logger.error('[DVP-PBXService.UnAssignTemplateFromUserDB] - [%s] - PGSQL Get Pbx User query failed', reqId, err);
                    callback(err, false);
                }
                else if(pbxUsr)
                {
                    logger.debug('[DVP-PBXService.UnAssignTemplateFromUserDB] - [%s] - PGSQL Get Template query success', reqId);
                    pbxUsr.setPBXUserTemplate(null).complete(function (err, result)
                    {
                        if(err)
                        {
                            logger.error('[DVP-PBXService.UnAssignTemplateFromUserDB] - [%s] - PGSQL Update pbx user with template id query failed', reqId, err);
                            callback(err, false);
                        }
                        else
                        {
                            logger.debug('[DVP-PBXService.UnAssignTemplateFromUserDB] - [%s] - PGSQL Update pbx user with template id query success', reqId);
                            callback(err, true);
                        }

                    });
                }
                else
                {
                    logger.debug('[DVP-PBXService.UnAssignTemplateFromUserDB] - [%s] - PGSQL Get Pbx User query success', reqId);
                    logger.warn('DVP-PBXService.UnAssignTemplateFromUserDB] - [%s] - User not found', reqId);

                    callback(new Error('PBX User not found'), false);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
};

var AssignTemplateToUserDB = function(reqId, pbxUserUuid, pbxTemplateId, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: pbxUserUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, pbxUsr)
            {
                if(err)
                {
                    logger.error('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Get Pbx User query failed', reqId, err);
                    callback(err, false);
                }
                else if(pbxUsr)
                {
                    logger.debug('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Get Pbx User query success', reqId);

                    dbModel.PBXUserTemplate.find({where: [{id: pbxTemplateId},{CompanyId: companyId},{TenantId: tenantId}]})
                        .complete(function (err, pbxUsrTemp)
                        {
                            if(err)
                            {
                                logger.error('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Get Template query failed', reqId, err);
                                callback(err, false);
                            }
                            else if(pbxUsrTemp)
                            {
                                logger.debug('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Get Template query success', reqId);
                                pbxUsr.setPBXUserTemplate(pbxUsrTemp).complete(function (err, result)
                                {
                                    if(err)
                                    {
                                        logger.error('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Update pbx user with template id query failed', reqId, err);
                                        callback(err, false);
                                    }
                                    else
                                    {
                                        logger.debug('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Update pbx user with template id query success', reqId);
                                        callback(err, true);
                                    }

                                });
                            }
                            else
                            {
                                logger.debug('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Get Template query success', reqId);
                                logger.warn('DVP-PBXService.AssignTemplateToUserDB] - [%s] - User not found', reqId);

                                callback(new Error('PBX User not found'), false);
                            }
                        });
                }
                else
                {
                    logger.debug('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Get Pbx User query success', reqId);
                    logger.warn('DVP-PBXService.AssignTemplateToUserDB] - [%s] - User not found', reqId);

                    callback(new Error('PBX User not found'), false);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
};

module.exports.AddPbxUserDB = AddPbxUserDB;
module.exports.AddPbxMasterDataDB = AddPbxMasterDataDB;
module.exports.GetPbxMasterData = GetPbxMasterData;
module.exports.AddPbxUserTemplateDB = AddPbxUserTemplateDB;
module.exports.AssignTemplateToUserDB = AssignTemplateToUserDB;
module.exports.DeletePbxUserDB = DeletePbxUserDB;
module.exports.UnAssignTemplateFromUserDB = UnAssignTemplateFromUserDB;
module.exports.DeletePbxUserTemplateDB = DeletePbxUserTemplateDB;
module.exports.GetPbxUsersForCompanyDB = GetPbxUsersForCompanyDB;
module.exports.GetPbxUserByIdDB = GetPbxUserByIdDB;
module.exports.GetPbxUserTemplateByIdDB = GetPbxUserTemplateByIdDB;
module.exports.GetPbxUserTemplatesForCompanyDB = GetPbxUserTemplatesForCompanyDB;
module.exports.GetAllPbxUserDetailsByIdDB = GetAllPbxUserDetailsByIdDB;
module.exports.AddFollowMeDB = AddFollowMeDB;
module.exports.DeleteFollowMeDB = DeleteFollowMeDB;
module.exports.GetFollowMeByIdDB = GetFollowMeByIdDB;
module.exports.GetFollowMeByUserDB = GetFollowMeByUserDB;
module.exports.AddPbxUserAllowedNumbersDB = AddPbxUserAllowedNumbersDB;
module.exports.RemovePbxUserAllowedNumberDB = RemovePbxUserAllowedNumberDB;
module.exports.AddFeatureCodesDB = AddFeatureCodesDB;
module.exports.GetFeatureCodesForCompanyDB = GetFeatureCodesForCompanyDB;
module.exports.SetDayPersonalGreetingDB = SetDayPersonalGreetingDB;
module.exports.SetNightPersonalGreetingDB - SetNightPersonalGreetingDB;
module.exports.EnablePersonalGreetingDB = EnablePersonalGreetingDB;
module.exports.AddForwardingDB = AddForwardingDB;
module.exports.DeleteForwardingDB = DeleteForwardingDB;
module.exports.GetForwardingByIdDB = GetForwardingByIdDB;
module.exports.GetForwardingByUserDB = GetForwardingByUserDB;
