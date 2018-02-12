'use strict';

const _ = require('lodash');
const chai = require('chai');
const AWS = require('aws-sdk-mock');
const simple = require('simple-mock');

const expect = chai.expect;
const Voxa = require('voxa');
const voxaAma = require('../lib/Voxa-AmazonMobileAnalytics');
const views = require('./views');

const event = {
  request: {
    type: 'LaunchRequest',
  },
  session: {
    sessionId: 'SessionId.c6c8f867-9341-4c26-a74f-aab787eccded',
    new: true,
    application: {
      applicationId: 'appId',
    },
    user: {
      userId: 'user-id',
    },
  },
};

const amaConfig = {
  appId: 'appId',
  appTitle: 'appTitle',
  make: 'Amazon',
  platform: 'Alexa',
  cognitoIdentityPoolId: 'us-east-1:123456789-1234-1234-1234-1234567891234',
  suppressSending: false,
};

describe('Voxa-AmazonMobileAnalytics plugin', () => {
  let voxaStateMachine;

  beforeEach(() => {
    AWS.mock('MobileAnalytics', 'putEvents', 'MOCK DATA');

    voxaStateMachine = new Voxa({ views });
  });

  afterEach(() => {
    AWS.restore();
    simple.restore();
  });

  it('should register AMA analytics on LaunchRequest', () => {
    const spy = simple.spy(() => ({ reply: 'LaunchIntent.OpenResponse', to: 'entry' }));
    voxaStateMachine.onIntent('LaunchIntent', spy);

    const customEvent = _.cloneDeep(event);

    voxaAma(voxaStateMachine, _.cloneDeep(amaConfig));
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.session.new).to.equal(true);
        expect(reply.session.attributes.state).to.equal('entry');
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('Hello! How are you?');
      });
  });

  it('should register state information', () => {
    const spy = simple.spy(() => ({ reply: 'LaunchIntent.OpenResponse', to: 'entry' }));
    voxaStateMachine.onIntent('LaunchIntent', spy);

    const customEvent = _.cloneDeep(event);

    voxaAma(voxaStateMachine, _.cloneDeep(amaConfig));
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.session.new).to.equal(true);
        expect(reply.session.attributes.state).to.equal('entry');
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('Hello! How are you?');
      });
  });

  it('should register states that don\'t have a reply', () => {
    const spy = simple.spy(() => ({ to: 'die' }));
    voxaStateMachine.onIntent('LaunchIntent', spy);

    const customEvent = _.cloneDeep(event);

    voxaAma(voxaStateMachine, _.cloneDeep(amaConfig));
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(spy.called).to.be.true;
      });
  });

  it('should register AMA analytics on IntentRequest', () => {
    const spy = simple.spy(() => ({ reply: 'Question.Ask', to: 'entry' }));
    voxaStateMachine.onIntent('SomeIntent', spy);

    const customEvent = _.cloneDeep(event);
    customEvent.request.type = 'IntentRequest';
    customEvent.request.intent = { name: 'SomeIntent', slots: { something: { name: 'something', value: 'something'} } };
    customEvent.session.new = false;

    voxaAma(voxaStateMachine, _.cloneDeep(amaConfig));
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.session.new).to.equal(false);
        expect(reply.session.attributes.state).to.equal('entry');
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('What time is it?');
      });
  });

  it('should register AMA analytics on IntentRequest and end the session', () => {
    const spy = simple.spy(() => ({ reply: 'ExitIntent.GeneralExit', to: 'die' }));
    voxaStateMachine.onIntent('ExitIntent', spy);

    const customEvent = _.cloneDeep(event);
    customEvent.request.type = 'IntentRequest';
    customEvent.request.intent = { name: 'ExitIntent' };
    customEvent.session.new = false;

    voxaAma(voxaStateMachine, _.cloneDeep(amaConfig));
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.session.new).to.equal(false);
        expect(reply.session.attributes.state).to.equal('die');
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('Ok. Goodbye.');
      });
  });

  it('should not register AMA analytics on IntentRequest with an invalid state', () => {
    const spy = simple.spy(() => ({ reply: 'ExitIntent.GeneralExit', to: 'die' }));
    voxaStateMachine.onState('exit', spy);

    const customEvent = _.cloneDeep(event);
    customEvent.request.type = 'IntentRequest';
    customEvent.request.intent = { name: 'ExitIntent' };
    customEvent.session.new = false;

    voxaAma(voxaStateMachine, _.cloneDeep(amaConfig));
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(spy.called).to.be.false;
        expect(reply.session.new).to.equal(false);
        expect(reply.session.attributes).to.deep.equal({});
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('An unrecoverable error occurred.');
      });
  });

  it('should not register AMA analytics on Goodbye state when user ignored it', () => {
    const spy = simple.spy((voxaEvent) => {
      voxaEvent.ama.ignore();
      return { reply: 'ExitIntent.GeneralExit', to: 'die' };
    });

    voxaStateMachine.onIntent('ExitIntent', spy);

    const customEvent = _.cloneDeep(event);
    customEvent.request.type = 'IntentRequest';
    customEvent.request.intent = { name: 'ExitIntent' };
    customEvent.session.new = false;

    voxaAma(voxaStateMachine, _.cloneDeep(amaConfig));
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.session.new).to.equal(false);
        expect(reply.session.attributes.state).to.equal('die');
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('Ok. Goodbye.');
      });
  });

  it('should register AMA analytics on SessionEndedRequest', () => {
    const spy = simple.spy(() => ({ reply: 'ExitIntent.GeneralExit' }));
    voxaStateMachine.onSessionEnded(spy);

    const customEvent = _.cloneDeep(event);
    customEvent.request.type = 'SessionEndedRequest';
    customEvent.request.reason = 'USER_INITIATED';

    voxaAma(voxaStateMachine, _.cloneDeep(amaConfig));
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.version).to.equal('1.0');
      });
  });

  it('should not record analytics if the user is ignored', () => {
    const spy = simple.spy(() => ({ reply: 'ExitIntent.GeneralExit' }));
    voxaStateMachine.onSessionEnded(spy);

    const customEvent = _.cloneDeep(event);
    customEvent.request.type = 'SessionEndedRequest';

    voxaAma(voxaStateMachine, Object.assign({ignoreUsers: ['user-id']}, _.cloneDeep(amaConfig)));
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply).to.deep.equal({ version: '1.0' });
      });
  });

  it('should not record analytics due to suppressSending flag set to true', () => {
    const spy = simple.spy(() => ({ reply: 'ExitIntent.GeneralExit' }));
    voxaStateMachine.onSessionEnded(spy);

    const customEvent = _.cloneDeep(event);
    customEvent.request.type = 'SessionEndedRequest';

    const amaConfigCloned = _.cloneDeep(amaConfig);
    amaConfigCloned.suppressSending = true;

    voxaAma(voxaStateMachine, amaConfigCloned);
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply).to.deep.equal({ version: '1.0' });
      });
  });
});

