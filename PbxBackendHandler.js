var dbModel = require('dvp-dbmodels');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var externAccessor = require('./PbxExternalApiAccess.js');
var redisCacheHandler = require('dvp-common/CSConfigRedisCaching/RedisHandler.js');

var AddPbxMasterDataDB = function(reqId, pbxMasterData, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXMasterData.find({where: [{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxMData)
            {

                    if(pbxMData)
                    {
                            //allow update
                            pbxMData.updateAttributes({BypassMedia: pbxMasterData.BypassMedia, IgnoreEarlyMedia: pbxMasterData.IgnoreEarlyMedia, VoicemailEnabled: pbxMasterData.VoicemailEnabled}).then(function (rslt)
                            {
                                redisCacheHandler.addPBXCompDataToCache(rslt, companyId, tenantId);
                                logger.info('[DVP-PBXService.AddPbxMasterData] PGSQL Update call rule with trunk number query success');
                                callback(undefined, true);


                            }).catch(function(err)
                            {
                                logger.error('[DVP-PBXService.AddPbxMasterData] PGSQL Update call rule with trunk number query failed', err);
                                callback(err, false);
                            });
                    }
                    else
                    {
                        //Save
                        var pbxMastData = dbModel.PBXMasterData.build({
                            BypassMedia: pbxMasterData.BypassMedia,
                            IgnoreEarlyMedia: pbxMasterData.IgnoreEarlyMedia,
                            VoicemailEnabled: pbxMasterData.VoicemailEnabled,
                            CompanyId: companyId,
                            TenantId: tenantId,
                            ObjClass: "PBX",
                            ObjType: "PBXMASTERDATA",
                            ObjCategory: "DEFAULT"
                        });
                        pbxMastData
                            .save()
                            .then(function (rslt)
                            {
                                redisCacheHandler.addPBXCompDataToCache(rslt, companyId, tenantId);
                                logger.debug('[DVP-PBXService.AddPbxMasterData] - [%s] - PGSQL query success', reqId);
                                callback(undefined, true);

                            }).catch(function(err)
                            {
                                logger.error('[DVP-PBXService.AddPbxMasterData] - [%s] - PGSQL query failed', reqId, err);
                                callback(err, false);
                            })
                    }


            }).catch(function(err)
            {
                callback(err, false);
            });


    }
    catch(ex)
    {
        callback(ex, false);
    }

};

var SetDayPersonalGreetingDB = function(reqId, userUuid, greetingFile, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxUser)
            {
                if(pbxUser)
                {
                    pbxUser.updateAttributes({DayGreetingFile: greetingFile}).then(function (resp)
                    {
                        redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                        logger.info('[DVP-PBXService.SetDayPersonalGreetingDB] PGSQL Update pbx user with day greeting query success');
                        callback(undefined, true);

                    }).catch(function(err)
                    {
                        logger.error('[DVP-PBXService.SetDayPersonalGreetingDB] PGSQL Update pbx user with day greeting query failed', err);
                        callback(err, false);
                    });

                }
                else
                {
                    logger.debug('[DVP-PBXService.SetDayPersonalGreetingDB] - [%s] - PGSQL get pbx user query success', reqId);
                    callback(new Error('User not found'), false);
                }
            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.SetDayPersonalGreetingDB] - [%s] - PGSQL get pbx user query failed', reqId, err);
                callback(err, false);
            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.SetPersonalGreetingDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
}

var SetNightPersonalGreetingDB = function(reqId, userUuid, greetingFile, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxUser)
            {
                if(pbxUser)
                {
                    pbxUser.updateAttributes({NightGreetingFile: greetingFile}).then(function (reslt)
                    {
                        redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                        logger.info('[DVP-PBXService.SetNightPersonalGreetingDB] PGSQL Update pbx user with night greeting query success');
                        callback(undefined, true);

                    }).catch(function(err)
                    {
                        logger.error('[DVP-PBXService.SetNightPersonalGreetingDB] PGSQL Update pbx user with night greeting query failed', err);
                        callback(err, false);
                    });

                }
                else
                {
                    logger.debug('[DVP-PBXService.SetNightPersonalGreetingDB] - [%s] - PGSQL get pbx user query success', reqId);
                    callback(new Error('User not found'), false);
                }
            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.SetNightPersonalGreetingDB] - [%s] - PGSQL get pbx user query failed', reqId, err);
                callback(err, false);
            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.SetPersonalGreetingDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
}

