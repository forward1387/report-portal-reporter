'use strict';

const structuredLog = require('structured-log');

let logObj; 

let getLog = () => {
  if (logObj) {
    return logObj;
  } else {
    logObj = structuredLog.configure()
        .writeTo(new structuredLog.ConsoleSink())
        .create();
    return logObj;  
  }
};

/*
 * @return {object} log
 */
exports.log = getLog(); 