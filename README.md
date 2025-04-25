# SystemVerilog and Verilog Formatter for VSCode

### Beautify SystemVerilog and Verilog code in VSCode through [google/Verible](https://github.com/google/verible)

**NEW:** Now working in Windows, Ubuntu, CentOS and more!

**WARNING!** This extension will **only** work out of the box for the supported pre-built **OSs** detailed below. For other OSs you might need to build Verible yourself and have it in your PATH.

![](media/demo_0.gif)

### Installation

To install _SystemVerilog and Verilog Formatter_, search it in the Extensions tab inside VSCode, or [install it from the Marketplace](https://marketplace.visualstudio.com/items?itemName=bmpenuelas.systemverilog-formatter-vscode).

Alternatively, you can also clone this repository and build the sources yourself, then install it from VSIX.

### OS Support

Verible binaries are **released for most OSs and versions**. If your OS or distro is not listed below, you can give it a try with the one that is most similar to yours. Otherwise, you can build Verible for your OS and use that binary by selecting build "none".

- Windows 64bits
- MacOS
- Linux static arm64
- Linux static x86_64

The following builds are provided from an archived version because they are not included in the latest official builds. These are provided to make this formatter compatible with as many systems as possible, but note that support might be limited.

- CentOS-6.10-Final-x86_64
- CentOS-8.2.2004-Core-x86_64
- Ubuntu-14.04-trusty-x86_64
- Ubuntu-19.10-eoan-x86_64

➡️Select which binary you want to use by setting `systemverilogFormatter.veribleBuild` in the Settings dropdown or in your `settings.json` as:

```
{
  "systemverilogFormatter.veribleBuild": "Ubuntu-19.10-eoan-x86_64"
}
```

By default it will use `win64` in Windows systems, and `macOS` for Mac. In Linux systems it will try to find whether it's ARM (and use `linux-static-arm64`) or x86 (and use `linux-static-x86_64`).

You can use this extension with **any OS not listed above** but in that case **you need to provide your own build of Verible** and make it accessible in your PATH. Then select `"none"` in the _veribleBuild_ dropdown in Settings, or add this to your `settings.json`:

```
{
  "systemverilogFormatter.veribleBuild": "none"
}
```

### Commands

#### Native formatting:

This extension integrates with VSCode formatting, so you can use the built-in `Format Document`, format-on-save... and any linked functionality.

#### Format document

You can use the `SystemVerilog Formatter - Format this file` command from the command palette to apply formatting to the whole current document; or assign a Keyboard Shortcut to `systemverilog-formatter-vscode.formatDocument`

#### Format selection

You can select a portion of the file and use the `SystemVerilog Formatter - Format selection` command from the command palette to apply formatting to just that section of the document; or assign a Keyboard Shortcut to `systemverilog-formatter-vscode.formatSelection`

### Configuration

The behavior of the formatter can be customized with additional command-line arguments. You can find a complete list of the supported arguments [here](https://chipsalliance.github.io/verible/verilog_format.html).

Add the arguments that you desire to customize in `systemverilogFormatter.commandLineArguments`. By default no additional arguments are added and default values are used.

Example of custom values:

```
{
  "systemverilogFormatter.commandLineArguments": "--column_limit 80 --indentation_spaces 4"
}
```

### License

This extension is released under **MIT** license. The Verible binaries are fetched from [github.com/google/verible/releases](https://github.com/google/verible/releases), Verible being licensed under **Apache-2.0** license.
