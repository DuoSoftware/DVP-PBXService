/**
 * Created by Rajinda on 6/29/2015.
 */


module.exports = function(sequelize, DataTypes) {
    var CampCampaignInfo = sequelize.define('DB_CAMP_CampaignInfo', {
            CampaignName: DataTypes.STRING,
            CampaignMode: DataTypes.STRING,
            CampaignChannel:DataTypes.STRING,
            DialoutMechanism:DataTypes.STRING,
            TenantId:DataTypes.INTEGER,
            CompanyId: DataTypes.INTEGER,
            Class: DataTypes.STRING,
            Type: DataTypes.STRING,
            Category: DataTypes.STRING,
            CampaignId: DataTypes.INTEGER,
            Status:DataTypes.BOOLEAN
        }
    );


    return CampCampaignInfo;
};