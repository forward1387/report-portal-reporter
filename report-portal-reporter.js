"use strict";

const mocha = require('mocha'),
    path = require('path'),
    _ = require('underscore');

let RPClient = require('reportportal-client');

let config;

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
        if (options.reporterOptions.configFile) {
            config = options.reporterOptions.configOptions ? options.reporterOptions.configOptions : require(path.join(process.cwd(), options.reporterOptions.configFile));
        } else {
            config = {
                token: options.reporterOptions.token || process.env.TOKEN,
                endpoint: options.reporterOptions.endpoint || process.env.ENDPOINT,
                launch: options.reporterOptions.launch || process.env.LUNCH,
                project: options.reporterOptions.project || process.env.PROJECT, 
                tags: ((options.reporterOptions.tags || process.env.TAGS) || '').split(' ')
            }
        }
    } catch (err) {
        console.error(`Failed to load config. Error: ${err}`);
    }

    rpClient = new RPClient(config);
    let description = config.description || "";

    runner.on('start', function()  {
        if(!rpClient) {
            console.log(JSON.stringify(config));
            rpClient = new RPClient(config);
        }

        let lunch = rpClient.startLaunch({
            name: cutStringLength(config.launch, 256),
            start_time: rpClient.helpers.now(),
            description: description,
            tags: config.tags
        });

        launchId = lunch.tempId;

        lunch.promise.catch((err) => {
            console.error(`LUNCH Start ${suite.title}: Error ${JSON.stringify(err)}`);
        });
    });

    runner.on('end', function(){
        rpClient.finishLaunch(launchId, {
            end_time: rpClient.helpers.now()
        }).promise.catch((err) => {
            console.error(`LUNCH End ${suite.title}: Error ${JSON.stringify(err)}`);
        });
    });

    runner.on('suite', function(suite){
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
                console.error(`SUITE Started ${suite.title}: Error ${JSON.stringify(err)}`);
            });
        } else {
            
            let suiteObj = rpClient.startTestItem({
                name: cutStringLength(suite.title, 256),
                start_time: rpClient.helpers.now(),
                type: RP_ITEM_TYPE.SUITE
            }, launchId);

            suiteIds.push({id: suiteObj.tempId, title: suite.title});
            suiteObj.promise.catch((err) => {
                console.error(`SUITE Started ${suite.title}: Error ${JSON.stringify(err)}`);
            });
        }
    });

    runner.on('suite end', function(suite){
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
                console.error(`SUITE End ${suite.title}: Error ${JSON.stringify(err)}`);
            });
        }

    });
    
    runner.on('test', function(test) {
        let testObj = rpClient.startTestItem({
            name: cutStringLength(test.title, 256),
            start_time: rpClient.helpers.now(),
            tags: [],
            type: RP_ITEM_TYPE.TEST
        }, launchId, _.findWhere(suiteIds, {title: test.parent.title}).id);

        testIds.push({id: testObj.tempId, title: test.title});

        testObj.promise.catch((err) => {
            console.error(`TEST Started ${test.title}: Error ${JSON.stringify(err)}`);
        });
    });

    runner.on('pending', function (test) {
        let testObj = rpClient.startTestItem({
            name: cutStringLength(test.title, 256),
            start_time: rpClient.helpers.now(),
            tags: [],
            type: RP_ITEM_TYPE.TEST
        }, launchId, _.findWhere(suiteIds, {title: test.parent.title}).id);

        testIds.push({id: testObj.tempId, title: test.title});

        testObj.promise.catch((err) => {
            console.error(`TEST Started ${test.title}: Error ${JSON.stringify(err)}`);
        });
    });

    runner.on('test end', function(test){
        let item = testIds.pop();
        if(test.pending === true) {
            rpClient.finishTestItem(item.id, {
                status: RP_STATUS.SKIPPED,
                end_time: rpClient.helpers.now()
            }).promise.catch((err) => {
                console.error(`TEST End ${test.title}: Error ${JSON.stringify(err)}`);
            });
        } else {
            rpClient.finishTestItem(item.id, {
                status: test.state,
                end_time: rpClient.helpers.now()
            }).promise.catch((err) => {
                console.error(`TEST End ${test.title}: Error ${JSON.stringify(err)}`);
            });        
        } 
    });

    runner.on('fail', (test, err) => {
        if(_.findWhere(testIds, {title: test.title})) {
            rpClient.sendLog(_.findWhere(testIds, {title: test.title}).id, {
                level: RP_LEVEL.FAILED,
                message: err.message,
                time: rpClient.helpers.now()
            }).promise.catch((err) => {
                console.error(`TEST Fail ${test.title}: Error ${JSON.stringify(err)}`);
            });
        }
    });
}

module.exports = RPReporter;