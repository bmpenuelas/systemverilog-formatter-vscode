# systemverilog-formatter-vscode README

### SystemVerilog code formatting in VSCode through [google/Verible](https://github.com/google/verible)

### OS Support:

As of now, Verible binaries are **only available for Linux**:

- CentOS-8.1.1911-Core-x86_64
- Ubuntu-14.04-trusty-x86_64
- Ubuntu-16.04-xenial-x86_64
- Ubuntu-18.04-bionic-x86_64
- Ubuntu-19.10-eoan-x86_64

Select which binary you want to use by setting `systemverilogFormatter.veribleBuild` in the Settings dropdown or in your `settings.json` as:

```
{
  "systemverilogFormatter.veribleBuild": "Ubuntu-19.10-eoan-x86_64"
}
```

The beginning of the string is used to select the version, so `Ubuntu-19`, `Ubuntu-19.10`, `Ubuntu-19.10-eoan`... are all valid values that will select `Ubuntu-19.10-eoan-x86_64`. Default: `Ubuntu-19.10`

You can use this extension with **_Windows_, _Mac_... or any other OS** but in that case **you need to provide your own build of Verible** and make it accessible in your PATH. Then select `"none"` in the _veribleBuild_ dropdown in Settings, or add this to your `settings.json`:

```
{
  "systemverilogFormatter.veribleBuild": "none"
}
```

### Commands:

#### Native formatting:

This extension integrates with VSCode formatting, so you can use the built-in `Format Document`, format-on-save... and any linked functionality.

#### Format document

You can use the `SystemVerilog Formatter - Format this file` command from the command palette to apply formatting to the whole current document; or assign a Keyboard Shortcut to `systemverilog-formatter-vscode.formatDocument`

#### Format document

You can select a portion of the file and use the `SystemVerilog Formatter - Format selection` command from the command palette to apply formatting to just that section of the document; or assign a Keyboard Shortcut to `systemverilog-formatter-vscode.formatSelection`
