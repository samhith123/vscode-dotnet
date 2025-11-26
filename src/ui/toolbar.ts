import * as vscode from 'vscode';
import { ProjectDetector } from '../projectDetector';
import { RunDebugManager } from '../runDebugManager';
import { LaunchProfileManager } from '../utils/launchProfileManager';

export class Toolbar {
    private buildConfigButton: vscode.StatusBarItem;
    private platformButton: vscode.StatusBarItem;
    private projectButton: vscode.StatusBarItem;
    private launchProfileButton: vscode.StatusBarItem;
    private runButton: vscode.StatusBarItem;
    private debugButton: vscode.StatusBarItem;
    private runWithoutDebugButton: vscode.StatusBarItem;

    private currentBuildConfig: 'Debug' | 'Release' = 'Debug';
    private currentPlatform: 'Any CPU' | 'x86' | 'x64' = 'Any CPU';
    private currentLaunchProfile: string | null = null;

    constructor(
        private projectDetector: ProjectDetector,
        private runDebugManager: RunDebugManager
    ) {
        // Build Configuration dropdown - higher priority to appear at top
        this.buildConfigButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            1000
        );
        this.buildConfigButton.command = 'dotnet.selectBuildConfig';
        this.buildConfigButton.tooltip = 'Select Build Configuration (Debug/Release)';
        this.buildConfigButton.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');

