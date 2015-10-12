/**
 * Created by dinusha on 4/22/2015.
 */

module.exports = {

    "DB": {
        "Type":"SYS_DATABASE_TYPE",
        "User":"SYS_DATABASE_POSTGRES_USER",
        "Password":"SYS_DATABASE_POSTGRES_PASSWORD",
        "Port":"SYS_SQL_PORT",
        "Host":"SYS_DATABASE_HOST",
        "Database":"SYS_DATABASE_POSTGRES_USER"
    },

    "Host":{
        "Port":"HOST_PBXSERVICE_PORT",
        "Version":"HOST_PBXSERVICE_VERSION"
    },

    "Services":
    {

        "fileServiceHost": "SYS_FILESERVICE_HOST",
        "fileServicePort": "SYS_FILESERVICE_PORT",
        "fileServiceVersion":"SYS_FILESERVICE_VERSION",
        "sipUacServiceHost": "SYS_SIPUSERENDPOINTSERVICE_HOST",
        "sipUacServicePort": "SYS_SIPUSERENDPOINTSERVICE_PORT",
        "sipUacServiceVersion": "SYS_SIPUSERENDPOINTSERVICE_VERSION"

    }
};