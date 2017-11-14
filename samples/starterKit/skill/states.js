'use strict';

exports.register = function register(skill) {
  skill.onIntent('LaunchIntent', alexaEvent => {
    alexaEvent.ama.log('my-custom-event',{myVariable: 'hello'}) // Will log an additional event to analytics with the variable {myVariable: hello}
    alexaEvent.ama.variables.myOtherVariable = 'hi there'; // When this state is logged, this variable will be added
    return { reply: 'Intent.Launch', to: 'entry' }
  });

  skill.onIntent('EasterEggIntent', alexaEvent => {
    alexaEvent.ama.ignore(); // Will not log this state to analytics
    return { reply: 'EasterEgg' }
  });

  skill.onIntent('AMAZON.HelpIntent', () => ({ reply: 'Intent.Help', to: 'die' }));
};
