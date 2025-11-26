import * as vscode from "vscode";
import { ProjectDetector } from "./projectDetector";
import { DotNetCli } from "./utils/dotnetCli";
import { LaunchProfileManager } from "./utils/launchProfileManager";

export class RunDebugManager {
  private buildConfig: "Debug" | "Release" = "Debug";
  private platform: "Any CPU" | "x86" | "x64" = "Any CPU";

  constructor(
    private projectDetector: ProjectDetector,
    private dotnetCli: DotNetCli,
    private outputChannel: vscode.OutputChannel
  ) {}

  setBuildConfig(config: "Debug" | "Release"): void {
    this.buildConfig = config;
  }

  setPlatform(platform: "Any CPU" | "x86" | "x64"): void {
    this.platform = platform;
  }

  async runProject(): Promise<void> {
    const project = this.projectDetector.getCurrentProject();
    if (!project) {
      const selected = await this.selectProjectIfNeeded();
      if (!selected) {
        return;
      }
    }

    const targetProject = project || this.projectDetector.getCurrentProject();
    if (!targetProject) {
      vscode.window.showErrorMessage("No .NET project selected");
      return;
    }

    if (targetProject.type === "library") {
      const executableProjects = this.projectDetector
        .getProjects()
        .filter((p) => p.type === "console" || p.type === "web");

      if (executableProjects.length === 0) {
        vscode.window.showWarningMessage(
          "Cannot run a library project. No executable projects found in workspace. Please create a console or web project."
        );
        return;
      }

      const action = await vscode.window.showWarningMessage(
        `Cannot run a library project (${targetProject.name}). Select an executable project?`,
        "Select Project",
        "Cancel"
      );

      if (action === "Select Project") {
        const selected = await this.selectExecutableProject(executableProjects);
        if (selected) {
          // Recursively call runProject with the new selection
          await this.runProject();
        }
      }
      return;
    }

    try {
      this.outputChannel.show(true);
      this.outputChannel.appendLine(
        `Running project: ${targetProject.name} (${this.buildConfig}, ${this.platform})`
      );

      // Build first with configuration and platform
      const buildResult = await this.dotnetCli.buildProject(
        targetProject.path,
        this.buildConfig,
        this.platform
      );
      if (!buildResult.success) {
        const errorMsg = buildResult.error || "Build failed";
        // Show output channel and error message
        this.outputChannel.show(true);

        // Extract key error lines for notification (first few lines)
        const errorLines = errorMsg
          .split("\n")
          .filter((line) => line.trim().length > 0);
        const shortError =
          errorLines.length > 0 ? errorLines.slice(0, 3).join(" | ") : errorMsg;

        vscode.window
          .showErrorMessage(
            `Build failed: ${shortError}. Check output panel for full details.`,
            "Show Output"
          )
          .then((selection) => {
            if (selection === "Show Output") {
              this.outputChannel.show(true);
            }
          });
        return;
      }

      // Select launch profile if available
      let profileName: string | null | undefined = undefined;
      const profiles = await LaunchProfileManager.getProfiles(
        targetProject.path
      );

      if (profiles.length > 0) {
        if (profiles.length === 1) {
          // Auto-select if only one profile
          profileName = profiles[0];
          this.outputChannel.appendLine(`Using launch profile: ${profileName}`);
        } else {
          // Let user select if multiple profiles
          profileName = await LaunchProfileManager.selectProfile(
            targetProject.path,
            this.outputChannel
          );
          if (profileName) {
            this.outputChannel.appendLine(
              `Using launch profile: ${profileName}`
            );
          }
        }
      }

      // Run the project with selected profile
      await this.dotnetCli.runProject(targetProject.path, profileName);
    } catch (error: any) {
      const errorMessage =
        error.stderr || error.message || "Failed to run project";
      vscode.window.showErrorMessage(`Error running project: ${errorMessage}`);
      this.outputChannel.appendLine(`Error: ${errorMessage}`);
      this.outputChannel.show(true);
    }
  }

