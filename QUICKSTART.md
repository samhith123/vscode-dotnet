# Quick Start Guide

## Prerequisites

1. Node.js (v16 or higher)
2. .NET SDK 6.0 or higher
3. Visual Studio Code

## Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Compile the Extension**
   ```bash
   npm run compile
   ```

3. **Open Extension Development Host**
   - Press `F5` in VS Code
   - This opens a new Extension Development Host window

4. **Test the Extension**
   - In the Extension Development Host window, open a folder containing a .NET project
   - The extension will automatically detect .NET projects
   - Use the Run/Debug buttons in the status bar or editor toolbar

## Development Workflow

### Watch Mode
Run the extension in watch mode to automatically recompile on changes:
```bash
npm run watch
```

Then press `F5` to launch the Extension Development Host.

### Testing with a .NET Project

1. Create a simple .NET console project:
   ```bash
   dotnet new console -n TestApp
   cd TestApp
   ```

2. Open the TestApp folder in the Extension Development Host window

3. Try the following:
   - Click the Run button in the status bar
   - Click the Debug button to start debugging
   - Add breakpoints and verify debugging works

### Testing with Unit Tests

1. Create a test project:
   ```bash
   dotnet new xunit -n TestApp.Tests
   cd TestApp.Tests
   dotnet add reference ../TestApp/TestApp.csproj
   ```

2. Install Coverlet for code coverage:
   ```bash
   dotnet add package coverlet.msbuild
   ```

3. In VS Code:
   - Use Command Palette: ".NET: Run All Tests"
   - Use Command Palette: ".NET: Run Tests with Coverage"

## Troubleshooting

### Extension Not Activating
- Check that .NET SDK is installed: `dotnet --version`
- Check the Output panel for ".NET Run & Debug" channel
- Verify workspace contains .NET project files (.csproj, .fsproj)

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript version compatibility
- Verify VS Code API version matches package.json

### Debug Not Starting
- Ensure project builds successfully first
- Check launch.json configuration
- Verify .NET debugger extension is installed (C# Dev Kit or C# extension)

### Tests Not Running
- Verify test project references a test framework (xUnit, NUnit, MSTest)
- Check that test project builds successfully
- Review output channel for detailed error messages

### Coverage Not Working
- Ensure Coverlet package is installed in test projects
- Verify `dotnet.coverage.enabled` is set to `true` in settings
- Check that coverage report files are generated in the project directory

## Next Steps

- Read the full README.md for detailed documentation
- Check package.json for all available commands
- Explore the source code in the `src/` directory

