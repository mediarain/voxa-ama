'use strict';

const chai = require('chai');
const AMA = require('aws-sdk-mobile-analytics');

const simple = require('simple-mock');

const expect = chai.expect;
const Voxa = require('voxa');
const voxaAma = require('../lib/Voxa-AmazonMobileAnalytics');
const views = require('./views');

describe('Voxa-AmazonMobileAnalytics plugin', () => {
  let voxaStateMachine;
  let mobileAnalyticsClient;

  const amaConfig = {
    appId: 'appId',
    appTitle: 'appTitle',
    make: 'Amazon',
    platform: 'Alexa',
    cognitoIdentityPoolId: 'us-east-1:123456789-1234-1234-1234-1234567891234',
    suppressSending: true
  };

  beforeEach(() => {
    mobileAnalyticsClient = new AMA.Manager(amaConfig);
    simple.mock(mobileAnalyticsClient, 'submitEvents').callbackWith('MOCK TRACKED');
    simple.mock(mobileAnalyticsClient, 'recordEvent').returnWith('MOCK TRACKED');
    simple.mock(AMA, 'Manager').returnWith(mobileAnalyticsClient);

    voxaStateMachine = new Voxa({ views });
  });

  afterEach(() => {
    simple.restore();
  });

  it('should register AMA analytics on LaunchRequest', () => {
    const spy = simple.spy(() => ({ reply: 'LaunchIntent.OpenResponse', to: 'entry' }));
    voxaStateMachine.onIntent('LaunchIntent', spy);

    const event = {
      request: {
        type: 'LaunchRequest',
      },
      session: {
        new: true,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaAma(voxaStateMachine, amaConfig);
    return voxaStateMachine.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.session.new).to.equal(true);
        expect(reply.session.attributes.state).to.equal('entry');
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('Hello! How are you?');
        expect(mobileAnalyticsClient.recordEvent.called).to.be.true;
        expect(mobileAnalyticsClient.recordEvent.calls[0].args[0]).to.equal('IntentRequest');
        expect(mobileAnalyticsClient.recordEvent.calls[0].args[1]).to.deep.equal({ intent: 'LaunchIntent' });
        expect(mobileAnalyticsClient.submitEvents.called).to.be.false;
      });
  });

  it('should register state information', () => {
    const spy = simple.spy(() => ({ reply: 'LaunchIntent.OpenResponse', to: 'entry' }));
    voxaStateMachine.onIntent('LaunchIntent', spy);

    const event = {
      request: {
        type: 'LaunchRequest',
      },
      session: {
        new: true,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaAma(voxaStateMachine, amaConfig);
    return voxaStateMachine.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.session.new).to.equal(true);
        expect(reply.session.attributes.state).to.equal('entry');
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('Hello! How are you?');
        expect(mobileAnalyticsClient.recordEvent.called).to.be.true;
        expect(mobileAnalyticsClient.recordEvent.calls[0].args[0]).to.equal('IntentRequest');
        expect(mobileAnalyticsClient.recordEvent.calls[0].args[1]).to.deep.equal({ intent: 'LaunchIntent' });
        expect(mobileAnalyticsClient.recordEvent.calls[0].returned).to.equal('MOCK TRACKED');
        expect(mobileAnalyticsClient.recordEvent.calls[1].args[0]).to.equal('Custom');
        expect(mobileAnalyticsClient.recordEvent.calls[1].args[1]).to.deep.equal({ state: 'LaunchIntent', to: 'entry', reply: 'LaunchIntent.OpenResponse' });
        expect(mobileAnalyticsClient.recordEvent.calls[1].returned).to.equal('MOCK TRACKED');
        expect(mobileAnalyticsClient.submitEvents.called).to.be.false;
      });
  });

  it('should register states that don\'t have a reply', () => {
    const spy = simple.spy(() => ({ to: 'die' }));
    voxaStateMachine.onIntent('LaunchIntent', spy);

    const event = {
      request: {
        type: 'LaunchRequest',
      },
      session: {
        new: true,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaAma(voxaStateMachine, amaConfig);
    return voxaStateMachine.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(mobileAnalyticsClient.recordEvent.called).to.be.true;
        expect(mobileAnalyticsClient.recordEvent.calls[0].args[0]).to.equal('IntentRequest');
        expect(mobileAnalyticsClient.recordEvent.calls[0].args[1]).to.deep.equal({ intent: 'LaunchIntent' });
        expect(mobileAnalyticsClient.recordEvent.calls[0].returned).to.equal('MOCK TRACKED');
        expect(mobileAnalyticsClient.recordEvent.calls[1].args[0]).to.equal('Custom');
        expect(mobileAnalyticsClient.recordEvent.calls[1].args[1]).to.deep.equal({ state: 'LaunchIntent', to: 'die' });
        expect(mobileAnalyticsClient.recordEvent.calls[1].returned).to.equal('MOCK TRACKED');
        expect(mobileAnalyticsClient.submitEvents.called).to.be.false;
      });
  });

  it('should register AMA analytics on IntentRequest', () => {
    const spy = simple.spy(() => ({ reply: 'Question.Ask', to: 'entry' }));
    voxaStateMachine.onIntent('SomeIntent', spy);

    const event = {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'SomeIntent',
        },
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaAma(voxaStateMachine, amaConfig);
    return voxaStateMachine.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.session.new).to.equal(false);
        expect(reply.session.attributes.state).to.equal('entry');
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('What time is it?');
        expect(mobileAnalyticsClient.recordEvent.called).to.be.true;
        expect(mobileAnalyticsClient.recordEvent.calls[0].args[0]).to.equal('IntentRequest');
        expect(mobileAnalyticsClient.recordEvent.calls[0].args[1]).to.deep.equal({ intent: 'SomeIntent' });
        expect(mobileAnalyticsClient.recordEvent.calls[0].returned).to.equal('MOCK TRACKED');
        expect(mobileAnalyticsClient.recordEvent.calls[1].args[0]).to.equal('Custom');
        expect(mobileAnalyticsClient.recordEvent.calls[1].args[1]).to.deep.equal({ reply: 'Question.Ask', state: 'SomeIntent', to: 'entry' });
        expect(mobileAnalyticsClient.recordEvent.calls[1].returned).to.equal('MOCK TRACKED');
        expect(mobileAnalyticsClient.submitEvents.called).to.be.false;
      });
  });

  it('should register AMA analytics on IntentRequest and end the session', () => {
    const spy = simple.spy(() => ({ reply: 'ExitIntent.GeneralExit', to: 'die' }));
    voxaStateMachine.onIntent('ExitIntent', spy);

    const event = {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'ExitIntent',
        },
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaAma(voxaStateMachine, amaConfig);
    return voxaStateMachine.execute(event)
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
    voxaStateMachine.onState('ExitIntent', spy);

    const event = {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'ExitIntent',
        },
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaAma(voxaStateMachine, amaConfig);
    return voxaStateMachine.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.false;
        expect(reply.session.new).to.equal(false);
        expect(reply.session.attributes).to.deep.equal({});
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('An unrecoverable error occurred.');
        expect(mobileAnalyticsClient.recordEvent.called).to.be.true;
        expect(mobileAnalyticsClient.recordEvent.calls[0].args[0]).to.equal('IntentRequest');
        expect(mobileAnalyticsClient.recordEvent.calls[0].args[1]).to.deep.equal({ intent: 'ExitIntent' });
        expect(mobileAnalyticsClient.recordEvent.calls[0].returned).to.equal('MOCK TRACKED');
        expect(mobileAnalyticsClient.submitEvents.called).to.be.false;
      });
  });

  it('should register AMA analytics on SessionEndedRequest', () => {
    const spy = simple.spy(() => ({ reply: 'ExitIntent.GeneralExit' }));
    voxaStateMachine.onSessionEnded(spy);

    const event = {
      request: {
        type: 'SessionEndedRequest',
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaAma(voxaStateMachine, amaConfig);
    return voxaStateMachine.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.version).to.equal('1.0');
        expect(mobileAnalyticsClient.recordEvent.called).to.be.true;
        expect(mobileAnalyticsClient.recordEvent.calls[0].args[0]).to.equal('Session ended');
        expect(mobileAnalyticsClient.recordEvent.calls[0].returned).to.equal('MOCK TRACKED');
        expect(mobileAnalyticsClient.recordEvent.calls[1].args[0]).to.equal('_session.stop');
        expect(mobileAnalyticsClient.recordEvent.calls[1].returned).to.equal('MOCK TRACKED');
        expect(mobileAnalyticsClient.submitEvents.called).to.be.false;
      });
  });

  it('should register AMA analytics on unexpected error', () => {
    const intentSpy = simple.spy(() => {
      throw new Error('random error');
    });
    voxaStateMachine.onIntent('ErrorIntent', intentSpy);

    const spy = simple.spy(() => ({ reply: 'BadInput.RepeatLastAskReprompt', to: 'invalid-state' }));
    voxaStateMachine.onError(spy);

    const event = {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'ErrorIntent',
        },
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaAma(voxaStateMachine, amaConfig);
    return voxaStateMachine.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply.reply).to.equal('BadInput.RepeatLastAskReprompt');
        expect(reply.to).to.equal('invalid-state');
        expect(reply.error.toString()).to.equal('Error: random error');
      });
  });

  it('should not record analytics if the user is ignored', () => {
    const spy = simple.spy(() => ({ reply: 'ExitIntent.GeneralExit' }));
    voxaStateMachine.onSessionEnded(spy);

    const event = {
      request: {
        type: 'SessionEndedRequest',
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaAma(voxaStateMachine, Object.assign({ignoreUsers: ['user-id']}, amaConfig));
    return voxaStateMachine.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(reply).to.deep.equal({ version: '1.0' });
        expect(mobileAnalyticsClient.recordEvent.called).to.be.true;
        expect(mobileAnalyticsClient.recordEvent.calls[0].args[0]).to.equal('Session ended');
        expect(mobileAnalyticsClient.recordEvent.calls[0].returned).to.equal('MOCK TRACKED');
        expect(mobileAnalyticsClient.recordEvent.calls[1].args[0]).to.equal('_session.stop');
        expect(mobileAnalyticsClient.recordEvent.calls[1].returned).to.equal('MOCK TRACKED');
        expect(mobileAnalyticsClient.submitEvents.called).to.be.false;
      });
  });

  it('should record sessions terminated due to errors as an error', () => {
    const spy = simple.spy(() => ({ reply: 'ExitIntent.GeneralExit' }));
    voxaStateMachine.onSessionEnded(spy);

    const event = {
      request: {
        type: 'SessionEndedRequest',
        reason: 'ERROR',
        error: {
          message: 'my message'
        }
      },
      session: {
        new: false,
        application: {
          applicationId: 'appId',
        },
        user: {
          userId: 'user-id',
        },
      },
    };

    voxaAma(voxaStateMachine, Object.assign({ignoreUsers: ['user-id']}, amaConfig));
    return voxaStateMachine.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.false;
        expect(reply.session.new).to.equal(false);
        expect(reply.session.attributes).to.deep.equal({});
        expect(reply.msg.statements).to.have.lengthOf(1);
        expect(reply.msg.statements[0]).to.equal('An unrecoverable error occurred.');
        expect(mobileAnalyticsClient.recordEvent.called).to.be.false;
        expect(mobileAnalyticsClient.submitEvents.called).to.be.false;
      });
  });
});
