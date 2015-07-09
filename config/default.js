module.exports = {
  "DB": {
    "Type":"postgres",
    "User":"duo",
    "Password":"DuoS123",
    "Port":5432,
    "Host":"127.0.0.1",
    "Database":"dvpdb"
  },

  "Host":{
    "Ip":"0.0.0.0",
    "Port":"9093",
    "Version":"1.0.0.0"
  },

  "Services":
  {

    "fileServiceHost": "127.0.0.1",
    "fileServicePort": 9093,
    "fileServiceVersion":"1.0.0.0",
    "sipUacServiceHost": "127.0.0.1",
    "sipUacServicePort": 9093,
    "sipUacServiceVersion": "1.0.0.0"

  }

};