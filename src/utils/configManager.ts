import * as vscode from 'vscode';

export class ConfigManager {
    private getConfig(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration('dotnet');
    }

    getDotNetPath(): string {
        return this.getConfig().get<string>('path', '');
    }

    getTestFramework(): string {
        return this.getConfig().get<string>('testFramework', 'auto');
    }

    isAutoDetectEnabled(): boolean {
        return this.getConfig().get<boolean>('autoDetectProjects', true);
    }

    isCoverageEnabled(): boolean {
        return this.getConfig().get<boolean>('coverage.enabled', true);
    }

    getCoverageFormat(): string {
        return this.getConfig().get<string>('coverage.format', 'cobertura');
    }

    getRunArguments(): string {
        return this.getConfig().get<string>('runArguments', '');
    }

    getDebugConfig(): any {
        return this.getConfig().get<any>('debugConfig', {});
    }

    onDidChangeConfiguration(callback: () => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('dotnet')) {
                callback();
            }
        });
    }
}

