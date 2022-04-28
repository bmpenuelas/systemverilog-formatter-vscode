import * as vscode from "vscode";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import * as child from "child_process";
import { platform, version } from "os";

// Constants
const extensionName = "systemverilog-formatter-vscode";
const extensionID = "bmpenuelas." + extensionName;
const extensionPath = vscode.extensions.getExtension(extensionID)
  ?.extensionPath as string;
const verible_release_info_path = join(
  extensionPath,
  "verible_release_info.json"
);
const extensionCfg = vscode.workspace.getConfiguration(
  "systemverilogFormatter"
);
const veribleReleaseInfo = JSON.parse(
  readFileSync(verible_release_info_path).toString()
);
const veribleBinPath = (() => {
  let cfgVeribleBuild = extensionCfg.veribleBuild;
  if (cfgVeribleBuild === "none") {
    return "";
  }
  if (cfgVeribleBuild === "") {
    cfgVeribleBuild = platform().startsWith("win")
      ? "win64"
      : version().toLowerCase().includes("centos")
      ? "CentOS"
      : "Ubuntu";
  }
  for (const ii in veribleReleaseInfo["release_subdirs"]) {
    let buildSubdir = veribleReleaseInfo["release_subdirs"][ii];
    if (buildSubdir.startsWith(cfgVeribleBuild)) {
      for (const release in veribleReleaseInfo["release_binaries"]) {
        if (release.includes(buildSubdir)) {
          return join(
            extensionPath,
            veribleReleaseInfo["release_binaries"][release]
          );
        }
      }
    }
  }
})();
const additionalCommandLineArguments = extensionCfg.commandLineArguments;

// Get range of document
const textRange = (document: vscode.TextDocument) =>
  new vscode.Range(
    document.lineAt(0).range.start,
    document.lineAt(document.lineCount - 1).range.end
  );

// Format file
const format = (
  filePath: string,
  documentText: string,
  lines: Array<Array<number>> = [],
  inPlace: boolean = false
) => {
  let params = [];
  if (lines.length > 0) {
    params.push(
      "--lines " +
        lines.map((range) => range.map((line) => line + 1).join("-")).join(",")
    );
  }
  if (inPlace) {
    params.push("--inplace");
  }
  let runLocation = dirname(filePath);
  let command = [
    veribleBinPath,
    ...params,
    additionalCommandLineArguments,
    "-",
  ].join(" ");
  let output = child.execSync(command, {
    cwd: runLocation,
    input: documentText,
  });
  return output.toString();
};

// Extension is activated
export function activate(context: vscode.ExtensionContext) {
  vscode.languages.registerDocumentFormattingEditProvider(
    ["verilog", "systemverilog"],
    {
      provideDocumentFormattingEdits(
        document: vscode.TextDocument
      ): vscode.TextEdit[] {
        let filePath = document.uri.fsPath;
        let currentText = document.getText();

        return [
          vscode.TextEdit.replace(
            textRange(document),
            format(filePath, currentText)
          ),
        ];
      },
    }
  );

  // Command: formatDocument
  let formatDocument = vscode.commands.registerCommand(
    extensionName + ".formatDocument",
    () => {
      var editor = vscode.window.activeTextEditor;
      if (editor) {
        let document = editor.document as vscode.TextDocument;
        let filePath = document.uri.fsPath as string;
        let currentText = document.getText();
        format(filePath, currentText);
        editor.edit((editBuilder) =>
          editBuilder.replace(
            textRange(document),
            format(filePath, currentText)
          )
        );
      }
    }
  );
  context.subscriptions.push(formatDocument);

  // Command: formatSelection
  let formatSelection = vscode.commands.registerCommand(
    extensionName + ".formatSelection",
    () => {
      var editor = vscode.window.activeTextEditor;
      if (editor) {
        let document = editor.document as vscode.TextDocument;
        let currentText = document.getText();
        let filePath = document.uri.fsPath as string;
        let selection = editor.selection;
        if (selection && !selection.isEmpty) {
          let lines = [[selection.start.line, selection.end.line]];
          editor.edit((editBuilder) =>
            editBuilder.replace(
              textRange(document),
              format(filePath, currentText, lines)
            )
          );
        }
      }
    }
  );
  context.subscriptions.push(formatSelection);
}

// Extension is deactivated
export function deactivate() {}
