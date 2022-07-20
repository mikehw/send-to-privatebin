// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const privatebin = require('@agc93/privatebin');
const PrivateBinClient = privatebin.PrivateBinClient;

const COPY_TO_CLIPBOARD = 'Copy to Clipboard';
const GO_TO_URL = 'Go to URL';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'send-to-privatebin.sendSelection',
    async () => {
      // The code you place here will be executed every time your command is executed
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No text selected")
        return; // No open text editor
      }
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      if (text) {
        sendTextToPrivateBin(text);
      } else {
        vscode.window.showInformationMessage("No text selected")
      }
    }
  );

  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand(
    'send-to-privatebin.sendDocument',
    async () => {
      // The code you place here will be executed every time your command is executed
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No document found")
        return; // No open text editor
      }
      const text = editor.document.getText();
      if (text) {
        sendTextToPrivateBin(text);
      } else {
        vscode.window.showInformationMessage("No document found")
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function sendTextToPrivateBin(text) {
  try {
    const configuration =
      vscode.workspace.getConfiguration('send-to-privatebin');
    let uploadFormat = 'syntaxhighlighting';
    if (vscode.window.activeTextEditor.document.languageId === 'markdown') {
      uploadFormat = 'markdown';
    }
    if (vscode.window.activeTextEditor.document.languageId === 'plaintext') {
      uploadFormat = 'plaintext';
    }
    const client = new PrivateBinClient(configuration.get('url'));
    const options = {
      expiry: configuration.get('expiration'),
      openDiscussion:
        configuration.get('open-discussion') &&
        !configuration.get('burn-after-reading')
          ? 1
          : 0,
      burnAfterReading: configuration.get('burn-after-reading') ? 1 : 0,
      uploadFormat,
    };
    var result = await client.uploadContent(text, options);
    if (!result.success) {
      throw new Error(
        `Error uploading: ${result.response.message || 'Unknown Error'}`
      );
    }
    var userInteraction = await vscode.window.showInformationMessage(
      `PrivateBin Created`,
      COPY_TO_CLIPBOARD,
      GO_TO_URL
    );
    const url = `${result.url}#${result.urlKey}`;
    if (userInteraction === COPY_TO_CLIPBOARD) {
      vscode.env.clipboard.writeText(url);
    }
    if (userInteraction === GO_TO_URL) {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error uploading to privatebin ${error.message}`
    );
  }
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