var EnablePersonalGreetingDB = function(reqId, userUuid, isEnabled, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxUser)
            {
                if(pbxUser)
                {
                    pbxUser.updateAttributes({PersonalGreetingEnabled: isEnabled}).then(function (rsp)
                    {
                        redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                        logger.info('[DVP-PBXService.EnablePersonalGreetingDB] PGSQL Update pbx user with enable greeting query success');
                        callback(undefined, true);

                    }).catch(function(err)
                    {
                        logger.error('[DVP-PBXService.EnablePersonalGreetingDB] PGSQL Update pbx user with enable greeting query failed', err);
                        callback(err, false);
                    });

                }
                else
                {
                    logger.debug('[DVP-PBXService.EnablePersonalGreetingDB] - [%s] - PGSQL get pbx user query success', reqId);
                    callback(new Error('User not found'), false);
                }
            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.EnablePersonalGreetingDB] - [%s] - PGSQL get pbx user query failed', reqId, err);
                callback(err, false);
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
            .then(function (pbxUser)
            {
                if(pbxUser)
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

                        pbxUser.updateAttributes({AllowedNumbers: JSON.stringify(allowedNumberArr)}).then(function (rsp)
                        {
                            redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                            logger.info('[DVP-PBXService.AddPbxUserAllowedNumbersDB] PGSQL Update pbx user with allowed numbers query success');
                            callback(undefined, true);

                        }).catch(function(err)
                        {
                            logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] PGSQL Update pbx user with allowed numbers query failed', err);
                            callback(err, false);
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
            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - PGSQL get pbx user by uuid query failed', reqId, err);
                callback(err, false);
            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var RemovePbxUserDeniedNumberDB = function(reqId, userUuid, companyId, tenantId, numberToRemove, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxUser)
            {
                if(pbxUser)
                {
                    if(pbxUser.DeniedNumbers)
                    {
                        var deniedNumberArr = JSON.parse(pbxUser.DeniedNumbers);

                        var index = deniedNumberArr.indexOf(numberToRemove);

                        if(index > -1)
                        {
                            deniedNumberArr.splice(index, 1);
                        }

                        pbxUser.updateAttributes({DeniedNumbers: JSON.stringify(deniedNumberArr)}).then(function (rsp)
                        {
                            redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                            callback(undefined, true);

                        }).catch(function(err)
                        {
                            logger.error('[DVP-PBXService.RemovePbxUserDeniedNumberDB] PGSQL Update pbx user with denied numbers query failed', err);
                            callback(err, false);
                        });

                    }
                    else
                    {
                        callback(undefined, true);
                    }
                }
                else
                {
                    callback(new Error('User not found'), false);
                }
            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.RemovePbxUserDeniedNumberDB] - [%s] - PGSQL get pbx user by uuid query failed', reqId, err);
                callback(err, false);
            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.RemovePbxUserDeniedNumberDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var AddPbxUserAllowedNumbersDB = function(reqId, userUuid, companyId, tenantId, numberArr, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxUser)
            {
                if(pbxUser)
                {
                    logger.debug('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - PGSQL get pbx user by uuid query success', reqId);

                    var allowedNumberArr = [];

                    numberArr.forEach(function(num)
                    {
                        allowedNumberArr.push(num);
                    });

                    pbxUser.updateAttributes({AllowedNumbers: JSON.stringify(allowedNumberArr)}).then(function (rsp)
                    {
                        redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                        logger.info('[DVP-PBXService.AddPbxUserAllowedNumbersDB] PGSQL Update pbx user with allowed numbers query success');
                        callback(undefined, true);

                    }).catch(function(err)
                    {
                        logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] PGSQL Update pbx user with allowed numbers query failed', err);
                        callback(err, false);
                    });
                }
                else
                {
                    logger.debug('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - PGSQL get pbx user by uuid query success', reqId);
                    callback(new Error('User not found'), false);
                }
            }).then(function(err)
            {
                logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - PGSQL get pbx user by uuid query failed', reqId, err);
                callback(err, false);
            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AddPbxUserAllowedNumbersDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var AddPbxUserDeniedNumbersDB = function(reqId, userUuid, companyId, tenantId, numberArr, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxUser)
            {
                if(pbxUser)
                {

                    var deniedNumberArr = [];

                    numberArr.forEach(function(num)
                    {
                        deniedNumberArr.push(num);
                    });

                    pbxUser.updateAttributes({DeniedNumbers: JSON.stringify(deniedNumberArr)}).then(function (rsp)
                    {
                        redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                        callback(undefined, true);

                    }).catch(function(err)
                    {
                        logger.error('[DVP-PBXService.AddPbxUserDeniedNumbersDB] PGSQL Update pbx user with denied numbers query failed', err);
                        callback(err, false);
                    });
                }
                else
                {
                    callback(new Error('User not found'), false);
                }
            }).then(function(err)
            {
                logger.error('[DVP-PBXService.AddPbxUserDeniedNumbersDB] - [%s] - PGSQL get pbx user by uuid query failed', reqId, err);
                callback(err, false);
            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AddPbxUserDeniedNumbersDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var AddFollowMeBulkDB = function(reqId, userUuid, companyId, tenantId, followMeData, securityToken, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxUser)
            {
                if(pbxUser)
                {
                    logger.debug('[DVP-PBXService.AddFollowMeDB] - [%s] - Get PBX User PGSQL query success', reqId);

                        //delete all records first

                        dbModel.FollowMe.destroy({ where: [{PBXUserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]}).then(function (destroyCount)
                        {
                            var count = 0;
                            var length = followMeData.length;

                            for(i=0; i<length; i++)
                            {
                                if(followMeData[i].ObjCategory === 'USER' || followMeData[i].ObjCategory === 'GATEWAY')
                                {
                                    var followMeConfig = dbModel.FollowMe.build({

                                        DestinationNumber: followMeData[i].DestinationNumber,
                                        RingTimeout: followMeData[i].RingTimeout,
                                        Priority: followMeData[i].Priority,
                                        CompanyId: companyId,
                                        TenantId: tenantId,
                                        ObjClass: 'PBX',
                                        ObjType: 'FOLLOW_ME',
                                        ObjCategory: followMeData[i].ObjCategory,
                                        PBXUserUuid: userUuid
                                    });

                                    followMeConfig
                                        .save()
                                        .then(function (fmRes)
                                        {
                                            count++;

                                            if(count === length)
                                            {
                                                redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                                                callback(null, true);
                                            }


                                        }).catch(function(err)
                                        {
                                            count++;
                                            if(count === length)
                                            {
                                                redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                                                callback(null, true);
                                            }
                                        })
                                }
                                else
                                {
                                    count++;
                                    if(count === length)
                                    {
                                        redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                                        callback(null, true);
                                    }
                                }
                            }



                        }).catch(function(err)
                        {
                            logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Insert Follow Me PGSQL query failed', reqId, err);
                            callback(err, true);
                        });



                }
                else
                {
                    logger.debug('[DVP-PBXService.AddFollowMeDB] - [%s] - Get PBX User PGSQL query success', reqId);
                    callback(new Error('PBX User not found'), false);
                }

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Get PBX User PGSQL query failed', reqId, err);
                callback(err, false);
            });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var AddFollowMeDB = function(reqId, userUuid, companyId, tenantId, followMeData, securityToken, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxUser)
            {
                if(pbxUser)
                {
                    logger.debug('[DVP-PBXService.AddFollowMeDB] - [%s] - Get PBX User PGSQL query success', reqId);
                    if(followMeData.ObjCategory === 'PBXUSER')
                    {
                        if(followMeData.DestinationUserUuid)
                        {
                            dbModel.PBXUser.find({where: [{UserUuid: followMeData.DestinationUserUuid},{TenantId: tenantId}]})
                                .then(function (dstUser)
                                {
                                    if(dstUser)
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
                                                    CompanyId: companyId,
                                                    TenantId: tenantId,
                                                    ObjClass: 'PBX',
                                                    ObjType: 'FOLLOW_ME',
                                                    ObjCategory: followMeData.ObjCategory
                                                });

                                                followMeConfig
                                                    .save()
                                                    .then(function (rsp)
                                                    {
                                                        logger.debug('[DVP-PBXService.AddFollowMeDB] - [%s] - Insert Follow Me PGSQL query success', reqId);

                                                                followMeConfig.setPBXUser(pbxUser).then(function(resp)
                                                                {
                                                                    logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Update Follow Me record with PBXUser Uuid PGSQL query sucess', reqId);

                                                                        followMeConfig.setDestinationUser(dstUser).then(function(rs)
                                                                        {
                                                                            redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                                                                            logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Update Follow Me record with Destination user Uuid PGSQL query sucess', reqId);
                                                                            callback(undefined, true, followMeConfig.id);

                                                                        }).catch(function(err)
                                                                        {
                                                                            redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                                                                            logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Update Follow Me record with Destination User Uuid PGSQL query failed', reqId, err);
                                                                            callback(new Error('FollowMe configuration added but error occurred while assigning it to destination user'), false, followMeConfig.id);
                                                                        });


                                                                }).catch(function(err)
                                                                {
                                                                    redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                                                                    logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Update Follow Me record with PBXUser Uuid PGSQL query failed', reqId, err);
                                                                    callback(new Error('FollowMe configuration added but error occurred while assigning it to user'), false, followMeConfig.id);
                                                                });



                                                    }).catch(function(err)
                                                    {
                                                        logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Insert Follow Me PGSQL query failed', reqId, err);
                                                        callback(err, false, -1);
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
                                }).catch(function(err)
                                {
                                    logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - PGSQL get pbx user query failed', reqId, err);
                                    callback(new Error('Cannot find a pbx user with given destination uuid'), false, -1);
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
                            CompanyId: companyId,
                            TenantId: tenantId,
                            ObjClass: 'PBX',
                            ObjType: 'FOLLOW_ME',
                            ObjCategory: followMeData.ObjCategory
                        });

                        followMeConfig
                            .save()
                            .then(function (fmRes)
                            {
                                logger.debug('[DVP-PBXService.AddFollowMeDB] - [%s] - Insert Follow Me PGSQL query success', reqId);

                                    followMeConfig.setPBXUser(pbxUser).then(function(setRes)
                                    {
                                        redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                                        logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Update Follow Me record with PBXUser Uuid PGSQL query sucess', reqId);
                                        callback(undefined, true, followMeConfig.id);
                                    }).catch(function(err)
                                    {
                                        logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Update Follow Me record with PBXUser Uuid PGSQL query failed', reqId, err);
                                        callback(new Error('FollowMe configuration added but error occurred while assigning it to user'), false, followMeConfig.id);
                                    });


                            }).catch(function(err)
                            {
                                logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Insert Follow Me PGSQL query failed', reqId, err);
                                callback(err, false, -1);
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

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.AddFollowMeDB] - [%s] - Get PBX User PGSQL query failed', reqId, err);
                callback(err, false, -1);
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
            .then(function (fwdConf)
            {
                logger.debug('[DVP-PBXService.GetForwardingByIdDB] - [%s] - PGSQL get forwarding config by id query success', reqId);
                callback(undefined, fwdConf);

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.GetForwardingByIdDB] - [%s] - PGSQL get forwarding config by id query failed', reqId, err);
                callback(err, undefined);
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetForwardingByIdDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }

};

var GetForwardingByUserDB = function(reqId, userUuid, companyId, tenantId, user, useDbStrict, callback)
{
    var emptyList = [];
    try
    {
        dbModel.Forwarding.findAll({where: [{PBXUserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (fwdConfList)
            {
                logger.debug('[DVP-PBXService.GetForwardingByUserDB] - [%s] - PGSQL get forwarding config list by user uuid query success', reqId);
                callback(undefined, fwdConfList);

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.GetForwardingByUserDB] - [%s] - PGSQL get forwarding config list by user uuid query failed', reqId, err);
                callback(err, emptyList);
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
            .then(function (pbxUser)
            {
                if(pbxUser)
                {
                    logger.debug('[DVP-PBXService.AddForwardingDB] - [%s] - Get PBX User PGSQL query success', reqId);
                    fwdConfig
                        .save()
                        .then(function (saveRes)
                        {
                                logger.debug('[DVP-PBXService.AddForwardingDB] - [%s] - Insert Forwarding PGSQL query success', reqId);

                                fwdConfig.setPBXUser(pbxUser).then(function(updateRes)
                                {
                                    redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                                    logger.error('[DVP-PBXService.AddForwardingDB] - [%s] - Update Forward record with PBXUser Uuid PGSQL query sucess', reqId);
                                    callback(undefined, true, fwdConfig.id);

                                }).catch(function(err)
                                {
                                    redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                                    logger.error('[DVP-PBXService.AddForwardingDB] - [%s] - Update Forwarding record with PBXUser Uuid PGSQL query failed', reqId, err);
                                    callback(new Error('Forwarding configuration added but error occurred while assigning it to user'), false, fwdConfig.id);
                                });


                        }).catch(function(err)
                        {
                            logger.error('[DVP-PBXService.AddForwardingDB] - [%s] - Insert Forwarding PGSQL query failed', reqId, err);
                            callback(err, false, -1);
                        })
                }
                else
                {
                    logger.debug('[DVP-PBXService.AddForwardingDB] - [%s] - Get PBX User PGSQL query success', reqId);
                    callback(new Error('PBX User not found'), false, -1);
                }

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.AddForwardingDB] - [%s] - Get PBX User PGSQL query failed', reqId, err);
                callback(err, false, -1);
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
        dbModel.Forwarding.find({where: [{id: fwdId},{CompanyId: companyId},{TenantId: tenantId}]}).then(function (fwdRec)
        {

                logger.debug('[DVP-PBXService.DeleteForwardingDB] - [%s] - PGSQL Get forwarding by Id query success', reqId);
                fwdRec.destroy().then(function (result)
                {
                    if(fwdRec.PBXUserUuid)
                    {
                        redisCacheHandler.addPABXUserToCache(fwdRec.PBXUserUuid, companyId, tenantId);
                    }
                    logger.debug('[DVP-RuleService.DeleteForwardingDB] PGSQL Delete forwarding query success');
                    callback(undefined, true);

                }).catch(function(err)
                {
                    logger.error('[DVP-RuleService.DeleteForwardingDB] PGSQL Delete forwarding query failed', err);
                    callback(err, false);
                });


        }).catch(function(err)
        {
            logger.error('[DVP-PBXService.DeleteForwardingDB] - [%s] - PGSQL Get forwarding by Id query failed', reqId, err);
            callback(err, false);
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
        dbModel.FollowMe.find({where: [{id: fmId},{CompanyId: companyId},{TenantId: tenantId}]}).then(function (fmRec)
        {
            logger.debug('[DVP-PBXService.DeleteFollowMeDB] - [%s] - PGSQL Get Follow Me by Id query success', reqId);
                fmRec.destroy().then(function (result)
                {
                    if(fmRec.PBXUserUuid)
                    {
                        redisCacheHandler.addPABXUserToCache(fmRec.PBXUserUuid, companyId, tenantId);
                    }
                    logger.debug('[DVP-RuleService.DeleteFollowMeDB] PGSQL Delete pbx user query success');
                    callback(undefined, true);

                }).catch(function(err)
                {
                    logger.error('[DVP-RuleService.DeleteFollowMeDB] PGSQL Delete pbx user query failed', err);
                    callback(err, false);
                });

        }).catch(function(err)
        {
            logger.error('[DVP-PBXService.DeleteFollowMeDB] - [%s] - PGSQL Get Follow Me by Id query failed', reqId, err);
            callback(err, false);
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
            .then(function (fmConf)
            {
                logger.debug('[DVP-PBXService.GetFollowMeByIdDB] - [%s] - PGSQL get follow me config by id query success', reqId);
                callback(undefined, fmConf);

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.GetFollowMeByIdDB] - [%s] - PGSQL get follow me config by id query failed', reqId, err);
                callback(err, undefined);
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetFollowMeByIdDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }

};

var GetFollowMeByUserDB = function(reqId, userUuid, companyId, tenantId, user, useDbStrict, callback)
{
    var emptyList = [];
    try
    {
        dbModel.FollowMe.findAll({where: [{PBXUserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}], include: [{model: dbModel.PBXUser, as: 'DestinationUser'}]})
            .then(function (fmConfList)
            {
                logger.debug('[DVP-PBXService.GetFollowMeByUserDB] - [%s] - PGSQL get follow me config list by user uuid query success', reqId);
                callback(undefined, fmConfList);

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.GetFollowMeByUserDB] - [%s] - PGSQL get follow me config list by user uuid query failed', reqId, err);
                callback(err, emptyList);
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetFollowMeByUserDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, emptyList);
    }

};

var UpdatePbxUserDB = function(reqId, userUuid, updateData, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxUserToUpdate)
            {
                if(pbxUserToUpdate)
                {
                    logger.debug('[DVP-PBXService.UpdatePbxUserDB] - [%s] - PGSQL Get PBX User query success', reqId);
                    pbxUserToUpdate.updateAttributes(updateData).then(function(updateResult)
                    {
                        redisCacheHandler.addPABXUserToCache(userUuid, companyId, tenantId);
                        logger.debug('[DVP-PBXService.UpdatePbxUserDB] - [%s] - PGSQL Update PBX User query success', reqId);
                        callback(undefined, true);
                    })
                    .catch(function(err)
                    {
                        logger.error('[DVP-PBXService.UpdatePbxUserDB] - [%s] - PGSQL Update Pbx User Failed', reqId, err);
                        callback(err, false);
                    })
                }
                else
                {
                    logger.debug('[DVP-PBXService.UpdatePbxUserDB] - [%s] - PGSQL Get Pbx User success', reqId);
                    callback(new Error('Cannot find pbx user with given id'), false);
                }
            })
            .catch(function(err)
            {
                logger.error('[DVP-PBXService.UpdatePbxUserDB] - [%s] - PGSQL Get Pbx User Failed', reqId, err);
                callback(err, false);
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.UpdatePbxUserDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
};

var AddPbxUserDB = function(reqId, pbxUserData, callback)
{
    try
    {
        pbxUserData
            .save()
            .then(function (resp)
            {
                redisCacheHandler.addPABXUserToCache(pbxUserData.UserUuid, pbxUserData.CompanyId, pbxUserData.TenantId);
                logger.debug('[DVP-PBXService.AddPbxUserDB] - [%s] - PGSQL query success', reqId);
                callback(undefined, true);

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.AddPbxUserDB] - [%s] - PGSQL query failed', reqId, err);
                callback(err, false);
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
        dbModel.PBXUser.find({where: [{UserUuid: pbxUserUuid},{CompanyId: companyId},{TenantId: tenantId}]}).then(function (userRec)
        {
            userRec.destroy().then(function (result)
                {
                    redisCacheHandler.removePABXUserFromCache(pbxUserUuid, companyId, tenantId);
                    logger.debug('[DVP-RuleService.DeletePbxUserDB] PGSQL Delete pbx user query success');
                    callback(undefined, true);

                }).catch(function(err)
                {
                    logger.error('[DVP-RuleService.DeletePbxUserDB] PGSQL Delete pbx user query failed', err);
                    callback(err, false);
                });

        }).catch(function(err)
        {
            logger.error('[DVP-PBXService.DeletePbxUserDB] - [%s] - PGSQL Get PBX User query failed', reqId, err);
            callback(err, false);
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
            .then(function (featureCodeTemplate)
            {
                if(featureCodeTemplate)
                {
                    logger.debug('[DVP-PBXService.AddFeatureCodesDB] - [%s] - PGSQL get feature code by company query success', reqId);

                    featureCodeTemplate.updateAttributes({PickUp: featureCodeProfile.PickUp, Intercept: featureCodeProfile.Intercept, Park: featureCodeProfile.Park, VoiceMail: featureCodeProfile.VoiceMail, Barge: featureCodeProfile.Barge}).then(function (rslt)
                    {

                        redisCacheHandler.addFeatureCodeToCache(rslt, companyId, tenantId);
                        logger.info('[DVP-PBXService.AddFeatureCodesDB] PGSQL Update pbx user with allowed numbers query success');
                        callback(undefined, true);

                    }).catch(function(err)
                    {
                        logger.error('[DVP-PBXService.AddFeatureCodesDB] PGSQL Update pbx user with allowed numbers query failed', err);
                        callback(err, false);
                    });
                }
                else
                {
                    logger.debug('[DVP-PBXService.AddFeatureCodesDB] - [%s] - PGSQL get feature code by company query success', reqId);

                    var fc = dbModel.FeatureCode.build({PickUp: featureCodeProfile.PickUp, Intercept: featureCodeProfile.Intercept, Park: featureCodeProfile.Park, VoiceMail: featureCodeProfile.Voicemail, Barge: featureCodeProfile.Barge, CompanyId: companyId, TenantId: tenantId, ObjClass: 'PBX', ObjType: 'FeatureCodes', ObjCategory: 'FeatureCodes'});

                    fc
                        .save()
                        .then(function (saveRes)
                        {
                            redisCacheHandler.addFeatureCodeToCache(saveRes, companyId, tenantId);
                            logger.debug('[DVP-PBXService.AddFeatureCodesDB] - [%s] - PGSQL query success', reqId);
                            callback(undefined, true);

                        }).catch(function(err)
                        {
                            logger.error('[DVP-PBXService.AddFeatureCodesDB] - [%s] - PGSQL query failed', reqId, err);
                            callback(err, false);
                        });
                }
            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.AddFeatureCodesDB] - [%s] - PGSQL get feature code by company query failed', reqId, err);
                callback(err, false);
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
        dbModel.PBXUserTemplate.find({where: [{id: templateId},{CompanyId: companyId},{TenantId: tenantId}]}).then(function (userTempRec)
        {
            userTempRec.destroy().then(function (result)
                {
                    if(userTempRec && userTempRec.PBXUserUuid)
                    {
                        redisCacheHandler.addPABXUserToCache(userTempRec.PBXUserUuid, companyId, tenantId);
                    }
                    logger.debug('[DVP-RuleService.DeletePbxUserTemplateDB] PGSQL Delete pbx user template query success');
                    callback(undefined, true);

                }).catch(function(err)
            {
                logger.error('[DVP-RuleService.DeletePbxUserTemplateDB] PGSQL Delete pbx user template query failed', err);
                callback(err, false);
            });


        }).catch(function(err)
        {
            logger.error('[DVP-PBXService.DeletePbxUserTemplateDB] - [%s] - PGSQL Get PBX User template query failed', reqId, err);
            callback(err, false);
        })

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.DeletePbxUserTemplateDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var AddPbxUserTemplateDB = function(reqId, pbxUserUuid, pbxUserTemplate, companyId, tenantId, callback)
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
            CompanyId: companyId,
            TenantId: tenantId,
            ObjClass: 'PBX',
            ObjType: 'PBXUSER',
            ObjCategory: pbxUserTemplate.ObjCategory,
            PBXUserUuid: pbxUserUuid
        });

        pbxUsrTemplate
            .save()
            .then(function (saveRes)
            {
                redisCacheHandler.addPABXUserToCache(pbxUserUuid, companyId, tenantId);
                logger.debug('[DVP-PBXService.AddPbxUserTemplateDB] - [%s] - PGSQL query success', reqId);


                callback(undefined, true);

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.AddPbxUserTemplateDB] - [%s] - PGSQL query failed', reqId, err);
                callback(err, false);
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
            .then(function (pbxUsers)
            {
                logger.debug('[DVP-PBXService.GetPbxUsersForCompanyDB] - [%s] - PGSQL get pbx user by company query success', reqId);
                callback(undefined, pbxUsers);

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.GetPbxUsersForCompanyDB] - [%s] - PGSQL get pbx user by company query failed', reqId, err);
                callback(err, emptyArr);
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetPbxUsersForCompanyDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, emptyArr);
    }

};

var GetPbxUserTemplatesForUser = function(reqId, userUuid, companyId, tenantId, callback)
{
    var emptyArr = [];
    try
    {
        dbModel.PBXUserTemplate.findAll({where: [{CompanyId: companyId},{TenantId: tenantId}], include:[{model:dbModel.PBXUser, as:"PBXUser", where:[{UserUuid: userUuid}]}]})
            .then(function (pbxUsersTemplates)
            {
                logger.debug('[DVP-PBXService.GetPbxUserTemplatesForCompanyDB] - [%s] - PGSQL get pbx user templates by company query success', reqId);
                callback(undefined, pbxUsersTemplates);

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.GetPbxUserTemplatesForCompanyDB] - [%s] - PGSQL get pbx user templates by company query failed', reqId, err);
                callback(err, emptyArr);
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetPbxUserTemplatesForCompanyDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, emptyArr);
    }

};

var GetFeatureCodesForCompanyDB = function(reqId, companyId, tenantId, useDbStrict, callback)
{
    try
    {
        dbModel.FeatureCode.find({where: [{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (fc)
            {
                logger.debug('[DVP-PBXService.GetFeatureCodesForCompanyDB] - [%s] - PGSQL get feature codes query success', reqId);
                callback(undefined, fc);

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.GetFeatureCodesForCompanyDB] - [%s] - PGSQL get feature codes query failed', reqId, err);
                callback(err, undefined);
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetFeatureCodesForCompanyDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }

};

var GetPbxUserByIdDB = function(reqId, pbxUserUuid, companyId, tenantId, useDbStrict, callback)
{
    try
    {
        dbModel.PBXUser.find({where: [{UserUuid: pbxUserUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxUser)
            {
                if(pbxUser)
                {
                    pbxUser.AllowedNumbers = JSON.parse(pbxUser.AllowedNumbers);
                    pbxUser.DeniedNumbers = JSON.parse(pbxUser.DeniedNumbers);
                }
                logger.debug('[DVP-PBXService.GetPbxUserByIdDB] - [%s] - PGSQL get pbx user by uuid query success', reqId);
                callback(undefined, pbxUser);
            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.GetPbxUserByIdDB] - [%s] - PGSQL get pbx user by uuid query failed', reqId, err);
                callback(err, undefined);
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
        dbModel.PBXUser.find({where: [{UserUuid: pbxUserUuid},{CompanyId: companyId},{TenantId: tenantId}], include:[{model: dbModel.PBXUserTemplate, as:'PBXUserTemplateActive'},{model: dbModel.Forwarding, as:'Forwarding'}]})
            .then(function (pbxUserDetails)
            {
                if(pbxUserDetails && pbxUserDetails.UseSchedule &&  pbxUserDetails.ScheduleId)
                {
                    dbModel.Schedule.find({where: [{id: scheduleId},{CompanyId: companyId},{TenantId: tenantId}], include: [{model: dbModel.Appointment, as: 'Appointment'}]})
                        .then(function (schedule)
                        {
                            pbxUserDetails.Schedule = schedule;
                            callback(undefined, pbxUserDetails);
                        }).catch(function(err)
                        {
                            callback(undefined, pbxUserDetails);
                        });
                }
                else
                {
                    callback(undefined, pbxUserDetails);
                }


            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.GetAllPbxUserDetailsByIdDB] - [%s] - PGSQL get all pbx user details by uuid query failed', reqId, err);
                callback(err, undefined);
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
            .then(function (pbxUserTempl)
            {

                    logger.debug('[DVP-PBXService.GetPbxUserTemplateByIdDB] - [%s] - PGSQL get pbx user templae by id query success', reqId);
                    callback(undefined, pbxUserTempl);

            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.GetPbxUserTemplateByIdDB] - [%s] - PGSQL get pbx user template by id query failed', reqId, err);
                callback(err, undefined);
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetPbxUserTemplateByIdDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }

};

var GetPbxUserTemplateByNumberDB = function(reqId, userUuid, divertNum, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXUserTemplate.find({where: [{CallDivertNumber: divertNum},{PBXUserUuid: userUuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxUserTempl)
            {
                callback(undefined, pbxUserTempl);

            }).catch(function(err)
            {
                callback(err, undefined);
            });
    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.GetPbxUserTemplateByNumberDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }

};

var GetPbxMasterData = function(reqId, companyId, tenantId, callback)
{
    try
    {
        dbModel.PBXMasterData.find({where: [{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (pbxMData)
            {
                callback(undefined, pbxMData);
            }).catch(function(err)
            {
                callback(err, undefined);
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
            .then(function (pbxUsr)
            {
                if(pbxUsr)
                {
                    logger.debug('[DVP-PBXService.UnAssignTemplateFromUserDB] - [%s] - PGSQL Get Template query success', reqId);
                    pbxUsr.setPBXUserTemplateActive(null).then(function (upresult)
                    {
                        redisCacheHandler.addPABXUserToCache(pbxUserUuid, companyId, tenantId);

                        logger.debug('[DVP-PBXService.UnAssignTemplateFromUserDB] - [%s] - PGSQL Update pbx user with template id query success', reqId);
                        callback(undefined, true);


                    }).catch(function(err)
                    {
                        logger.error('[DVP-PBXService.UnAssignTemplateFromUserDB] - [%s] - PGSQL Update pbx user with template id query failed', reqId, err);
                        callback(err, false);
                    });
                }
                else
                {
                    logger.debug('[DVP-PBXService.UnAssignTemplateFromUserDB] - [%s] - PGSQL Get Pbx User query success', reqId);
                    logger.warn('DVP-PBXService.UnAssignTemplateFromUserDB] - [%s] - User not found', reqId);

                    callback(new Error('PBX User not found'), false);
                }
            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.UnAssignTemplateFromUserDB] - [%s] - PGSQL Get Pbx User query failed', reqId, err);
                callback(err, false);
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
            .then(function (pbxUsr)
            {
                if(pbxUsr)
                {
                    logger.debug('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Get Pbx User query success', reqId);

                    dbModel.PBXUserTemplate.find({where: [{id: pbxTemplateId},{CompanyId: companyId},{TenantId: tenantId}]})
                        .then(function (pbxUsrTemp)
                        {
                            if(pbxUsrTemp)
                            {
                                logger.debug('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Get Template query success', reqId);
                                pbxUsr.setPBXUserTemplateActive(pbxUsrTemp).then(function (result)
                                {
                                    redisCacheHandler.addPABXUserToCache(pbxUserUuid, companyId, tenantId);
                                    logger.debug('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Update pbx user with template id query success', reqId);
                                    callback(undefined, true);

                                }).catch(function(err)
                                {
                                    logger.error('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Update pbx user with template id query failed', reqId, err);
                                    callback(err, false);
                                });
                            }
                            else
                            {
                                logger.debug('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Get Template query success', reqId);
                                logger.warn('DVP-PBXService.AssignTemplateToUserDB] - [%s] - User not found', reqId);

                                callback(new Error('PBX User not found'), false);
                            }
                        }).catch(function(err)
                        {
                            logger.error('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Get Template query failed', reqId, err);
                            callback(err, false);
                        });
                }
                else
                {
                    logger.debug('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Get Pbx User query success', reqId);
                    logger.warn('DVP-PBXService.AssignTemplateToUserDB] - [%s] - User not found', reqId);

                    callback(new Error('PBX User not found'), false);
                }
            }).catch(function(err)
            {
                logger.error('[DVP-PBXService.AssignTemplateToUserDB] - [%s] - PGSQL Get Pbx User query failed', reqId, err);
                callback(err, false);
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
module.exports.GetPbxUserTemplatesForUser = GetPbxUserTemplatesForUser;
module.exports.GetAllPbxUserDetailsByIdDB = GetAllPbxUserDetailsByIdDB;
module.exports.AddFollowMeDB = AddFollowMeDB;
module.exports.DeleteFollowMeDB = DeleteFollowMeDB;
module.exports.GetFollowMeByIdDB = GetFollowMeByIdDB;
module.exports.GetFollowMeByUserDB = GetFollowMeByUserDB;
module.exports.AddPbxUserAllowedNumbersDB = AddPbxUserAllowedNumbersDB;
module.exports.AddPbxUserDeniedNumbersDB = AddPbxUserDeniedNumbersDB;
module.exports.RemovePbxUserAllowedNumberDB = RemovePbxUserAllowedNumberDB;
module.exports.RemovePbxUserDeniedNumberDB = RemovePbxUserDeniedNumberDB;
module.exports.AddFeatureCodesDB = AddFeatureCodesDB;
module.exports.GetFeatureCodesForCompanyDB = GetFeatureCodesForCompanyDB;
module.exports.SetDayPersonalGreetingDB = SetDayPersonalGreetingDB;
module.exports.SetNightPersonalGreetingDB = SetNightPersonalGreetingDB;
module.exports.EnablePersonalGreetingDB = EnablePersonalGreetingDB;
module.exports.AddForwardingDB = AddForwardingDB;
module.exports.DeleteForwardingDB = DeleteForwardingDB;
module.exports.GetForwardingByIdDB = GetForwardingByIdDB;
module.exports.GetForwardingByUserDB = GetForwardingByUserDB;
module.exports.UpdatePbxUserDB = UpdatePbxUserDB;
module.exports.AddFollowMeBulkDB = AddFollowMeBulkDB;
module.exports.GetPbxUserTemplateByNumberDB = GetPbxUserTemplateByNumberDB;
