'use strict';

const _ = require('lodash');
const AWS = require('aws-sdk');
const AMA = require('aws-sdk-mobile-analytics');
const debug = require('debug')('voxa:ama');
const EventRider = require('./EventRider');

let mobileAnalyticsClient;

const defaultConfig = {
  initialState: 'entry',
  appId: 'appId',
  appTitle: 'appTitle',
  ignoreUsers: [],
};

function register(skill, config) {
  const pluginConfig = _.merge({}, defaultConfig, config);

  AWS.config.region = pluginConfig.region || 'us-east-1';
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    // Required e.g. 'us-east-1:12345678-c1ab-4122-913b-22d16971337b'
    IdentityPoolId: pluginConfig.cognitoIdentityPoolId,
  });

  const originalOptions = {
    appId: pluginConfig.appId, // Required e.g. 'c5d69c75a92646b8953126437d92c007'
    appTitle: pluginConfig.appTitle,
    appVersionName: pluginConfig.appVersionName,
    appVersionCode: pluginConfig.appVersionCode,
    appPackageName: pluginConfig.appPackageName || process.env.AWS_LAMBDA_FUNCTION_NAME || 'localhost',
    make: pluginConfig.make,
    model: pluginConfig.model,
    platform: pluginConfig.platform,
    platformVersion: pluginConfig.platformVersion,
  };

  if (pluginConfig.enableConsoleLogs) {
    originalOptions.logger = console;
  }

  skill.onSessionStarted((alexaEvent) => {
    const options = _.clone(originalOptions);
    options.clientId = alexaEvent.user.userId;

    debug(`Session started with options: ${JSON.stringify(options)}`);
    mobileAnalyticsClient = new AMA.Manager(options);
  });

  skill.onBeforeStateChanged((event, reply, state) => {
    event.ama = new EventRider(event, state, mobileAnalyticsClient);
  });

  skill.onIntentRequest((alexaEvent) => {
    const options = _.clone(originalOptions);
    options.clientId = alexaEvent.user.userId;
    mobileAnalyticsClient = new AMA.Manager(options);

    const attributes = { intent: alexaEvent.intent.name };

    mobileAnalyticsClient.recordEvent('IntentRequest', attributes);

    debug(`${alexaEvent.intent.name} logged`);
    return send(alexaEvent);
  });

  skill.onAfterStateChanged((alexaEvent, reply, transition) => {
    const rider = alexaEvent.ama;

    if (transition && !rider.ignoreState) {
      if (transition.reply) rider.variables.reply = transition.reply;

      rider.variables.state = rider.name;
      rider.variables.to = transition.to;

      mobileAnalyticsClient.recordEvent('Custom', rider.variables);
      debug(`${transition.to} state logged`);
      return send(alexaEvent);
    }
  });

  skill.onSessionEnded((alexaEvent) => {
    const options = _.clone(originalOptions);
    options.clientId = alexaEvent.user.userId;
    mobileAnalyticsClient = new AMA.Manager(options);

    if (alexaEvent.request.type === 'SessionEndedRequest') {
      if (alexaEvent.request.reason === 'ERROR') {
        mobileAnalyticsClient.recordEvent('Custom', { Error: alexaEvent.request.error });
      } else {
        mobileAnalyticsClient.recordEvent('Session ended');
      }

      debug('Session Ended logged');
      return send(alexaEvent);
    }
  });

  skill.onStateMachineError((alexaEvent, reply, error) => {
    mobileAnalyticsClient.recordEvent('Custom', { Error: error.message });

    debug(`Error logged: ${error}`);
    return send(alexaEvent);
  });

  function send(event) {
    if (_.includes(pluginConfig.ignoreUsers, event.user.userId)) return Promise.resolve(null);
    if (config.suppressSending) return Promise.resolve(null);

    return mobileAnalyticsClient.submitEvents();
  }
}

module.exports = register;
