# Visual Studio Tools for VS Code

[![Version](https://img.shields.io/visual-studio-marketplace/v/samhithgardas.vscode-dotnet?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=samhithgardas.vscode-dotnet) [![Installs](https://img.shields.io/visual-studio-marketplace/i/samhithgardas.vscode-dotnet?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=samhithgardas.vscode-dotnet)

Bring Visual Studio's powerful development experience to VS Code! This extension provides a Visual Studio-style toolbar, launch profiles, code coverage, comprehensive navigation, and seamless run/debug functionality for all .NET projects.

## Features

### Visual Studio-Style Toolbar

- **Status Bar Toolbar** with Build Configuration, Platform, Project, and Launch Profile selectors
- One-click **Run** and **Debug** buttons
- **Run Without Debugging** option
- Real-time project and configuration display

### Run and Debug

- One-click run and debug buttons in the status bar
- **Launch Profile Support** - Use `launchSettings.json` profiles with environment variables, URLs, and working directories
- Automatic project detection for all .NET project types
- Support for console, web, library, Blazor, MAUI, and Xamarin projects
- Customizable run arguments and debug configurations
- Build configuration selector (Debug/Release)
- Platform selector (Any CPU, x64, x86, ARM, etc.)

### Unit Testing

- Support for **xUnit, NUnit, MSTest**, and custom test frameworks
- Automatic test discovery across all test projects
- Run all tests or individual test projects
- Test results display with pass/fail status
- Works with any .NET framework version

### Code Coverage

- Integrated code coverage collection using **Coverlet**
- Visual coverage highlighting in the editor (green for covered, red for uncovered)
- Coverage percentage display in status bar
- Support for multiple coverage report formats: **Cobertura, LCOV, JSON, OpenCover**
- Automatic coverage collection when running tests

### Visual Studio-Like Navigation

- **Ctrl+Click** navigation to definitions, implementations, and references
- **Go to Definition** (F12 / Ctrl+F12)
- **Go to Implementation** (Ctrl+Shift+F12)
- **Find All References**
- **Peek Definition** and **Peek Implementation**
- Right-click context menu with navigation options
- Works for all symbol types: classes, methods, properties, variables, interfaces, enums, namespaces

## Universal .NET Framework Support

This extension works seamlessly with **all .NET frameworks**:

- **.NET Framework** (4.x, 4.5+, 4.6+, 4.7+, 4.8+)
- **.NET Core** (1.0, 2.0, 2.1, 2.2, 3.0, 3.1)
- **.NET 5+** (.NET 5, .NET 6, .NET 7, .NET 8, .NET 9+)
- **.NET Standard** (1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.0, 2.1)
- **ASP.NET Core** (all versions)
- **Blazor** (Server, WebAssembly)
- **Xamarin** projects
- **MAUI** (.NET Multi-platform App UI)
- **Any custom .NET project type**

## Supported .NET Project Types

- **Console Applications** - All .NET frameworks
- **Web Applications** - ASP.NET Core, ASP.NET MVC, Web API
- **Class Libraries** - .NET Framework, .NET Core, .NET Standard, .NET 5+
- **Test Projects** - xUnit, NUnit, MSTest
- **Blazor Applications** - Server and WebAssembly
- **MAUI Applications** - .NET Multi-platform App UI
- **Xamarin Projects** - iOS, Android, Forms
- **WPF Applications** - Windows Presentation Foundation
- **WinForms Applications** - Windows Forms
- **Worker Services** - Background services
- **Any custom .NET project type**

## Requirements

- Visual Studio Code 1.74.0 or higher
- **.NET SDK** installed and available in PATH
  - Supports .NET SDK 5.0+ (recommended: .NET SDK 6.0 or higher)
  - Works with any .NET SDK version that supports your target framework
- **C# extension** (ms-dotnettools.csharp) or **C# Dev Kit** (ms-dotnettools.csdevkit) for debugging support
  - The extension will prompt you to install it if missing when you try to debug

## Quick Start

1. **Running a Project**: Click the Run button (▶️) in the status bar
2. **Debugging**: Click the Debug button (🐛) in the status bar
3. **Running Tests**: Use Command Palette → ".NET: Run All Tests"
4. **Code Coverage**: Use Command Palette → ".NET: Run Tests with Coverage"

### Status Bar Toolbar

The extension provides a Visual Studio-style toolbar in the status bar with:

- Build Configuration selector
- Platform selector
- Project selector
- Launch Profile selector
- Run, Debug, and Run Without Debug buttons

For detailed usage instructions, see the [USAGE.md](https://github.com/samhith123/vscode-dotnet/blob/main/USAGE.md) guide.

## Configuration

The extension can be configured through VS Code settings:

- `dotnet.path`: Custom path to the .NET CLI executable
- `dotnet.testFramework`: Preferred test framework (auto, xunit, nunit, mstest)
- `dotnet.autoDetectProjects`: Enable/disable automatic project detection
- `dotnet.coverage.enabled`: Enable code coverage collection
- `dotnet.coverage.format`: Coverage report format (cobertura, lcov, json, opencover)
- `dotnet.runArguments`: Additional arguments for `dotnet run`
- `dotnet.debugConfig`: Custom debug configuration overrides
- `dotnet.enableCtrlClickNavigation`: Enable Visual Studio-like Ctrl+Click navigation
- `dotnet.ctrlClickBehavior`: Ctrl+Click behavior (gotoOrPeek, gotoDefinition, peekDefinition)

## Troubleshooting

### Debug Not Working

**Problem**: "configured debug type coreclr is not supported"

**Solutions**:

1. **Install C# Extension**:

   - Open Extensions (`Ctrl+Shift+X`)
   - Search for "C#" by Microsoft
   - Install `ms-dotnettools.csharp`
   - Reload VS Code

2. **Check Extension Status**:

   - Ensure C# extension is enabled
   - Check Output panel for diagnostic messages

3. **Reload Window**:
   - Press `Ctrl+Shift+P`
   - Type "Reload Window"
   - Select "Developer: Reload Window"

### Projects Not Detected

**Problem**: Projects not showing in status bar

**Solutions**:

1. **Check File Types**: Ensure `.csproj`, `.fsproj`, or `.sln` files exist
2. **Refresh Projects**: Use Command Palette → `.NET: Refresh Projects`
3. **Check Settings**: Verify `dotnet.autoDetectProjects` is enabled
4. **Check Output**: View Output panel for error messages

### Build Errors

**Problem**: Build fails when running/debugging

**Solutions**:

1. **Check Build Output**: Click "Show Output" in error notification
2. **Build Manually**: Run `dotnet build` in terminal to see errors
3. **Check .NET SDK**: Verify .NET SDK is installed and in PATH
4. **Check Project File**: Ensure project file is valid

### Tests Not Running

**Problem**: Tests don't execute or aren't found

**Solutions**:

1. **Check Test Framework**: Ensure test framework (xUnit, NUnit, MSTest) is installed
2. **Build Project**: Ensure test project builds successfully
3. **Check Output**: View Output panel for test discovery errors
4. **Manual Test**: Run `dotnet test` in terminal to verify tests work

### Coverage Not Showing

**Problem**: Code coverage not displayed

**Solutions**:

1. **Install Coverlet**: Add `coverlet.msbuild` package to test projects
2. **Enable Coverage**: Check `dotnet.coverage.enabled` setting
3. **Check Format**: Verify coverage format is supported
4. **Run with Coverage**: Use "Run Tests with Coverage" command

### Ctrl+Click Navigation Not Working

**Problem**: Ctrl+Click doesn't navigate to definitions

**Solutions**:

1. **Check C# Extension**: Ensure C# extension is installed and active
2. **Enable Navigation**: Check `dotnet.enableCtrlClickNavigation` setting
3. **Check Language Server**: Ensure C# language server is running
4. **Reload Window**: Reload VS Code window

## Known Limitations

- Solution file parsing is limited - individual project files are preferred
- Coverage visualization requires Coverlet to be installed in test projects
- Debug configuration auto-detection may need manual adjustment for some project types
- .NET Framework projects require .NET SDK 5.0+ for full feature support

## Contributing

Contributions are always welcome! Please see our [contributing guidelines](https://github.com/samhith123/vscode-dotnet/blob/main/CONTRIBUTING.md) for more details.

### Development

#### Building

```bash
npm run compile
```

#### Watching for Changes

```bash
npm run watch
```

#### Linting

```bash
npm run lint
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Samhith Gardas

## Questions and Feedback

**[Provide feedback](https://github.com/samhith123/vscode-dotnet/issues/new/choose)**

File questions, issues, or feature requests for the extension.

## Related Extensions

This extension works best with:

- **[C# Extension](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp)** - Required for debugging support
- **[C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit)** - Enhanced C# development experience
- **[.NET Install Tool](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.vscode-dotnet-runtime)** - Automatic .NET SDK installation

## Release Notes

### 0.1.2

- Enhanced framework detection for multi-targeting projects
- Improved support for .NET Framework and .NET Standard projects
- Updated marketplace description and keywords

### 0.1.1

- Added Visual Studio-like navigation (Ctrl+Click, Go to Implementation)
- Enhanced framework support documentation
- Added comprehensive keywords for marketplace discoverability

### 0.1.0

Initial release with:

- Run and debug functionality
- Test discovery and execution
- Code coverage integration
- Status bar toolbar integration
- Launch profile support
