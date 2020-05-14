// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

//const { ActivityHandler } = require('botbuilder');
//const users = require('./users');
const { TeamsActivityHandler } = require('botbuilder');

class DialogBot extends TeamsActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState, userState, dialog) {
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.onMessage(async (context, next) => {
            console.log('Running dialog with Message Activity.');

            // Run the Dialog with the new message Activity.
            await this.dialog.run(context, this.dialogState);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}

class Bot extends DialogBot {
    constructor(conversationState, userState, dialog) {
        super(conversationState, userState, dialog);

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Welcome to Authentication Bot on MSGraph. Type anything to get logged in. Type \'logout\' to sign-out.');
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onTokenResponseEvent(async (context, next) => {
            console.log('Running dialog with Token Response Event Activity.');

            // Run the Dialog with the new Token Response Event Activity.
            await this.dialog.run(context, this.dialogState);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async handleTeamsSigninVerifyState(context, state) {
        await this.dialog.run(context, this.dialogState);
    }
}

//class Bot extends ActivityHandler {
  //constructor() {
    //super();
    //// See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    //this.onMessage(async (context, next) => {
      //console.info(`onMessage: ${JSON.stringify(context.activity)}\n`);
      //users.dump();
      //await context.sendActivity(`YOU SAID **${ context.activity.text.toUpperCase() }** at ${new Date()}`);

      //// By calling next() you ensure that the next BotHandler is run.
      //await next();
    //});

    //this.onMembersAdded(async (context, next) => {
      //const membersAdded = context.activity.membersAdded;
      //for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
        //if (membersAdded[cnt].id !== context.activity.recipient.id) {
          //let memberAdded = membersAdded[cnt];
          //console.log(`onMembersAdded: #${memberAdded.aadObjectId}: ${memberAdded.name}`);
          //await context.sendActivity(`こんにちは、${memberAdded.name}さん! <${process.env.OAUTH_LANDING_URI}> からMicrosoftアカウントでログインしてください！`);
        //}
      //}
      //// By calling next() you ensure that the next BotHandler is run.
      //await next();
    //});
  //}
//}

module.exports.Bot = Bot;
