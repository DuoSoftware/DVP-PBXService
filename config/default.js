module.exports = {
  "DB": {
    "Type":"postgres",
    "User":"duo",
    "Password":"DuoS123",
    "Port":5432,
    "Host":"104.236.231.11",
    "Database":"duo"
  },

  "Host":{
    "Ip":"0.0.0.0",
    "Port":"8820",
    "Version":"1.0.0.0"
  },

  "Security":
  {
    "ip" : "45.55.142.207",
    "port": 6389,
    "user": "45.55.142.207",
    "password": "DuoS123"
  },

  "Redis": {
    "IpAddress":"45.55.142.207",
    "Port":"6389",
    "Password":"DuoS123"
  },

  "Services":
  {

    "fileServiceHost": "192.168.0.54",
    "fileServicePort": 8081,
    "fileServiceVersion":"6.0",
    "sipUacServiceHost": "127.0.0.1",
    "sipUacServicePort": 8085,
    "sipUacServiceVersion": "6.0"

  },

  "UseCache": false

};