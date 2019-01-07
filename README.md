# report-portal-reporter

### Mocha reporter for EPAM report portal
This is mocha runtime reporter

It was designed to work with mocha programmatically, in order to be able to parametrize each test run.


#### Instalation steps:

` npm install report-portal-reporter`

#### How to use:

```javascript
const Mocha = require("mocha");
let mochaMain = new Mocha({    
    reporter: 'mocha-rp-reporter',
    reporterOptions: {
        configFile: "path to config.json",
        configOptions: {
            token: "UNIVERSALLY UNIQUE IDENTIFIER",
            endpoint: "EPAM report portal api url",
            launch: "execution name",
            project: "project name",
            tags: [
                "tag1", "tag2"
            ]
        }                        
    }
});
```

`config.json` should look like this:

```json
{
  "endpoint": "EPAM report portal api url",
  "token": "UNIVERSALLY UNIQUE IDENTIFIER",
  "launch": "execution name",
  "project": "project name",
  "tags": [
    "tag1", "tag2"
  ]
}
```

By default reporter will use `configOptions` otherwise will try to load file from `configFile`

######WARNING: Test execution will slow down due to sync request to RP 
