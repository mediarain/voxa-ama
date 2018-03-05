'use strict';

const _ = require('lodash');
const AWS = require('aws-sdk');
const debug = require('debug')('voxa:ama');
const EventRider = require('./EventRider');

const defaultConfig = {
  ignoreUsers: [],
};

function register(skill, config) {
  if (!config.appId) throw new Error('appId is required in the config file');

  const pluginConfig = _.merge({}, defaultConfig, config);

  AWS.config.region = pluginConfig.region || 'us-east-1';

  if (pluginConfig.cognitoIdentityPoolId) {
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      // Required e.g. 'us-east-1:12345678-c1ab-4122-913b-22d16971337b'
      IdentityPoolId: pluginConfig.cognitoIdentityPoolId,
    });
  }

  const clientContext = {
    client: {
      app_title: pluginConfig.appTitle,
      app_version_name: pluginConfig.appVersionName,
      app_version_code: pluginConfig.appVersionCode,
      app_package_name: pluginConfig.appPackageName || process.env.AWS_LAMBDA_FUNCTION_NAME || 'localhost',
    },
    env: {
      platform: pluginConfig.platform,
      platform_version: pluginConfig.platformVersion,
      model: pluginConfig.model,
      make: pluginConfig.make,
    },
    services: {
      mobile_analytics: {
        app_id: pluginConfig.appId,
      },
    },
    custom: {},
  };

  skill.onRequestStarted((voxaEvent) => {
    const options = _.clone(clientContext);
    options.client.client_id = voxaEvent.user.userId;
    options.env.locale = voxaEvent.request.locale;

    debug(`AMA initialized: ${JSON.stringify(options, null, 2)}`);

    voxaEvent.ama = new EventRider(voxaEvent, options);
  });

  skill.onSessionStarted((voxaEvent) => {
    voxaEvent.ama.logEvents('Session started');
  });

  skill.onBeforeStateChanged((voxaEvent, reply, state) => {
    voxaEvent.ama.state = state.name;

    if (state.name !== 'entry') {
      voxaEvent.ama.logEvents('States', state.name);
    }
  });

  skill.onIntentRequest((voxaEvent) => {
    const slots = _.mapValues(voxaEvent.intent.slots, value => value.value);

    voxaEvent.ama.logEvents(voxaEvent.intent.name, slots);
  });

  skill.onBeforeReplySent((voxaEvent, reply, transition) => {
    const rider = voxaEvent.ama;

    if (transition && !rider.ignoreState) {
      const transitionEvent = {};
      if (transition.reply) transitionEvent.reply = transition.reply;

      transitionEvent.state = rider.name;
      transitionEvent.to = transition.to.name;

      voxaEvent.ama.logEvents('Transition', transitionEvent);
      debug(`Transition logged: ${JSON.stringify(transition.to)}`);
      return send(voxaEvent);
    }
  });

  skill.onSessionEnded((voxaEvent) => {
    if (voxaEvent.request.type === 'SessionEndedRequest') {
      voxaEvent.ama.logEvents('Session ended', { reason: voxaEvent.request.reason });
      debug('Session Ended logged');
    }

    return send(voxaEvent);
  });

  skill.onStateMachineError((voxaEvent, reply, error) => {
    debug(`Error logged: ${error}`);

    voxaEvent.ama.logEvents('Error', error);
    send(voxaEvent);
  });

  function send(voxaEvent) {
    if (_.includes(pluginConfig.ignoreUsers, voxaEvent.user.userId)) return Promise.resolve(null);
    if (config.suppressSending) return Promise.resolve(null);

    const stopTimestamp = new Date().toISOString();
    const eventsToLog = _(voxaEvent.ama.amaEvents)
    .map(x => createEvent(
      voxaEvent.ama.sessionId,
      voxaEvent.ama.startTimestamp,
      stopTimestamp,
      x.eventType,
      x.attributes))
    .value();

    const params = {
      clientContext: JSON.stringify(voxaEvent.ama.context),
      events: eventsToLog,
    };

    debug(`Params to send: ${JSON.stringify(params, null, 2)}`);

    const awsAMA = new AWS.MobileAnalytics();

    return awsAMA
    .putEvents(params)
    .promise()
    .then((data) => {
      debug(`AMA successfully sent ${_.size(eventsToLog)} events with data: ${data || {}}`);
      return data;
    })
    .catch((err) => {
      debug(`Error sending AMA: ${err}`);
      return err;
    });
  }

  function createEvent(sessionId, startTimestamp, stopTimestamp, eventType, attributes, metrics) {
    return {
      eventType,
      timestamp: new Date().toISOString(),
      attributes: attributes || {},
      session: {
        id: sessionId.substr(sessionId.length - 50),
        startTimestamp,
        stopTimestamp,
        duration: new Date(stopTimestamp).getTime() - new Date(startTimestamp).getTime(),
      },
      version: 'v2.0',
      metrics: metrics || {},
    };
  }
}

module.exports = register;