        // Platform dropdown
        this.platformButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            999
        );
        this.platformButton.command = 'dotnet.selectPlatform';
        this.platformButton.tooltip = 'Select Platform (Any CPU/x86/x64)';
        this.platformButton.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');

        // Project selector
        this.projectButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            998
        );
        this.projectButton.command = 'dotnet.selectProject';
        this.projectButton.tooltip = 'Select .NET Project';
        this.projectButton.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');

        // Launch Profile selector
        this.launchProfileButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            997
        );
        this.launchProfileButton.command = 'dotnet.selectLaunchProfile';
        this.launchProfileButton.tooltip = 'Select Launch Profile';
        this.launchProfileButton.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');

        // Run button
        this.runButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            196
        );
        this.runButton.command = 'dotnet.run';
        this.runButton.tooltip = 'Start Without Debugging (Ctrl+F5)';

        // Debug button
        this.debugButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            195
        );
        this.debugButton.command = 'dotnet.debug';
        this.debugButton.tooltip = 'Start Debugging (F5)';

        // Run without debugging button (outline style)
        this.runWithoutDebugButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            194
        );
        this.runWithoutDebugButton.command = 'dotnet.runWithoutDebug';
        this.runWithoutDebugButton.tooltip = 'Start Without Debugging';
    }

    initialize(context: vscode.ExtensionContext): void {
        this.updateToolbar();
        
        // Update when projects change
        this.projectDetector.onProjectsChanged(() => {
            this.updateToolbar();
            this.updateLaunchProfile();
        });

        // Show all toolbar items with higher priority to appear at top
        this.buildConfigButton.show();
        this.platformButton.show();
        this.projectButton.show();
        this.launchProfileButton.show();
        this.runButton.show();
        this.debugButton.show();
        this.runWithoutDebugButton.show();

        context.subscriptions.push(
            this.buildConfigButton,
            this.platformButton,
            this.projectButton,
            this.launchProfileButton,
            this.runButton,
            this.debugButton,
            this.runWithoutDebugButton
        );
    }

    updateToolbar(): void {
        const project = this.projectDetector.getCurrentProject();
        
        // Build Configuration - show current selection prominently
        this.buildConfigButton.text = `$(settings-gear) ${this.currentBuildConfig}`;
        this.buildConfigButton.tooltip = `Build Configuration: ${this.currentBuildConfig} (Click to change)`;
        
        // Platform - show current selection prominently
        this.platformButton.text = `$(server-process) ${this.currentPlatform}`;
        this.platformButton.tooltip = `Platform: ${this.currentPlatform} (Click to change)`;
        
        // Project - show current selection prominently
        if (project) {
            this.projectButton.text = `$(file-code) ${project.name}`;
            this.projectButton.tooltip = `Project: ${project.name} (Click to change)`;
        } else {
            this.projectButton.text = `$(file-code) Select Project`;
            this.projectButton.tooltip = 'Click to select a .NET project';
        }

        // Launch Profile - update synchronously first, then async
        this.updateLaunchProfileSync();

        // Run button (outline style)
        this.runWithoutDebugButton.text = project ? `$(play) ${project.name}` : `$(play) Run`;
        this.runWithoutDebugButton.tooltip = 'Start Without Debugging (Ctrl+F5)';
        
        // Debug button (solid style)
        this.debugButton.text = project ? `$(debug-alt) ${project.name}` : `$(debug-alt) Debug`;
        this.debugButton.tooltip = 'Start Debugging (F5)';
    }

    private updateLaunchProfileSync(): void {
        const project = this.projectDetector.getCurrentProject();
        if (!project) {
            this.launchProfileButton.text = '$(list-selection) Profile';
            this.launchProfileButton.tooltip = 'No project selected';
            this.currentLaunchProfile = null;
            return;
        }

        if (this.currentLaunchProfile) {
            this.launchProfileButton.text = `$(list-selection) ${this.currentLaunchProfile}`;
            this.launchProfileButton.tooltip = `Launch Profile: ${this.currentLaunchProfile} (Click to change)`;
        } else {
            this.launchProfileButton.text = '$(list-selection) Profile';
            this.launchProfileButton.tooltip = 'Click to select a launch profile';
        }
    }

    private async updateLaunchProfile(): Promise<void> {
        const project = this.projectDetector.getCurrentProject();
        if (!project) {
            this.launchProfileButton.text = '$(list-selection) Profile';
            this.currentLaunchProfile = null;
            return;
        }

        const profiles = await LaunchProfileManager.getProfiles(project.path);
        if (profiles.length === 0) {
            this.launchProfileButton.text = '$(list-selection) Profile';
            this.currentLaunchProfile = null;
        } else if (profiles.length === 1) {
            this.currentLaunchProfile = profiles[0];
            this.launchProfileButton.text = `$(list-selection) ${profiles[0]}`;
        } else {
            const displayName = this.currentLaunchProfile || profiles[0];
            this.launchProfileButton.text = `$(list-selection) ${displayName}`;
        }
    }

    async selectBuildConfig(): Promise<void> {
        const configs: ('Debug' | 'Release')[] = ['Debug', 'Release'];
        const items = configs.map(config => ({
            label: config,
            description: config === 'Debug' ? 'Debug build with symbols' : 'Release build optimized',
            isSelected: config === this.currentBuildConfig
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select Build Configuration'
        });

        if (selected) {
            this.currentBuildConfig = selected.label;
            this.updateToolbar();
            // Don't show message, let the toolbar display speak for itself
        }
    }

    async selectPlatform(): Promise<void> {
        const platforms: ('Any CPU' | 'x86' | 'x64')[] = ['Any CPU', 'x86', 'x64'];
        const items = platforms.map(platform => ({
            label: platform,
            description: platform === 'Any CPU' ? 'Platform agnostic' : `${platform} architecture`,
            isSelected: platform === this.currentPlatform
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select Platform'
        });

        if (selected) {
            this.currentPlatform = selected.label;
            this.updateToolbar();
            // Don't show message, let the toolbar display speak for itself
        }
    }

    async selectLaunchProfile(): Promise<void> {
        const project = this.projectDetector.getCurrentProject();
        if (!project) {
            vscode.window.showWarningMessage('No project selected. Please select a project first.');
            return;
        }

        const selected = await LaunchProfileManager.selectProfile(project.path);
        if (selected) {
            this.currentLaunchProfile = selected;
            this.updateLaunchProfileSync();
            await this.updateLaunchProfile(); // Update async to get full profile list
            // Don't show message, let the toolbar display speak for itself
        }
    }

    getBuildConfig(): 'Debug' | 'Release' {
        return this.currentBuildConfig;
    }

    getPlatform(): 'Any CPU' | 'x86' | 'x64' {
        return this.currentPlatform;
    }

    getLaunchProfile(): string | null {
        return this.currentLaunchProfile;
    }
}

