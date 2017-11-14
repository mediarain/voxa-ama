Voxa AWS Mobile Analytics
===========

[![Build Status](https://travis-ci.org/mediarain/voxa-ama.svg?branch=master)](https://travis-ci.org/mediarain/voxa-ama)
[![Coverage Status](https://coveralls.io/repos/github/mediarain/voxa-ama/badge.svg?branch=master)](https://coveralls.io/github/mediarain/voxa-ama?branch=master)

An [AWS Mobile Analytics](https://aws.amazon.com/mobileanalytics/) plugin for [voxa](https://mediarain.github.io/voxa/)

Installation
-------------

Just install from [npm](https://www.npmjs.com/package/voxa-ama)

```bash
npm install --save voxa-ama
```

Usage
------

```javascript

const voxaAma = require('voxa-ama');

const amaConfig = {
  appId: 'appId',
  appTitle: 'appTitle',
  make: 'Amazon',
  platform: 'Alexa',
  cognitoIdentityPoolId: 'cognitoIdentityPoolId',
  suppressSending: false, // A flag to supress sending hits. Useful while developing on the skill
};

voxaAma(skill, opearloConfig);

```

### Suppressing State Events

Sometimes smaller intermediary states can flood the pathways diagram. Suppress a state from logging as follows:
```javascript
skill.onState('my-state',alexaEvent => {
  alexaEvent.ama.ignore();
  return { reply: 'Greeting', to: 'my-next-state' };
})
```

### Logging variables
You can also add additional values which will be logged along with the state custom event
```javascript
skill.onState('my-state',alexaEvent => {
  alexaEvent.ama.variables.myVariable = 'hello'
  return { reply: 'Greeting', to: 'my-next-state' };
})
```

### Custom Events
You can also log custom events from a state.
```javascript
skill.onState('my-state',alexaEvent => {
  alexaEvent.ama.log('my-custom-event',{ myVariable: 'hello' });
  return { reply: 'Greeting', to: 'my-next-state' };
})
```

### Creating AWS Mobile Analytics project

AWS Mobile Analytics works hand on hand with Pinpoint and Cognito Pools. The values we need for tracking analytics are:
- App ID
- App Name
- Cognito Identity Pool ID

For creating the property, you should follow the next steps:

1) Log in with your AWS account, then in the [AWS Dashboard](https://console.aws.amazon.com/console/home), look for mobile analytics
![step1](https://user-images.githubusercontent.com/12286824/32786689-45b6d7c8-c91a-11e7-9af4-508a9a92d5bc.png)


2) In the main menu of AWS Analytics hit the *Get Started with Amazon Pinpoint* button
![step2](https://user-images.githubusercontent.com/12286824/32786757-6eddb874-c91a-11e7-88a5-35e04bd3e8af.png)


3) You will see here your pinpoint apps. Hit the *Create a project in Mobile Hub* button
![step3](https://user-images.githubusercontent.com/12286824/32786826-9720dc94-c91a-11e7-9621-af50d62d454f.png)


4) Enter the name and select the region, the default region is *US East (Virginia)*
![step4](https://user-images.githubusercontent.com/12286824/32786879-bb8bfbd6-c91a-11e7-8043-25977fd68760.png)


5) Once created, make sure the Analytics checkbox is enabled
![step5](https://user-images.githubusercontent.com/12286824/32786921-ddd2fa78-c91a-11e7-804f-81d4293b9f26.png)

In this step, some resources will be automatically created: a specific role with S3, Pinpoint and Analytics permissions, a Cognito Pool Identity to manage authentication from users and an Amazon S3 Bucket to export your data.


6) Now, go to the [AWS Mobile Analytics menu](https://console.aws.amazon.com/mobileanalytics/home/) and you will see your analytics project ready to receive events from your skill
![step6](https://user-images.githubusercontent.com/12286824/32787013-192fe40a-c91b-11e7-87e2-4f4b05ce6fc7.png)


7) You will see the App Name at the top of the page. Click on it and hit the *Manage Apps* butotn
![step7](https://user-images.githubusercontent.com/12286824/32787026-243fb29e-c91b-11e7-9f94-1201ba80f083.png)


8) Here there are all the mobile analytics project including the one you just created. In the second column you will see the App Id for your project
![step8](https://user-images.githubusercontent.com/12286824/32787996-a572a87e-c91d-11e7-8b44-45b06ce340e7.png)


9) After that, look for [Cognito](https://console.aws.amazon.com/cognito/home)
![step9](https://user-images.githubusercontent.com/12286824/32788016-aef74b52-c91d-11e7-9bcb-c366a784b845.png)


10) Hit the *Manage Federated Identities* button
![step10](https://user-images.githubusercontent.com/12286824/32788043-c1e8f882-c91d-11e7-9b1e-644297227777.png)


11) You will see your cognito pool identities, click on the one created for your project
![step11](https://user-images.githubusercontent.com/12286824/32788059-d1925440-c91d-11e7-9bd4-41301e2606d4.png)


12) You might need to fix something in the configuration, you need to specify the role for your cognito pool. You can either hit the *Click here to fix* or *Edit identity pool* link to go to the configurations.
![step12](https://user-images.githubusercontent.com/12286824/32788094-ed8fe3f6-c91d-11e7-866e-f2d33d713434.png)


13) In this screen you can grab the Identity Pool ID and add the role missing.
![step13](https://user-images.githubusercontent.com/12286824/32788167-1bc3812e-c91e-11e7-8b2e-98dff31c7e14.png)


Once you have the App ID, App Name, and Cognito Pool ID you can add them to the voxa plugin configuration and start tracking the events in your skill. Keep in mind the events will last up to 1 hour to show up in the dashboard and it will look like this:
![step14](https://user-images.githubusercontent.com/12286824/32789176-c5ea04d2-c920-11e7-8cb2-a6a9a6b8dcbd.png)
