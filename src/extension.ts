import * as vscode from "vscode";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import * as child from "child_process";

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
const usedVeribleBuild = (() => {
  if (extensionCfg.veribleBuild == "") return "";
  if (extensionCfg.veribleBuild == "none") return "";
  for (const build in veribleReleaseInfo["release_subdirs"]) {
    let buildStr = veribleReleaseInfo["release_subdirs"][build];
    if (buildStr.startsWith(extensionCfg.veribleBuild)) return buildStr;
  }
})();
const veribleBinPath = usedVeribleBuild
  ? join(
      extensionPath,
      "verible_release",
      usedVeribleBuild,
      "verible-" + veribleReleaseInfo["tag"],
      "bin"
    )
  : "";

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
  if (lines.length > 0)
    params.push(
      "--lines " +
        lines.map((range) => range.map((line) => line + 1).join("-")).join(",")
    );
  if (inPlace) params.push("--inplace");
  let runLocation = dirname(filePath);
  let command = [
    join(veribleBinPath, "verible-verilog-format"),
    ...params,
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
  vscode.languages.registerDocumentRangeFormattingEditProvider(
    "systemverilog",
    {
      provideDocumentRangeFormattingEdits(
        document: vscode.TextDocument,
        range: vscode.Range
      ): vscode.TextEdit[] {
        let filePath = document.uri.fsPath;
        let currentText = document.getText();
        let lines = [[range.start.line, range.end.line]];

        return [
          vscode.TextEdit.replace(
            textRange(document),
            format(filePath, currentText, lines)
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
