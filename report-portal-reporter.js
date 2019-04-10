"use strict";

const mocha = require('mocha'),
    _ = require('underscore'),
    {log} = require('./lib/setup');

let RPClient = require('reportportal-client');

let config;
var enabled = false;

const RP_STATUS = {
    PASSED: 'passed',
    FAILED: 'failed',
    SKIPPED: 'skipped'
};

const RP_LEVEL = {
    PASSED: 'INFO',
    FAILED: 'ERROR',
    SKIPPED: 'WARN',
    PENDING: 'ERROR',
    UNDEFINED: 'ERROR',
    PASSED_HOOK: 'DEBUG'
};

const RP_ITEM_TYPE = {
    SUITE : 'SUITE',
    TEST: 'TEST',
    STEP: 'STEP'
};

var passes = 0;
var failures = 0;
var scipped = 0;
var level = 1;

let description;

let getTabs = (count) => {
    let tabs = '';
    for(let i=0; i < count; i++) {
        tabs+='  ';
    }

    return tabs;
};

let cutStringLength = (str, length) => {
    return str.length > length ? 
    str.substring(0, length - 3) + "..." : 
    str;
};

function RPReporter(runner, options) {
    mocha.reporters.Base.call(this, runner);

    let launchId = null;
    let suiteIds = [];
    let testIds = [];
    let rpClient;

    try {
        enabled = _.has(process.env, 'RPENABLED');
    } catch (err) {
        console.error(`Failed to load config. Error: ${err}`);
    }

    if (enabled) {
        try {
            console.log('TOKEN: ' + process.env.RPTOKEN);
            console.log('ENDPOINT: ' + process.env.RPENDPOINT);
            console.log('LUNCH: ' + process.env.RPLUNCH);
            console.log('PROJECT: ' + process.env.RPPROJECT);
            console.log('TAGS: ' + process.env.RPTAGS);

            config = {
                token: _.has(process.env, 'RPTOKEN') ? process.env.RPTOKEN : '',
                endpoint: _.has(process.env, 'RPENDPOINT') ? process.env.RPENDPOINT : '',
                launch: _.has(process.env, 'RPLUNCH') ? process.env.RPLUNCH : '',
                project: _.has(process.env, 'RPPROJECT') ? process.env.RPPROJECT : '', 
                tags: (_.has(process.env, 'RPTAGS') ? process.env.RPTAGS : '').split(' ')
            }
        }catch (err) {
            console.error(`Failed to load config. Error: ${err}`);
        }
        
        rpClient = new RPClient(config);
        description = config.description || "";
    }

        runner.on('start', function()  {
            console.log('Tests execution started');

            if (!enabled) return;

            if(!rpClient) {
                log.info(JSON.stringify(config));
                rpClient = new RPClient(config);
            }

            let lunch = rpClient.startLaunch({
                name: cutStringLength(config.launch, 256),
                start_time: rpClient.helpers.now(),
                description: description,
                tags: config.tags,
                debug: true
            });

            launchId = lunch.tempId;

            lunch.promise.catch((err) => {
                log.error(`LUNCH Start ${suite.title}: Error ${JSON.stringify(err)}`);
            });
        });

        runner.on('end', function(){
            console.log(`\nRESULTS pass: ${passes} fail: ${failures} skip: ${scipped}`);

            if (!enabled) return;

            rpClient.finishLaunch(launchId, {
               end_time: rpClient.helpers.now()
            }).promise.catch((err) => {
                log.error(`LUNCH End ${suite.title}: Error ${JSON.stringify(err)}`);
            });
        });

        runner.on('suite', function(suite){
            console.log(`${getTabs(level - 1)}${suite.title}`);
            level++;
            if (!enabled) return;

            if(suite.title === "") {
                return true;
            } if(suite.parent.title !== "") {
                let childObj = rpClient.startTestItem({
                    name: cutStringLength(suite.title, 256),
                    start_time: rpClient.helpers.now(),
                    type: RP_ITEM_TYPE.SUITE
                }, launchId,  _.findWhere(suiteIds, {title: suite.parent.title}).id);

                suiteIds.push({id: childObj.tempId, title: suite.title});
                childObj.promise.catch((err) => {
                    log.error(`SUITE Started ${suite.title}: Error ${JSON.stringify(err)}`);
                });
            } else {

                let suiteObj = rpClient.startTestItem({
                name: cutStringLength(suite.title, 256),
                start_time: rpClient.helpers.now(),
                type: RP_ITEM_TYPE.SUITE
            }, launchId);

            suiteIds.push({id: suiteObj.tempId, title: suite.title});
            suiteObj.promise.catch((err) => {
                log.error(`SUITE Started ${suite.title}: Error ${JSON.stringify(err)}`);
            });
        }
    });

    runner.on('suite end', function(suite){
        level--;
        if (!enabled) return;

        if(suite.title === "") {
            return true;
        } else {
            let item = suiteIds.pop();
            let failedItems = _.filter(suite.tests, (item) => {
                return item.state === 'failed';
            });

            rpClient.finishTestItem(item.id, {
                status: (failedItems.length > 0 ? RP_STATUS.FAILED : RP_STATUS.PASSED),
                end_time: rpClient.helpers.now()
            }).promise.catch((err) => {
                log.error(`SUITE End ${suite.title}: Error ${JSON.stringify(err)}`);
            });
        }

    });
    
    runner.on('test', function(test) {
        if (!enabled) return;

        let testObj = rpClient.startTestItem({
            name: cutStringLength(test.title, 256),
            start_time: rpClient.helpers.now(),
            tags: [],
            type: RP_ITEM_TYPE.TEST
        }, launchId, _.findWhere(suiteIds, {title: test.parent.title}).id);

        testIds.push({id: testObj.tempId, title: test.title});

        testObj.promise.catch((err) => {
            log.error(`TEST Started ${test.title}: Error ${JSON.stringify(err)}`);
        });
    });

    runner.on('pending', function (test) {
        console.warn(`${getTabs(level)}Test pending: '${test.title}'`);
        scipped++;
        if (!enabled) return;

        let testObj = rpClient.startTestItem({
            name: cutStringLength(test.title, 256),
            start_time: rpClient.helpers.now(),
            tags: [],
            type: RP_ITEM_TYPE.TEST
        }, launchId, _.findWhere(suiteIds, {title: test.parent.title}).id);

        testIds.push({id: testObj.tempId, title: test.title});

        testObj.promise.catch((err) => {
            log.error(`TEST Started ${test.title}: Error ${JSON.stringify(err)}`);
        });
    });

    runner.on('test end', function(test){
        if (!enabled) return;

        let item = testIds.pop();
        if(test.pending === true) {
            rpClient.finishTestItem(item.id, {
                status: RP_STATUS.SKIPPED,
                end_time: rpClient.helpers.now()
            }).promise.catch((err) => {
                log.error(`TEST End ${test.title}: Error ${JSON.stringify(err)}`);
            });
        } else {
            rpClient.finishTestItem(item.id, {
                status: test.state,
                end_time: rpClient.helpers.now()
            }).promise.catch((err) => {
                log.error(`TEST End ${test.title}: Error ${JSON.stringify(err)}`);
            });        
        } 
    });

    runner.on('fail', (test, err) => {
        console.error(`${getTabs(level)}Test failed: '${test.title}'`);
        failures++;
        if (!enabled) return;

        if(_.findWhere(testIds, {title: test.title})) {
            rpClient.sendLog(_.findWhere(testIds, {title: test.title}).id, {
                level: RP_LEVEL.FAILED,
                message: err.message,
                time: rpClient.helpers.now()
            }).promise.catch((err) => {
                log.error(`TEST Fail ${test.title}: Error ${JSON.stringify(err)}`);
            });
        }
    });

    runner.on('pass', function(test) {
        passes++;
        console.log(`${getTabs(level)}Test passed: '${test.title}'`);
    });
}

mocha.utils.inherits(RPReporter, mocha.reporters.Spec);

module.exports = RPReporter;