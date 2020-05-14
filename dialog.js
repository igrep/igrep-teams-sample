// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');
const { ComponentDialog } = require('botbuilder-dialogs');

class LogoutDialog extends ComponentDialog {
  async onBeginDialog(innerDc, options) {
    const result = await this.interrupt(innerDc);
    if (result) {
      return result;
    }

    return await super.onBeginDialog(innerDc, options);
  }

  async onContinueDialog(innerDc) {
    const result = await this.interrupt(innerDc);
    if (result) {
      return result;
    }

    return await super.onContinueDialog(innerDc);
  }

  async interrupt(innerDc) {
    if (innerDc.context.activity.type === ActivityTypes.Message) {
      const text = innerDc.context.activity.text ? innerDc.context.activity.text.toLowerCase() : '';
      if (text === 'logout') {
        // The bot adapter encapsulates the authentication processes.
        const botAdapter = innerDc.context.adapter;
        await botAdapter.signOutUser(innerDc.context, process.env.ConnectionName);
        await innerDc.context.sendActivity('You have been signed out.');
        return await innerDc.cancelAllDialogs();
      }
    }
  }
}

const { DialogSet, DialogTurnStatus, OAuthPrompt, WaterfallDialog } = require('botbuilder-dialogs');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const OAUTH_PROMPT = 'oAuthPrompt';

class Dialog extends LogoutDialog {
  constructor() {
    super('Dialog');
    this.addDialog(new OAuthPrompt(OAUTH_PROMPT, {
        connectionName: process.env.ConnectionName,
        text: 'Please login',
        title: 'Login',
        timeout: 300000
      }))
      .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
        this.promptStep.bind(this),
        this.loginStep.bind(this)
      ]));

    this.initialDialogId = MAIN_WATERFALL_DIALOG;
  }

  /**
   * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
   * If no dialog is active, it will start the default dialog.
   * @param {*} turnContext
   * @param {*} accessor
   */
  async run(turnContext, accessor) {
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty) {
      await dialogContext.beginDialog(this.id);
    }
  }

  async promptStep(step) {
    return step.beginDialog(OAUTH_PROMPT);
  }

  async loginStep(step) {
    // Get the token from the previous step. Note that we could also have gotten the
    // token directly from the prompt itself. There is an example of this in the next method.
    const tokenResponse = step.result;
    if (tokenResponse) {
      console.info(`token: ${tokenResponse.token}\n`);
      await step.context.sendActivity('You are now logged in.');
    } else {
      await step.context.sendActivity('Login was not successful. Please try again.');
    }
    return await step.endDialog();
  }
}

module.exports.Dialog = Dialog;
