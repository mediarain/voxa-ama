'use strict';

// Include the state machine module 
const Voxa = require('voxa');
const voxaAma = require('voxa-ama');

const config = require('../config');

// Controllers use views to send responses to the user
const views = {
	Intent: {
      Launch: { ask: 'Welcome! Ask me for help.', reprompt: 'Just say: help me' },
      EasterEgg: { tell: 'Boo!' },
      Help: { tell: 'This is an example for AWS Mobile analytics integration.' },
    },
};

// initialize the skill
const skill = new Voxa({ views });
voxaAma(skill, config.ama);

// respond to a LaunchIntent
skill.onIntent('LaunchIntent', alexaEvent => {
  alexaEvent.ama.log('my-custom-event',{myVariable: 'hello'}) // Will log an additional event to analytics with the variable {myVariable: hello}
  alexaEvent.ama.variables.myOtherVariable = 'hi there'; // When this state is logged, this variable will be added
  return { reply: 'Intent.Launch', to: 'entry' }
});

skill.onIntent('EasterEggIntent', alexaEvent => {
  alexaEvent.ama.ignore(); // Will not log this state to analytics
  return { reply: 'Intent.EasterEgg' }
});

skill.onIntent('AMAZON.HelpIntent', () => ({ reply: 'Intent.Help', to: 'die' }));

// lambda handler
exports.handler = skill.lambda();
