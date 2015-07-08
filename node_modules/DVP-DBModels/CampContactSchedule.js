/**
 * Created by Rajinda on 6/29/2015.
 */



module.exports = function(sequelize, DataTypes) {
    var CampContactSchedule = sequelize.define('DB_CAMP_ContactSchedule', {
            CampaignId: DataTypes.INTEGER,
            CamScheduleId: DataTypes.INTEGER,
            CamContactId:DataTypes.INTEGER,
            ContactScheduleId:DataTypes.INTEGER
        }
    );
    return CampContactSchedule;
};
