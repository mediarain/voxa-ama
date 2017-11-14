'use strict';

module.exports = class AmazonMobileAnalyticsEventRider {
  constructor(event, state, client) {
    this.name = state.name;
    this.alexaEvent = event;
    this.mobileAnalyticsClient = client;
    this.variables = {};
    this.ignoreState = this.name === 'entry'; // The entry state is at the start of every request, so it's really not interesting to know anything about;
  }

  ignore() {
    this.ignoreState = true;
  }

  log(eventName, variables) {
    this.mobileAnalyticsClient.recordEvent(eventName, variables || {});
  }

};
