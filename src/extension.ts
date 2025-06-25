import * as vscode from "vscode";
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync } from "fs";
import { join, dirname } from "path";
import { spawnSync, SpawnSyncOptionsWithStringEncoding } from "child_process";
import { platform, arch, tmpdir } from "os";
import { randomUUID } from "crypto";

// Constants
const extensionName = "systemverilog-formatter-vscode";
const extensionID = "bmpenuelas." + extensionName;
const extensionPath = vscode.extensions.getExtension(extensionID)
  ?.extensionPath as string;
const verible_release_info_path = join(
  extensionPath,
  "verible_release_info.json"
);

const getExtensionCfg = (param: string) => {
  const extensionCfg = vscode.workspace.getConfiguration(
    "systemverilogFormatter"
  );
  if (!param) {
    return extensionCfg;
  } else {
    return extensionCfg[param];
  }
};

const veribleReleaseInfo = JSON.parse(
  readFileSync(verible_release_info_path).toString()
);
function getUserPreferredTerminalExecutable(): string | undefined {
  // Get the current operating system
  const isWindows = process.platform === "win32";
  const isMacOS = process.platform === "darwin";
  const isLinux = process.platform === "linux";

  // Get the integrated terminal configuration
  const config = vscode.workspace.getConfiguration("terminal.integrated");

  // Get the configured terminal executable based on the operating system
  let terminalExecutable: string | undefined;
  if (isWindows) {
    terminalExecutable = config.get<string>("shell.windows");
  } else if (isMacOS) {
    terminalExecutable = config.get<string>("shell.osx");
  } else if (isLinux) {
    terminalExecutable = config.get<string>("shell.linux");
  }
  return terminalExecutable;
}
const getVeribleBinPath = () => {
  let cfgVeribleBuild = getExtensionCfg("veribleBuild");
  if (cfgVeribleBuild === "none") {
    return "verible-verilog-format";
  }

  // Auto-detect platform if not manually specified
  if (cfgVeribleBuild === "") {
    const osPlatform = platform().toLowerCase();
    const osArch = arch();

    if (osPlatform.startsWith("win")) {
      cfgVeribleBuild = "win64";
    } else if (osPlatform === "darwin") {
      cfgVeribleBuild = "macOS";
    } else if (osPlatform === "linux") {
      if (osArch === "arm64") {
        cfgVeribleBuild = "linux-static-arm64";
      } else {
        cfgVeribleBuild = "linux-static-x86_64";
      }
    }
  }

  for (const buildSubdir of veribleReleaseInfo["release_subdirs"]) {
    if (buildSubdir.startsWith(cfgVeribleBuild)) {
      for (const release in veribleReleaseInfo["release_binaries"]) {
        if (release.includes(buildSubdir)) {
          // Return quoted path to binary inside extension path, in case the path contains spaces
          return (
            '"' +
            join(
              extensionPath,
              veribleReleaseInfo["release_binaries"][release]
            ) +
            '"'
          );
        }
      }
    }
  }

  // Fallback to find in PATH if no match found
  return "verible-verilog-format";
};

// Channel to show logs
const outputChannel = vscode.window.createOutputChannel(
  "SystemVerilog Formatter"
);
const logMessage = (message: string) => {
  outputChannel.appendLine(message);
  outputChannel.show(true);
};
const getCurrentDateTimeString = () => {
  const now = new Date();
  const pad = (num: number) => num.toString().padStart(2, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return `${year} ${month} ${day} - ${hours}:${minutes}:${seconds}`;
};

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
  lines: Array<Array<number>> = []
): string => {
  const tmpFolder = mkdtempSync(join(tmpdir(), "verible-"));
  const tmpFilePath = join(tmpFolder, `tmp-${randomUUID()}.sv`);

  writeFileSync(tmpFilePath, documentText, { encoding: "utf-8" });

  let params = [`--inplace`];
  if (lines.length > 0) {
    params.push(
      "--lines " +
        lines.map((range) => range.map((line) => line + 1).join("-")).join(",")
    );
  }
  let runLocation = dirname(filePath);
  let command = [
    getVeribleBinPath(),
    ...params,
    getExtensionCfg("commandLineArguments"),
    `"${tmpFilePath}"`,
  ].join(" ");

  const spawnOptions: SpawnSyncOptionsWithStringEncoding = {
    encoding: "utf-8",
    cwd: runLocation,
    shell: true,
  };

  const terminalExecutable = getUserPreferredTerminalExecutable();
  if (terminalExecutable) {
    spawnOptions.shell = terminalExecutable;
  }

  try {
    const result = spawnSync(command, spawnOptions);

    if (result.stderr) {
      vscode.window.showErrorMessage(
        "Syntax error: " + result.stderr.toString().replace(/<stdin>:/g, "")
      );
      logMessage(
        getCurrentDateTimeString() + "   ---------------------------------"
      );
      logMessage("Syntax error:");
      logMessage(result.stderr.toString().replace(/<stdin>:/g, ""));
      logMessage("---------------------------------------------------------\n");
      return documentText;
    } else {
      const formatted = readFileSync(tmpFilePath, { encoding: "utf-8" });
      unlinkSync(tmpFilePath); // Clean up
      return formatted;
    }
  } catch (err) {
    vscode.window.showInformationMessage(
      "Failed to run the formatter, please check and update the setting systemverilogFormatter.veribleBuild"
    );
    console.error("Formatting failed:", (err as any).message || err);
    throw new Error(
      `Failed to format the file. Please check and update the setting systemverilogFormatter.veribleBuild.\n\nError details:\n${
        (err as any).message || err
      }`
    );
  }
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
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        let document = editor.document as vscode.TextDocument;
        let filePath = document.uri.fsPath as string;
        let currentText = document.getText();
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
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        let document = editor.document as vscode.TextDocument;
        let currentText = document.getText();
        let filePath = document.uri.fsPath as string;
        let { selection } = editor;
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
