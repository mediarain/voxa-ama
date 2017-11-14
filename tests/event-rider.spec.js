'use strict';

const chai = require('chai');
const AMA = require('aws-sdk-mobile-analytics');

const simple = require('simple-mock');

const expect = chai.expect;
const EventRider = require('../lib/EventRider');

const amaConfig = {
  appId: 'appId',
  appTitle: 'appTitle',
  make: "Amazon",
  platform: "Alexa",
  cognitoIdentityPoolId: "us-east-1:123456789-1234-1234-1234-1234567891234",
  suppressSending: true
};

let mobileAnalyticsClient;

describe('EventRider', () => {
  beforeEach(() => {
    mobileAnalyticsClient = new AMA.Manager(amaConfig);
    simple.mock(mobileAnalyticsClient, 'submitEvents').callbackWith('MOCK TRACKED');
    simple.mock(mobileAnalyticsClient, 'recordEvent').returnWith('MOCK TRACKED');
  });

  afterEach(function(){
    simple.restore();
  })

  it('should ignore the entry state', () => {
    let sut = new EventRider({},{name: 'entry'}, mobileAnalyticsClient);
    expect(sut.ignoreState).to.be.true;
  });

  it('should not ignore other states', () => {
    let sut = new EventRider({},{name: 'goodie'}, mobileAnalyticsClient);
    expect(sut.ignoreState).to.be.false;
  });

  it('ignore method means we ignore things', () => {
    let sut = new EventRider({},{name: 'blah'}, mobileAnalyticsClient);
    expect(sut.ignoreState).to.be.false;
    sut.ignore();
    expect(sut.ignoreState).to.be.true;
  });

  it('remember the state name', () => {
    let sut = new EventRider({},{name: 'goodie'}, mobileAnalyticsClient);
    expect(sut.name).to.equal('goodie')
  });

  describe('log',() =>{
    it('write a custom event', () => {
      let sut = new EventRider({user: {userId: 'myId'}},{name: 'goodie'}, mobileAnalyticsClient);
      sut.log('blah',{meat: 'yummy'});

      expect(mobileAnalyticsClient.recordEvent.called).to.be.true;
      expect(mobileAnalyticsClient.recordEvent.lastCall.args[0]).to.equal('blah');
      expect(mobileAnalyticsClient.recordEvent.lastCall.args[1].meat).to.equal('yummy');
    });

    it('write a custom event with no variables', () => {
      let sut = new EventRider({user: {userId: 'myId'}},{name: 'goodie'}, mobileAnalyticsClient);
      sut.log('blah');

      expect(mobileAnalyticsClient.recordEvent.called).to.be.true;
      expect(mobileAnalyticsClient.recordEvent.lastCall.args[0]).to.equal('blah');
    });
  })
});