describe('Voxa-AmazonMobileAnalytics errors', () => {
  let voxaStateMachine;
  const errorMock = new Error('random error');

  beforeEach(() => {
    AWS.mock('MobileAnalytics', 'putEvents', (params, callback) => {
      callback(errorMock);
    });

    voxaStateMachine = new Voxa({ views });
  });

  afterEach(() => {
    AWS.restore();
    simple.restore();
  });

  it('should record SessionEndedRequest error', () => {
    const customEvent = _.cloneDeep(event);
    customEvent.session.new = false;
    customEvent.request = {
      type: 'SessionEndedRequest',
      reason: 'ERROR',
      error: {
        message: 'my message'
      },
    };

    voxaAma(voxaStateMachine, _.cloneDeep(amaConfig));
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(reply.session.new).to.equal(false);
        expect(reply.session.attributes).to.deep.equal({});
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('An unrecoverable error occurred.');
      });
  });

  it('should throw an error when trying to send AMA analytics on LaunchRequest', () => {
    const spy = simple.spy(() => ({ reply: 'LaunchIntent.OpenResponse', to: 'entry' }));
    voxaStateMachine.onIntent('LaunchIntent', spy);

    const customEvent = _.cloneDeep(event);

    voxaAma(voxaStateMachine, _.cloneDeep(amaConfig));
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.session.new).to.equal(true);
        expect(reply.session.attributes.state).to.equal('entry');
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('Hello! How are you?');
      });
  });

  it('should register AMA analytics on unexpected error', () => {
    const intentSpy = simple.spy(() => {
      throw errorMock;
    });

    voxaStateMachine.onIntent('ErrorIntent', intentSpy);

    const spy = simple.spy(() => ({ reply: 'BadInput.RepeatLastAskReprompt', to: 'invalid-state' }));
    voxaStateMachine.onStateMachineError(spy);

    const customEvent = _.cloneDeep(event);
    customEvent.request.type = 'IntentRequest';
    customEvent.request.intent = { name: 'ErrorIntent' };
    customEvent.session.new = false;

    voxaAma(voxaStateMachine, _.cloneDeep(amaConfig));
    return voxaStateMachine.execute(customEvent)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.reply).to.equal('BadInput.RepeatLastAskReprompt');
        expect(reply.to).to.equal('invalid-state');
        expect(reply.error.toString()).to.equal('Error: random error');
      });
  });

  it('should throw an error for missing appId', () => {
    try {
      const amaConfigCloned = _.cloneDeep(amaConfig);
      amaConfigCloned.appId = undefined;

      voxaAma(voxaStateMachine, amaConfigCloned);
    } catch (err) {
      expect(err.message).to.equal('appId is required in the config file');
    }
  });
});