  async debugProject(): Promise<void> {
    const project = this.projectDetector.getCurrentProject();
    if (!project) {
      const selected = await this.selectProjectIfNeeded();
      if (!selected) {
        return;
      }
    }

    const targetProject = project || this.projectDetector.getCurrentProject();
    if (!targetProject) {
      vscode.window.showErrorMessage("No .NET project selected");
      return;
    }

    if (targetProject.type === "library") {
      const executableProjects = this.projectDetector
        .getProjects()
        .filter((p) => p.type === "console" || p.type === "web");

      if (executableProjects.length === 0) {
        vscode.window.showWarningMessage(
          "Cannot debug a library project. No executable projects found in workspace. Please create a console or web project."
        );
        return;
      }

      const action = await vscode.window.showWarningMessage(
        `Cannot debug a library project (${targetProject.name}). Select an executable project?`,
        "Select Project",
        "Cancel"
      );

      if (action === "Select Project") {
        const selected = await this.selectExecutableProject(executableProjects);
        if (selected) {
          // Recursively call debugProject with the new selection
          await this.debugProject();
        }
      }
      return;
    }

    try {
      // Build first with configuration and platform
      const buildResult = await this.dotnetCli.buildProject(
        targetProject.path,
        this.buildConfig,
        this.platform
      );
      if (!buildResult.success) {
        const errorMsg = buildResult.error || "Build failed";
        // Show output channel and error message
        this.outputChannel.show(true);

        // Extract key error lines for notification (first few lines)
        const errorLines = errorMsg
          .split("\n")
          .filter((line) => line.trim().length > 0);
        const shortError =
          errorLines.length > 0 ? errorLines.slice(0, 3).join(" | ") : errorMsg;

        vscode.window
          .showErrorMessage(
            `Build failed: ${shortError}. Check output panel for full details.`,
            "Show Output"
          )
          .then((selection) => {
            if (selection === "Show Output") {
              this.outputChannel.show(true);
            }
          });
        return;
      }

      // Select launch profile if available
      let profileName: string | null | undefined = undefined;
      const profiles = await LaunchProfileManager.getProfiles(
        targetProject.path
      );

      if (profiles.length > 0) {
        if (profiles.length === 1) {
          // Auto-select if only one profile
          profileName = profiles[0];
          this.outputChannel.appendLine(`Using launch profile: ${profileName}`);
        } else {
          // Let user select if multiple profiles
          profileName = await LaunchProfileManager.selectProfile(
            targetProject.path,
            this.outputChannel
          );
          if (profileName) {
            this.outputChannel.appendLine(
              `Using launch profile: ${profileName}`
            );
          }
        }
      }

      // Check if C# extension is installed (provides coreclr debugger)
      // Check for modern C# extension first, then C# Dev Kit, then legacy extension
      let csharpExtension =
        vscode.extensions.getExtension("ms-dotnettools.csharp") ||
        vscode.extensions.getExtension("ms-dotnettools.csdevkit") ||
        vscode.extensions.getExtension("vscode.csharp");

      // Log extension status for debugging
      if (csharpExtension) {
        this.outputChannel.appendLine(
          `C# extension found: ${csharpExtension.id}, active: ${csharpExtension.isActive}`
        );

        // Warn if using legacy extension - it may not provide coreclr debugger
        if (csharpExtension.id === "vscode.csharp") {
          const action = await vscode.window.showWarningMessage(
            "The legacy C# extension (vscode.csharp) may not provide the coreclr debugger. Please install the modern C# extension (ms-dotnettools.csharp) for debugging support.",
            "Install Modern C# Extension",
            "Try Anyway",
            "Cancel"
          );

          if (action === "Install Modern C# Extension") {
            try {
              await vscode.commands.executeCommand(
                "workbench.extensions.installExtension",
                "ms-dotnettools.csharp"
              );
              vscode.window.showInformationMessage(
                "C# extension installation started. Please reload VS Code after installation completes."
              );
            } catch (error: any) {
              const errorMsg = error.message || String(error);
              this.outputChannel.appendLine(
                `Failed to install C# extension: ${errorMsg}`
              );
              vscode.window.showErrorMessage(
                `Failed to install C# extension: ${errorMsg}`
              );
            }
            return;
          } else if (action === "Cancel") {
            return;
          }
          // If "Try Anyway", continue but log the warning
          this.outputChannel.appendLine(
            "Warning: Using legacy C# extension. Debugging may not work."
          );
        }
      } else {
        this.outputChannel.appendLine(
          "C# extension not found. Checking available extensions..."
        );
        const allExtensions = vscode.extensions.all;
        const csharpRelated = allExtensions.filter(
          (ext) =>
            ext.id.includes("csharp") ||
            ext.id.includes("dotnet") ||
            ext.id.includes("csdevkit")
        );
        if (csharpRelated.length > 0) {
          this.outputChannel.appendLine(
            `Found related extensions: ${csharpRelated
              .map(
                (e) => `${e.id} (${e.packageJSON?.displayName || "unknown"})`
              )
              .join(", ")}`
          );

          // Check if any of these might be the C# extension but with wrong ID
          const possibleCSharp = csharpRelated.find(
            (ext) =>
              ext.packageJSON?.publisher === "ms-dotnettools" ||
              ext.packageJSON?.displayName?.toLowerCase().includes("c#")
          );
          if (possibleCSharp) {
            this.outputChannel.appendLine(
              `Possible C# extension found: ${possibleCSharp.id}. Please ensure the official Microsoft C# extension (ms-dotnettools.csharp) is installed.`
            );
          }
        }
      }

      if (!csharpExtension) {
        // Check if there's a related extension that might be the issue
        const allExtensions = vscode.extensions.all;
        const csharpRelated = allExtensions.filter(
          (ext) =>
            (ext.id.includes("csharp") ||
              ext.id.includes("dotnet") ||
              ext.id.includes("csdevkit")) &&
            ext.id !== "undefined_publisher.vscode-dotnet" // Exclude our own extension
        );

        let message =
          "C# extension is required for debugging .NET projects. The coreclr debugger is provided by the C# extension (ms-dotnettools.csharp) or C# Dev Kit (ms-dotnettools.csdevkit).";

        if (csharpRelated.length > 0) {
          const foundIds = csharpRelated.map((e) => e.id).join(", ");
          message += `\n\nFound related extensions: ${foundIds}\nPlease install the official Microsoft C# extension (ms-dotnettools.csharp).`;
        }

        const action = await vscode.window.showWarningMessage(
          message,
          "Install C# Extension",
          "Open Extensions",
          "Cancel"
        );

        if (action === "Install C# Extension") {
          try {
            await vscode.commands.executeCommand(
              "workbench.extensions.installExtension",
              "ms-dotnettools.csharp"
            );
            vscode.window.showInformationMessage(
              "C# extension installation started. Please reload VS Code after installation completes."
            );
          } catch (error: any) {
            const errorMsg = error.message || String(error);
            this.outputChannel.appendLine(
              `Failed to install C# extension: ${errorMsg}`
            );
            vscode.window.showErrorMessage(
              `Failed to install C# extension: ${errorMsg}`
            );
          }
        } else if (action === "Open Extensions") {
          await vscode.commands.executeCommand("workbench.view.extensions");
          await vscode.commands.executeCommand(
            "workbench.extensions.action.showExtensionsWithQuery",
            "@id:ms-dotnettools.csharp"
          );
        }
        return;
      }

      // Check if extension is disabled
      if (
        csharpExtension.packageJSON &&
        csharpExtension.packageJSON.enabled === false
      ) {
        const action = await vscode.window.showWarningMessage(
          "C# extension is installed but disabled. Please enable it to debug .NET projects.",
          "Enable Extension",
          "Open Extensions",
          "Cancel"
        );

        if (action === "Enable Extension") {
          await vscode.commands.executeCommand(
            "workbench.extensions.action.enable",
            csharpExtension.id
          );
          vscode.window.showInformationMessage(
            "Please reload VS Code after enabling the extension."
          );
        } else if (action === "Open Extensions") {
          await vscode.commands.executeCommand("workbench.view.extensions");
          await vscode.commands.executeCommand(
            "workbench.extensions.action.showExtensionsWithQuery",
            `@id:${csharpExtension.id}`
          );
        }
        return;
      }

      // If extension is installed but not active, try to activate it
      if (!csharpExtension.isActive) {
        this.outputChannel.appendLine(
          "C# extension is installed but not active. Activating..."
        );
        try {
          await csharpExtension.activate();
          // Wait longer for activation to complete and debugger to register
          this.outputChannel.appendLine(
            "Waiting for C# extension to fully initialize..."
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          this.outputChannel.appendLine("C# extension activated successfully");
        } catch (error: any) {
          const errorMsg = error.message || String(error);
          this.outputChannel.appendLine(
            `Failed to activate C# extension: ${errorMsg}`
          );
          const action = await vscode.window.showWarningMessage(
            "C# extension is installed but could not be activated. Please ensure it is enabled and try again, or reload VS Code.",
            "Reload Window",
            "Open Extensions",
            "Cancel"
          );

          if (action === "Reload Window") {
            await vscode.commands.executeCommand(
              "workbench.action.reloadWindow"
            );
          } else if (action === "Open Extensions") {
            await vscode.commands.executeCommand("workbench.view.extensions");
            await vscode.commands.executeCommand(
              "workbench.extensions.action.showExtensionsWithQuery",
              `@id:${csharpExtension.id}`
            );
          }
          return;
        }
      } else {
        // Even if active, wait a moment to ensure debugger is registered
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Wait a bit more to ensure the C# extension's debugger is fully registered
      // The C# extension needs time to register the 'coreclr' debug type after activation
      this.outputChannel.appendLine(
        "Waiting for C# extension debugger to register..."
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create or update launch configuration
      const launchConfig = await this.createLaunchConfiguration(
        targetProject,
        profileName
      );

      // Start debugging
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage(
          "No workspace folder found. Please open a workspace first."
        );
        return;
      }

      try {
        this.outputChannel.appendLine(
          `Starting debug session with config: ${JSON.stringify(
            launchConfig,
            null,
            2
          )}`
        );

        // Try to start debugging
        const debugStarted = await vscode.debug.startDebugging(
          workspaceFolder,
          launchConfig
        );

        if (!debugStarted) {
          this.outputChannel.appendLine(
            "Debug session did not start. This may indicate the debugger type is not available."
          );

          // Check if we're using the legacy extension
          const isLegacyExtension =
            csharpExtension && csharpExtension.id === "vscode.csharp";

          let message =
            "Failed to start debugging. The coreclr debugger may not be available.";
          if (isLegacyExtension) {
            message =
              "The legacy C# extension (vscode.csharp) does not provide the coreclr debugger. Please install the modern C# extension (ms-dotnettools.csharp).";
          } else {
            message =
              "Please ensure the C# extension (ms-dotnettools.csharp) is installed, enabled, and reload VS Code.";
          }

          const actions = isLegacyExtension
            ? ["Install C# Extension", "Reload Window"]
            : ["Open Extensions", "Reload Window"];

          const action = await vscode.window.showWarningMessage(
            message,
            ...actions
          );

          if (
            action === "Install C# Extension" ||
            action === "Open Extensions"
          ) {
            await vscode.commands.executeCommand("workbench.view.extensions");
            await vscode.commands.executeCommand(
              "workbench.extensions.action.showExtensionsWithQuery",
              "@id:ms-dotnettools.csharp"
            );
          } else if (action === "Reload Window") {
            await vscode.commands.executeCommand(
              "workbench.action.reloadWindow"
            );
          }
        } else {
          this.outputChannel.appendLine("Debug session started successfully");
        }
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        this.outputChannel.appendLine(`Debug start error: ${errorMessage}`);

        // Check for various forms of the error message (including typos like "codeclr")
        const isDebuggerError =
          errorMessage.toLowerCase().includes("coreclr") ||
          errorMessage.toLowerCase().includes("codeclr") ||
          errorMessage.toLowerCase().includes("not supported") ||
          errorMessage.toLowerCase().includes("debug type");

        if (isDebuggerError) {
          // Check if we're using the legacy extension
          const isLegacyExtension =
            csharpExtension && csharpExtension.id === "vscode.csharp";

          let message = `Debugger type "coreclr" is not available.`;
          if (isLegacyExtension) {
            message = `The legacy C# extension (vscode.csharp) does not provide the coreclr debugger. Please install the modern C# extension (ms-dotnettools.csharp) and reload VS Code.`;
          } else {
            message = `Debugger type "coreclr" is not available. Please ensure the C# extension (ms-dotnettools.csharp) is installed, enabled, and reload VS Code. Error: ${errorMessage}`;
          }

          const actions = isLegacyExtension
            ? ["Install C# Extension", "Reload Window", "Show Output"]
            : ["Open Extensions", "Reload Window", "Show Output"];

          const action = await vscode.window.showErrorMessage(
            message,
            ...actions
          );

          if (
            action === "Install C# Extension" ||
            action === "Open Extensions"
          ) {
            await vscode.commands.executeCommand("workbench.view.extensions");
            await vscode.commands.executeCommand(
              "workbench.extensions.action.showExtensionsWithQuery",
              "@id:ms-dotnettools.csharp"
            );
          } else if (action === "Reload Window") {
            await vscode.commands.executeCommand(
              "workbench.action.reloadWindow"
            );
          } else if (action === "Show Output") {
            this.outputChannel.show();
          }
        } else {
          vscode.window.showErrorMessage(
            `Failed to start debugging: ${errorMessage}`
          );
          this.outputChannel.show();
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to start debugging";
      vscode.window.showErrorMessage(
        `Error starting debugger: ${errorMessage}`
      );
      this.outputChannel.appendLine(`Error: ${errorMessage}`);
      this.outputChannel.show(true);
    }
  }

  private async createLaunchConfiguration(
    project: any,
    profileName?: string | null
  ): Promise<vscode.DebugConfiguration> {
    const path = require("path");
    const fs = require("fs") as typeof import("fs");

    // Determine output path
    const projectDir = path.dirname(project.path);
    const projectName = path.basename(project.path, path.extname(project.path));

    // Try to find the built DLL
    const possiblePaths = [
      path.join(projectDir, "bin", "Debug", "net8.0", `${projectName}.dll`),
      path.join(projectDir, "bin", "Debug", "net7.0", `${projectName}.dll`),
      path.join(projectDir, "bin", "Debug", "net6.0", `${projectName}.dll`),
      path.join(
        projectDir,
        "bin",
        "Debug",
        project.targetFramework,
        `${projectName}.dll`
      ),
    ];

    let programPath = "";
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        programPath = possiblePath;
        break;
      }
    }

    if (!programPath) {
      // Fallback: use a pattern that VS Code will resolve
      programPath = "${workspaceFolder}/bin/Debug/**/${projectName}.dll";
    }

    // Get launch profile settings if profile is selected
    let args: string[] = [];
    let env: { [key: string]: string } = {};
    let configName = `.NET Core Launch (${project.name})`;
    let workingDir: string | undefined = undefined;

    if (profileName) {
      const profile = await LaunchProfileManager.getProfile(
        project.path,
        profileName
      );
      if (profile) {
        configName = `.NET Core Launch (${project.name}) - ${profileName}`;
        const profileArgs =
          LaunchProfileManager.getProfileCommandLineArgs(profile);
        if (profileArgs) {
          args = profileArgs.split(" ").filter((arg) => arg.length > 0);
        }
        env = LaunchProfileManager.getProfileEnvironmentVariables(profile);
        workingDir = LaunchProfileManager.getProfileWorkingDirectory(
          profile,
          project.path
        );
      }
    }

    const config: vscode.DebugConfiguration = {
      name: configName,
      type: "coreclr",
      request: "launch",
      program: programPath,
      args: args,
      env: env,
      cwd: workingDir || "${workspaceFolder}",
      stopAtEntry: false,
      console: "internalConsole",
      internalConsoleOptions: "openOnSessionStart",
    };

    return config;
  }

  private async selectProjectIfNeeded(): Promise<boolean> {
    const projects = this.projectDetector.getProjects();
    if (projects.length === 0) {
      vscode.window.showWarningMessage("No .NET projects found in workspace");
      return false;
    }

    if (projects.length === 1) {
      this.projectDetector.setCurrentProject(projects[0]);
      return true;
    }

    await this.projectDetector.selectProject();
    return !!this.projectDetector.getCurrentProject();
  }

  private async selectExecutableProject(
    executableProjects: any[]
  ): Promise<boolean> {
    if (executableProjects.length === 1) {
      this.projectDetector.setCurrentProject(executableProjects[0]);
      return true;
    }

    const items = executableProjects.map((p) => ({
      label: p.name,
      description: `${p.type} - ${p.targetFramework}`,
      detail: p.path,
      project: p,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: "Select an executable project to run",
    });

    if (selected) {
      this.projectDetector.setCurrentProject(selected.project);
      return true;
    }

    return false;
  }
}
