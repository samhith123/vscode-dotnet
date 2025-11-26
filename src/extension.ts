import * as vscode from 'vscode';
import { ProjectDetector } from './projectDetector';
import { RunDebugManager } from './runDebugManager';
import { TestRunner } from './testRunner';
import { CoverageProvider } from './coverageProvider';
import { StatusBar } from './ui/statusBar';
import { Toolbar } from './ui/toolbar';
import { ConfigManager } from './utils/configManager';
import { DotNetCli } from './utils/dotnetCli';
import { LaunchProfileManager } from './utils/launchProfileManager';

// Enable comprehensive Ctrl+Click navigation for all symbol types (Visual Studio-like)
function enableCtrlClickNavigation() {
    const editorConfig = vscode.workspace.getConfiguration('editor');
    
    // Enable Ctrl+Click for definitions (classes, methods, properties, variables, etc.)
    const enableCtrlClickDef = editorConfig.get<boolean>('gotoLocation.multipleDefinitions', true);
    if (!enableCtrlClickDef) {
        editorConfig.update('gotoLocation.multipleDefinitions', true, vscode.ConfigurationTarget.Global);
    }
    
    // Enable Ctrl+Click for implementations (interfaces, abstract methods, etc.)
    const enableCtrlClickImpl = editorConfig.get<boolean>('gotoLocation.multipleImplementations', true);
    if (!enableCtrlClickImpl) {
        editorConfig.update('gotoLocation.multipleImplementations', true, vscode.ConfigurationTarget.Global);
    }
    
    // Enable Ctrl+Click for type definitions
    const enableCtrlClickType = editorConfig.get<boolean>('gotoLocation.multipleTypeDefinitions', true);
    if (!enableCtrlClickType) {
        editorConfig.update('gotoLocation.multipleTypeDefinitions', true, vscode.ConfigurationTarget.Global);
    }
    
    // Enable Ctrl+Click for references
    const enableCtrlClickRef = editorConfig.get<boolean>('gotoLocation.multipleReferences', true);
    if (!enableCtrlClickRef) {
        editorConfig.update('gotoLocation.multipleReferences', true, vscode.ConfigurationTarget.Global);
    }
    
    // Enable Ctrl+Click for declarations
    const enableCtrlClickDecl = editorConfig.get<boolean>('gotoLocation.multipleDeclarations', true);
    if (!enableCtrlClickDecl) {
        editorConfig.update('gotoLocation.multipleDeclarations', true, vscode.ConfigurationTarget.Global);
    }
    
    // Ensure editor supports Ctrl+Click (not just Cmd+Click on Mac)
    const editorActionConfig = vscode.workspace.getConfiguration('editor');
    const multiCursorModifier = editorActionConfig.get<string>('multiCursorModifier', 'ctrlCmd');
    
    // Enable "Go to Definition" on Ctrl+Click
    const definitionOnCtrlClick = editorConfig.get<boolean>('definitionLinkOpensInPeek', false);
    // This setting controls whether Ctrl+Click opens in peek view or navigates directly
    
    // Ensure word-based suggestions are enabled for better symbol detection
    const suggestConfig = vscode.workspace.getConfiguration('editor.suggest');
    const showWords = suggestConfig.get<boolean>('showWords', true);
    if (!showWords) {
        suggestConfig.update('showWords', true, vscode.ConfigurationTarget.Global);
    }
    
    // Enable semantic highlighting for better symbol recognition
    const semanticHighlighting = editorConfig.get<boolean>('semanticHighlighting.enabled', true);
    if (!semanticHighlighting) {
        editorConfig.update('semanticHighlighting.enabled', true, vscode.ConfigurationTarget.Global);
    }
    
    // Enable breadcrumbs for navigation context
    const breadcrumbsConfig = vscode.workspace.getConfiguration('breadcrumbs');
    const breadcrumbsEnabled = breadcrumbsConfig.get<boolean>('enabled', true);
    if (!breadcrumbsEnabled) {
        breadcrumbsConfig.update('enabled', true, vscode.ConfigurationTarget.Global);
    }
    
    // Enable symbol navigation in breadcrumbs
    const breadcrumbsSymbols = breadcrumbsConfig.get<boolean>('symbolPath', true);
    if (!breadcrumbsSymbols) {
        breadcrumbsConfig.update('symbolPath', true, vscode.ConfigurationTarget.Global);
    }
}

