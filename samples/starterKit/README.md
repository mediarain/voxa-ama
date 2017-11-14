# Voxa 

### Development Setup

* `git clone` this repository
* Install and use Node v4.3.2
* Run `npm install`
* Edit `config/local.json` with all of the requisite fields.

`npm run watch` will start the server and watch for changes.


### Directory Structure

	`config/` -> Environment variables or configuration
	`services/` -> API clients, Authentications and Extras
	`skill/` -> Amazon Echo Skill login, the state machine and flow
	`speechAssets/` -> Amazon Echo Utterances, Intent Schema and Custom Slots.
	`tests/` -> Unit Tests
	`gulpfile.js` -> Gulp tasks
	`serverless.yml` -> Serverless configuration
	`package.json` -> Dependencies
	`README.md`

For AWS Mobile Analytics integration, you just have to add the appId, appTitle and cognitoIdentityPoolId to your local.json file like this:

```
{
  "server": {
    "port": 3000,
    "hostSkill": true
  },
  "ama": {
    "appId": "YOUR-APP-ID",
    "appTitle": "YOUR-APP-TITLE",
    "cognitoIdentityPoolId": "YOUR-COGNITO-IDENTITY-POOL-ID",
    "suppressSending": false
  }
}

```