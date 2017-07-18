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

  "Redis":
  {
    "mode":"sentinel",//instance, cluster, sentinel
    "ip": "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123",
    "db": 7,
    "sentinels":{
      "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
      "port":16389,
      "name":"redis-cluster"
    }

  },


  "Security":
  {

    "ip" : "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123",
    "mode":"sentinel",//instance, cluster, sentinel
    "sentinels":{
      "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
      "port":16389,
      "name":"redis-cluster"
    }
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