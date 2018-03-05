'use strict';

const _ = require('lodash');

module.exports = class AmazonMobileAnalyticsEventRider {
  constructor(voxaEvent, context) {
    this.context = context;
    this.voxaEvent = voxaEvent;
    this.sessionId = voxaEvent.session.sessionId;
    this.amaEvents = [];
    this.startTimestamp = new Date().toISOString();
  }

  ignore() {
    this.ignoreState = true;
  }

  logEvents(event, value) {
    if (_.isString(value)) {
      const attributes = {};
      attributes[event] = JSON.stringify(value);
      this.amaEvents.push({ eventType: 'Custom', attributes });
    } else {
      this.amaEvents.push({ eventType: event, attributes: value });
    }
  }

};
