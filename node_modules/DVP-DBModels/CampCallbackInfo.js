/**
 * Created by Rajinda on 6/29/2015.
 */




module.exports = function(sequelize, DataTypes) {
    var CampCallbackInfo = sequelize.define('DB_CAMP_CallbackInfo', {
            CampaignId: DataTypes.INTEGER,
            ContactId: DataTypes.STRING,
            CamScheduleId:DataTypes.INTEGER,
            CallBackId:DataTypes.STRING,
            Status:DataTypes.BOOLEAN

        }
    );
    return CampCallbackInfo;
};