# report-portal-reporter

### Mocha reporter for EPAM report portal
This is mocha runtime reporter

It was designed to work with mocha programmatically, in order to be able to parametrize each test run.


#### Instalation steps:

`npm install report-portal-reporter`

#### How to use:

Enable report portal set env variable RPENABLED=true

Add posibility to use environment variables: RPTOKEN, RPLUNCH, RPENDPOINT, RPPROJECT and RPTAGS;

######WARNING: Test execution will slow down due to sync request to RP 
