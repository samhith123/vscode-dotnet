# .NET Run & Debug Extension for VS Code

A Visual Studio Code extension that provides Visual Studio-like functionality for running, debugging, and testing .NET projects with integrated code coverage.

## Features

### Run and Debug
- One-click run and debug buttons in the editor toolbar and status bar
- Automatic project detection
- Support for console, web, and library projects
- Customizable run arguments and debug configurations

### Unit Testing
- Support for xUnit, NUnit, MSTest, and custom test frameworks
- Automatic test discovery
- Run all tests or individual test projects
- Test results display with pass/fail status

### Code Coverage
- Integrated code coverage collection using Coverlet
- Visual coverage highlighting in the editor
- Coverage percentage display in status bar
- Support for multiple coverage report formats (Cobertura, LCOV, JSON, OpenCover)

## Requirements

- Visual Studio Code 1.74.0 or higher
- .NET SDK 6.0 or higher installed and available in PATH
- **C# extension** (ms-dotnettools.csharp) or **C# Dev Kit** (ms-dotnettools.csdevkit) for debugging support
  - The extension will prompt you to install it if missing when you try to debug

## Installation

1. Clone or download this repository
2. Open the project in VS Code
3. Run `npm install` to install dependencies
4. Press `F5` to open a new Extension Development Host window
5. In the new window, open a .NET project workspace

## Usage

For detailed usage instructions, see the [USAGE.md](https://github.com/samhith123/vscode-dotnet/blob/main/USAGE.md) guide.

### Quick Start

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

See [USAGE.md](https://github.com/samhith123/vscode-dotnet/blob/main/USAGE.md) for complete documentation.

## Configuration

The extension can be configured through VS Code settings:

- `dotnet.path`: Custom path to the .NET CLI executable
- `dotnet.testFramework`: Preferred test framework (auto, xunit, nunit, mstest)
- `dotnet.autoDetectProjects`: Enable/disable automatic project detection
- `dotnet.coverage.enabled`: Enable code coverage collection
- `dotnet.coverage.format`: Coverage report format (cobertura, lcov, json, opencover)
- `dotnet.runArguments`: Additional arguments for `dotnet run`
- `dotnet.debugConfig`: Custom debug configuration overrides

## Project Structure

```
vscode-dotnet/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── projectDetector.ts        # Project detection logic
│   ├── runDebugManager.ts        # Run/debug functionality
│   ├── testRunner.ts             # Test execution and discovery
│   ├── coverageProvider.ts       # Code coverage integration
│   ├── ui/
│   │   └── statusBar.ts          # Status bar buttons
│   └── utils/
│       ├── dotnetCli.ts          # .NET CLI wrapper
│       └── configManager.ts      # Configuration management
├── package.json                   # Extension manifest
└── tsconfig.json                  # TypeScript configuration
```

## Development

### Building

```bash
npm run compile
```

### Watching for Changes

```bash
npm run watch
```

### Linting

```bash
npm run lint
```

## Known Limitations

- Solution file parsing is limited - individual project files are preferred
- Coverage visualization requires Coverlet to be installed in test projects
- Debug configuration auto-detection may need manual adjustment for some project types

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2024 Samhith Gardas

## Release Notes

### 0.1.0

Initial release with:
- Run and debug functionality
- Test discovery and execution
- Code coverage integration
- Status bar and editor toolbar integration

