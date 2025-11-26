# .NET Run & Debug Extension - Usage Guide

This guide provides detailed instructions on how to use the .NET Run & Debug extension for Visual Studio Code.

## Table of Contents

- [Getting Started](#getting-started)
- [Status Bar Toolbar](#status-bar-toolbar)
- [Running Projects](#running-projects)
- [Debugging Projects](#debugging-projects)
- [Working with Launch Profiles](#working-with-launch-profiles)
- [Running Tests](#running-tests)
- [Code Coverage](#code-coverage)
- [Project Management](#project-management)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

1. **Visual Studio Code** 1.74.0 or higher
2. **.NET SDK** 6.0 or higher installed and available in PATH
3. **C# Extension** (ms-dotnettools.csharp) or **C# Dev Kit** (ms-dotnettools.csdevkit) for debugging support

### Installation

1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X`)
3. Search for ".NET Run & Debug"
4. Click Install
5. Reload VS Code if prompted

### First Time Setup

1. Open a workspace containing .NET projects (`.csproj`, `.fsproj`, or `.sln` files)
2. The extension will automatically detect projects
3. If you have multiple projects, select the active project from the status bar

## Status Bar Toolbar

The extension provides a Visual Studio-style toolbar in the status bar (bottom of VS Code) with the following controls:

### Toolbar Items (Left to Right)

1. **Build Configuration** - Select Debug or Release
2. **Platform** - Select target platform (Any CPU, x64, x86, etc.)
3. **Project** - Select the active .NET project
4. **Launch Profile** - Select a launch profile from `launchSettings.json`
5. **Run** (▶️) - Run the project without debugging
6. **Debug** (🐛) - Start debugging the project
7. **Run Without Debug** - Run the project without attaching debugger

### Using the Toolbar

- **Click any item** to open a selection menu
- **Current selections** are displayed in the toolbar
- **Toolbar updates automatically** when you change selections

## Running Projects

### Quick Start

1. Ensure a project is selected in the status bar
2. Click the **Run** button (▶️) in the status bar
3. The project will build and run in the integrated terminal

### Using Command Palette

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Run Project" or select `.NET: Run Project`
3. Press Enter

### Running with Launch Profile

1. Click **Launch Profile** in the status bar
2. Select a profile from the list
3. Click **Run** button
4. The project runs with the profile's settings (environment variables, URLs, working directory, etc.)

### Running Without Debugging

1. Click **Run Without Debug** in the status bar
2. Or use Command Palette: `.NET: Start Without Debugging`
3. The project runs without attaching the debugger (faster startup)

## Debugging Projects

### Prerequisites for Debugging

- **C# Extension Required**: The extension requires the C# extension (ms-dotnettools.csharp) for debugging
- If missing, the extension will prompt you to install it when you try to debug

### Starting a Debug Session

1. **Set Breakpoints**: Click in the gutter (left of line numbers) to set breakpoints
2. **Select Project**: Ensure the correct project is selected in the status bar
3. **Select Launch Profile** (optional): Choose a launch profile if needed
4. **Click Debug Button**: Click the 🐛 icon in the status bar
5. **Debug Session Starts**: The debugger attaches and execution pauses at breakpoints

### Debug Controls

Once debugging starts, use VS Code's standard debug controls:

- **Continue** (`F5`) - Continue execution
- **Step Over** (`F10`) - Execute current line
- **Step Into** (`F11`) - Step into function calls
- **Step Out** (`Shift+F11`) - Step out of current function
- **Restart** (`Ctrl+Shift+F5`) - Restart debug session
- **Stop** (`Shift+F5`) - Stop debugging

### Debug Configuration

The extension automatically creates debug configurations based on:

- Project type (console, web, library)
- Selected launch profile
- Build configuration (Debug/Release)

You can customize debug settings in VS Code settings:

```json
{
  "dotnet.debugConfig": {
    "justMyCode": false,
    "enableStepFiltering": true
  }
}
```

## Working with Launch Profiles

Launch profiles are defined in `Properties/launchSettings.json` and allow you to run projects with different configurations.

### Creating Launch Profiles

1. Create `Properties/launchSettings.json` in your project root
2. Define profiles:

```json
{
  "$schema": "https://json.schemastore.org/launchsettings.json",
  "profiles": {
    "Development": {
      "commandName": "Project",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
    "Production": {
      "commandName": "Project",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Production"
      }
    }
  }
}
```

### Using Launch Profiles

1. **Select Profile**: Click **Launch Profile** in the status bar
2. **View Details**: The selection menu shows profile details (URL, env vars, working directory)
3. **Run/Debug**: Use Run or Debug buttons - the profile settings are automatically applied

### Profile Features

Launch profiles support:

- **Environment Variables** - Automatically set when running
- **Working Directory** - Custom working directory
- **Command Line Arguments** - Additional arguments
- **Application URLs** - For web projects

## Running Tests

### Running All Tests

1. **Via Status Bar**: Click the **Tests** button in the status bar
2. **Via Command Palette**:
   - Press `Ctrl+Shift+P`
   - Type "Run All Tests"
   - Select `.NET: Run All Tests`

### Running Tests with Coverage

1. **Via Command Palette**:

   - Press `Ctrl+Shift+P`
   - Type "Run Tests with Coverage"
   - Select `.NET: Run Tests with Coverage`

2. Coverage will be collected and displayed in the editor

### Test Frameworks Supported

- **xUnit** - Automatic detection
- **NUnit** - Automatic detection
- **MSTest** - Automatic detection
- **Custom Frameworks** - Configure via settings

### Viewing Test Results

- Test results appear in the **Output** panel
- Select ".NET Run & Debug" from the output dropdown
- Results show:
  - Total tests run
  - Passed/Failed counts
  - Individual test status
  - Error messages for failed tests

## Code Coverage

### Enabling Code Coverage

1. **Install Coverlet** in your test projects:

   ```bash
   dotnet add package coverlet.msbuild
   ```

2. **Enable Coverage** in settings:
   ```json
   {
     "dotnet.coverage.enabled": true
   }
   ```

### Running Coverage

1. Run tests with coverage (see [Running Tests](#running-tests))
2. Coverage data is collected automatically
3. Results are displayed in:
   - **Status Bar** - Overall coverage percentage
   - **Editor** - Line-by-line highlighting

### Coverage Visualization

- **Green highlighting** - Covered lines
- **Red highlighting** - Uncovered lines
- **Coverage percentage** - Shown in status bar

### Coverage Formats

Supported formats (configure in settings):

- **Cobertura** (default) - XML format
- **LCOV** - Text format
- **JSON** - JSON format
- **OpenCover** - XML format

## Project Management

### Automatic Project Detection

The extension automatically detects:

- `.csproj` files (C# projects)
- `.fsproj` files (F# projects)
- `.sln` files (solution files)

### Selecting a Project

1. **Via Status Bar**: Click the project name in the status bar
2. **Via Command Palette**:
   - Press `Ctrl+Shift+P`
   - Type "Select .NET Project"
   - Select `.NET: Select .NET Project`

### Refreshing Projects

If you add or remove projects:

1. **Via Command Palette**:

   - Press `Ctrl+Shift+P`
   - Type "Refresh Projects"
   - Select `.NET: Refresh Projects`

2. Projects are automatically refreshed when:
   - Project files are added/removed
   - Solution files change
   - Workspace folders change

### Multiple Projects

When working with multiple projects:

- **Select active project** from the status bar
- **Run/Debug** applies to the selected project
- **Tests** run for all test projects in the workspace

## Configuration

### Extension Settings

Open VS Code settings (`Ctrl+,`) and search for "dotnet":

#### Basic Settings

- **dotnet.path** - Custom path to .NET CLI (leave empty for system PATH)
- **dotnet.autoDetectProjects** - Enable automatic project detection (default: true)

#### Test Settings

- **dotnet.testFramework** - Preferred test framework:
  - `auto` - Auto-detect (default)
  - `xunit` - Force xUnit
  - `nunit` - Force NUnit
  - `mstest` - Force MSTest

#### Coverage Settings

- **dotnet.coverage.enabled** - Enable code coverage (default: true)
- **dotnet.coverage.format** - Coverage format:
  - `cobertura` (default)
  - `lcov`
  - `json`
  - `opencover`

#### Run Settings

- **dotnet.runArguments** - Additional arguments for `dotnet run`
  - Example: `--no-build --no-restore`

#### Debug Settings

- **dotnet.debugConfig** - Custom debug configuration overrides
  ```json
  {
    "dotnet.debugConfig": {
      "justMyCode": false,
      "enableStepFiltering": true
    }
  }
  ```

### Settings File Location

Settings can be configured in:

- **User Settings** - Apply to all workspaces
- **Workspace Settings** - Apply to current workspace only

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

### Launch Profile Not Working

**Problem**: Launch profile settings not applied

**Solutions**:

1. **Check File Location**: Ensure `Properties/launchSettings.json` exists
2. **Check JSON Syntax**: Validate JSON syntax
3. **Check Profile Name**: Ensure profile name matches selection
4. **Check Project Type**: Some profile settings only work for web projects

### Status Bar Not Showing

**Problem**: Toolbar items not visible in status bar

**Solutions**:

1. **Open .NET File**: Open a `.cs` or `.fs` file to activate extension
2. **Check Workspace**: Ensure workspace contains .NET projects
3. **Reload Window**: Reload VS Code window
4. **Check Extension**: Verify extension is installed and enabled

## Keyboard Shortcuts

While the extension doesn't define custom keyboard shortcuts, you can add them:

1. Open Keyboard Shortcuts (`Ctrl+K Ctrl+S`)
2. Search for extension commands:

   - `dotnet.run`
   - `dotnet.debug`
   - `dotnet.runTests`
   - `dotnet.selectProject`

3. Add your preferred shortcuts

## Additional Resources

- **GitHub Repository**: [Link to your repository]
- **Issues**: Report bugs or request features
- **VS Code Marketplace**: [Extension page link]

## Support

For issues, questions, or feature requests:

1. Check this guide first
2. Review the Output panel for error messages
3. Check GitHub issues
4. Create a new issue with details

---

**Last Updated**: 2024
