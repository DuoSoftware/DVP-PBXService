#FROM ubuntu
#RUN apt-get update
#RUN apt-get install -y git nodejs npm
#RUN git clone git://github.com/DuoSoftware/DVP-PBXService.git /usr/local/src/pbxservice
#RUN cd /usr/local/src/pbxservice; npm install
#CMD ["nodejs", "/usr/local/src/pbxservice/app.js"]

#EXPOSE 8820

FROM node:argon
RUN git clone git://github.com/DuoSoftware/DVP-PBXService.git /usr/local/src/pbxservice
RUN cd /usr/local/src/pbxservice;
WORKDIR /usr/local/src/pbxservice
RUN npm install
EXPOSE 8820
CMD [ "node", "/usr/local/src/pbxservice/app.js" ]
