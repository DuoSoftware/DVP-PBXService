module.exports = {
  "DB": {
    "Type":"postgres",
    "User":"duo",
    "Password":"DuoS123",
    "Port":5432,
    "Host":"127.0.0.1",
    "Database":"duo"
  },

  "Host":{
    "Ip":"0.0.0.0",
    "Port":"8820",
    "Version":"1.0.0.0"
  },

  "Security":
  {
    "ip" : "127.0.0.1",
    "port": 6379,
    "user": "127.0.0.1",
    "password": "123"
  },

  "Redis": {
    "IpAddress":"127.0.0.1",
    "Port":"6379",
    "Password":"123"
  },

  "Services":
  {

    "fileServiceHost": "fileservice.104.131.67.21.xip.io",
    "fileServicePort": 8081,
    "fileServiceVersion":"6.0",
    "sipUacServiceHost": "sipuserendpointservice.104.131.67.21.xip.io",
    "sipUacServicePort": 8085,
    "sipUacServiceVersion": "1.0.0.0"

  },

  "UseCache": false,
  "Token": "123"

};