export async function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('.NET Run & Debug');
    context.subscriptions.push(outputChannel);

    // Enable comprehensive Ctrl+Click navigation if configured
    const configManager = new ConfigManager();
    const dotnetConfig = vscode.workspace.getConfiguration('dotnet');
    const enableCtrlClick = dotnetConfig.get<boolean>('enableCtrlClickNavigation', true);
    const ctrlClickBehavior = dotnetConfig.get<string>('ctrlClickBehavior', 'gotoOrPeek');
    
    if (enableCtrlClick) {
        enableCtrlClickNavigation();
        
        // Configure Ctrl+Click behavior based on user preference
        const editorConfig = vscode.workspace.getConfiguration('editor');
        if (ctrlClickBehavior === 'peekDefinition') {
            editorConfig.update('definitionLinkOpensInPeek', true, vscode.ConfigurationTarget.Global);
        } else if (ctrlClickBehavior === 'gotoDefinition') {
            editorConfig.update('definitionLinkOpensInPeek', false, vscode.ConfigurationTarget.Global);
        }
        // 'gotoOrPeek' uses VS Code's default behavior (peek for multiple, goto for single)
    }

    // Initialize components (configManager already created above)
    const dotnetCli = new DotNetCli(configManager, outputChannel);
    
    // Validate .NET SDK installation
    const sdkInstalled = await dotnetCli.validateInstallation();
    if (!sdkInstalled) {
        vscode.window.showErrorMessage(
            '.NET SDK not found. Please install .NET SDK to use this extension.'
        );
        return;
    }

    // Initialize project detector
    const projectDetector = new ProjectDetector(context, outputChannel);
    await projectDetector.initialize();

    // Initialize run/debug manager
    const runDebugManager = new RunDebugManager(
        projectDetector,
        dotnetCli,
        outputChannel
    );

    // Initialize test runner
    const testRunner = new TestRunner(
        projectDetector,
        dotnetCli,
        outputChannel
    );

    // Initialize coverage provider
    const coverageProvider = new CoverageProvider(
        testRunner,
        dotnetCli,
        configManager,
        outputChannel
    );

    // Initialize UI components
    const statusBar = new StatusBar(
        runDebugManager,
        testRunner,
        coverageProvider,
        projectDetector
    );
    statusBar.initialize(context);

    // Initialize toolbar (status bar)
    const toolbar = new Toolbar(projectDetector, runDebugManager);
    toolbar.initialize(context);

    // Update status bar when tests complete
    testRunner.onTestResultsChanged(() => {
        const summary = testRunner.getTestSummary();
        statusBar.updateTestStatus(summary.passed, summary.failed, summary.total);
    });

    // Update status bar when coverage is collected
    coverageProvider.onCoverageChanged(() => {
        const overallCoverage = coverageProvider.getOverallCoverage();
        statusBar.updateCoverageStatus(overallCoverage);
    });

    // Register commands
    const commands = [
        vscode.commands.registerCommand('dotnet.run', async () => {
            await runDebugManager.runProject();
        }),
        vscode.commands.registerCommand('dotnet.debug', async () => {
            await runDebugManager.debugProject();
        }),
        vscode.commands.registerCommand('dotnet.runTests', async () => {
            await testRunner.runAllTests();
        }),
        vscode.commands.registerCommand('dotnet.runTestsWithCoverage', async () => {
            await coverageProvider.runTestsWithCoverage();
        }),
        vscode.commands.registerCommand('dotnet.selectProject', async () => {
            await projectDetector.selectProject();
            toolbar.updateToolbar();
        }),
        vscode.commands.registerCommand('dotnet.refreshProjects', async () => {
            await projectDetector.refresh();
        }),
        vscode.commands.registerCommand('dotnet.selectBuildConfig', async () => {
            await toolbar.selectBuildConfig();
            runDebugManager.setBuildConfig(toolbar.getBuildConfig());
            toolbar.updateToolbar();
        }),
        vscode.commands.registerCommand('dotnet.selectPlatform', async () => {
            await toolbar.selectPlatform();
            runDebugManager.setPlatform(toolbar.getPlatform());
            toolbar.updateToolbar();
        }),
        vscode.commands.registerCommand('dotnet.runWithoutDebug', async () => {
            await runDebugManager.runProject();
        }),
        vscode.commands.registerCommand('dotnet.selectLaunchProfile', async () => {
            await toolbar.selectLaunchProfile();
            toolbar.updateToolbar();
        }),
        // Navigation commands - Visual Studio-like navigation for all symbol types
        vscode.commands.registerCommand('dotnet.goToDefinition', async () => {
            await vscode.commands.executeCommand('editor.action.revealDefinition');
        }),
        vscode.commands.registerCommand('dotnet.goToImplementation', async () => {
            await vscode.commands.executeCommand('editor.action.goToImplementation');
        }),
        vscode.commands.registerCommand('dotnet.peekDefinition', async () => {
            await vscode.commands.executeCommand('editor.action.peekDefinition');
        }),
        vscode.commands.registerCommand('dotnet.peekImplementation', async () => {
            await vscode.commands.executeCommand('editor.action.peekImplementation');
        }),
        vscode.commands.registerCommand('dotnet.goToTypeDefinition', async () => {
            await vscode.commands.executeCommand('editor.action.goToTypeDefinition');
        }),
        vscode.commands.registerCommand('dotnet.goToReferences', async () => {
            await vscode.commands.executeCommand('editor.action.goToReferences');
        }),
        vscode.commands.registerCommand('dotnet.goToDeclaration', async () => {
            await vscode.commands.executeCommand('editor.action.goToDeclaration');
        }),
        vscode.commands.registerCommand('dotnet.findAllReferences', async () => {
            await vscode.commands.executeCommand('references-view.findReferences');
        }),
        vscode.commands.registerCommand('dotnet.enableCtrlClickNavigation', async () => {
            enableCtrlClickNavigation();
            vscode.window.showInformationMessage('Ctrl+Click navigation enabled for all symbol types. Reload VS Code for changes to take full effect.');
        })
    ];

    context.subscriptions.push(...commands);

    // Watch for project file changes
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.{csproj,fsproj,sln}');
    watcher.onDidCreate(() => projectDetector.refresh());
    watcher.onDidDelete(() => projectDetector.refresh());
    watcher.onDidChange(() => projectDetector.refresh());
    context.subscriptions.push(watcher);

    outputChannel.appendLine('.NET Run & Debug extension activated');
}

export function deactivate() {
    // Cleanup is handled by VS Code's subscription system
    // All subscriptions registered with context.subscriptions.push() are automatically disposed
}

