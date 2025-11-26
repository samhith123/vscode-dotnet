import * as vscode from 'vscode';
import { RunDebugManager } from '../runDebugManager';
import { TestRunner } from '../testRunner';
import { CoverageProvider } from '../coverageProvider';
import { ProjectDetector } from '../projectDetector';

export class StatusBar {
    private runButton: vscode.StatusBarItem;
    private debugButton: vscode.StatusBarItem;
    private testStatusButton: vscode.StatusBarItem;
    private coverageButton: vscode.StatusBarItem;
    private projectButton: vscode.StatusBarItem;

    constructor(
        private runDebugManager: RunDebugManager,
        private testRunner: TestRunner,
        private coverageProvider: CoverageProvider,
        private projectDetector: ProjectDetector
    ) {
        this.runButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.runButton.command = 'dotnet.run';
        this.runButton.tooltip = 'Run .NET Project';

        this.debugButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            99
        );
        this.debugButton.command = 'dotnet.debug';
        this.debugButton.tooltip = 'Debug .NET Project';

        this.testStatusButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            98
        );
        this.testStatusButton.command = 'dotnet.runTests';
        this.testStatusButton.tooltip = 'Run All Tests';

        this.coverageButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            97
        );
        this.coverageButton.command = 'dotnet.runTestsWithCoverage';
        this.coverageButton.tooltip = 'Run Tests with Coverage';

        this.projectButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            96
        );
        this.projectButton.command = 'dotnet.selectProject';
        this.projectButton.tooltip = 'Select .NET Project';
    }

    initialize(context: vscode.ExtensionContext): void {
        this.updateStatusBar();
        
        // Update when projects change
        this.projectDetector.onProjectsChanged(() => {
            this.updateStatusBar();
        });

        // Show buttons
        this.runButton.show();
        this.debugButton.show();
        this.testStatusButton.show();
        this.coverageButton.show();
        this.projectButton.show();

        context.subscriptions.push(
            this.runButton,
            this.debugButton,
            this.testStatusButton,
            this.coverageButton,
            this.projectButton
        );
    }

    private updateStatusBar(): void {
        const project = this.projectDetector.getCurrentProject();
        
        if (project) {
            this.runButton.text = `$(play) Run`;
            this.debugButton.text = `$(debug) Debug`;
            this.projectButton.text = `$(file-code) ${project.name}`;
            this.testStatusButton.text = `$(beaker) Tests`;
            this.coverageButton.text = `$(graph) Coverage`;
        } else {
            this.runButton.text = `$(play) Run (No Project)`;
            this.debugButton.text = `$(debug) Debug (No Project)`;
            this.projectButton.text = `$(file-code) Select Project`;
            this.testStatusButton.text = `$(beaker) Tests (No Project)`;
            this.coverageButton.text = `$(graph) Coverage (No Project)`;
        }
    }

    updateTestStatus(passed: number, failed: number, total: number): void {
        if (total > 0) {
            const status = failed > 0 ? '$(error)' : '$(check)';
            this.testStatusButton.text = `${status} Tests: ${passed}/${total}`;
        }
    }

    updateCoverageStatus(coverage: number): void {
        if (coverage >= 0) {
            const color = coverage >= 80 ? '$(check)' : coverage >= 50 ? '$(warning)' : '$(error)';
            this.coverageButton.text = `${color} Coverage: ${coverage.toFixed(1)}%`;
        }
    }
}

