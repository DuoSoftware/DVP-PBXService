/**
 * Created by Rajinda on 6/29/2015.
 */


module.exports = function(sequelize, DataTypes) {
    var CampContactInfo = sequelize.define('DB_CAMP_ContactInfo', {
            ContactId:DataTypes.STRING,
            //CamContactId:DataTypes.INTEGER,
            Status:DataTypes.BOOLEAN,
            TenantId:DataTypes.INTEGER,
            CompanyId:DataTypes.INTEGER,
            CamContactId:{type:DataTypes.INTEGER, primaryKey:true,autoIncrement: true}
        }
    );
    return CampContactInfo;
};

