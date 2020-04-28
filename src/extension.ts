// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { readFileSync } from "fs";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let rawFile = readFileSync("./verible_release_info.json");
  let releaseInfo = JSON.parse(rawFile.toString());

  vscode.languages.registerDocumentFormattingEditProvider("systemverilog", {
    provideDocumentFormattingEdits(
      document: vscode.TextDocument
    ): vscode.TextEdit[] {
      let filePath = document.uri.path;
      console.log(releaseInfo);
      console.log(filePath);
      vscode.window.showInformationMessage("FORMAT");
      return [];
    },
  });

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "systemverilog-formatter-vscode.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from SystemVerilog!");
    }
  );

  context.subscriptions.push(disposable);

  console.log("SVF ACTIVE");
}

// this method is called when your extension is deactivated
export function deactivate() {}
