import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DotNetProject, DotNetCli } from './utils/dotnetCli';
import { ConfigManager } from './utils/configManager';

export class ProjectDetector {
    private projects: DotNetProject[] = [];
    private currentProject: DotNetProject | undefined;
    private readonly onProjectsChangedEmitter = new vscode.EventEmitter<DotNetProject[]>();
    public readonly onProjectsChanged = this.onProjectsChangedEmitter.event;

    constructor(
        private context: vscode.ExtensionContext,
        private outputChannel: vscode.OutputChannel
    ) {}

    async initialize(): Promise<void> {
        await this.detectProjects();
    }

    async detectProjects(): Promise<void> {
        const configManager = new ConfigManager();
        
        if (!configManager.isAutoDetectEnabled()) {
            this.outputChannel.appendLine('Auto-detection is disabled. Enable it in settings to detect projects automatically.');
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            this.outputChannel.appendLine('No workspace folders found. Please open a workspace containing .NET projects.');
            return;
        }

        this.projects = [];
        const projectFiles: string[] = [];

        // Search for project files using VS Code's file search API
        for (const folder of workspaceFolders) {
            const patterns = [
                new vscode.RelativePattern(folder, '**/*.csproj'),
                new vscode.RelativePattern(folder, '**/*.fsproj'),
                new vscode.RelativePattern(folder, '**/*.sln')
            ];

            for (const pattern of patterns) {
                try {
                    const files = await vscode.workspace.findFiles(
                        pattern,
                        '**/{node_modules,bin,obj,.vs}/**',
                        1000
                    );
                    const filePaths = files.map(file => file.fsPath);
                    projectFiles.push(...filePaths);
                } catch (error: any) {
                    const errorMsg = error.message || String(error);
                    this.outputChannel.appendLine(`Error searching for projects: ${errorMsg}`);
                }
            }
        }

        if (projectFiles.length === 0) {
            this.outputChannel.appendLine('No .NET project files (.csproj, .fsproj, .sln) found in workspace.');
            return;
        }

        // Parse project files
        const dotnetCli = new DotNetCli(configManager, this.outputChannel);
        for (const file of projectFiles) {
            try {
                if (file.endsWith('.sln')) {
                    // For solution files, we'd need to parse them to get individual projects
                    // For now, skip solution files and focus on individual project files
                    this.outputChannel.appendLine(`Skipping solution file: ${file}. Please open individual project files.`);
                    continue;
                }

                if (!fs.existsSync(file)) {
                    this.outputChannel.appendLine(`Project file not found: ${file}`);
                    continue;
                }

                const projectInfo = await dotnetCli.getProjectInfo(file);
                this.projects.push(projectInfo);
                this.outputChannel.appendLine(`Detected project: ${projectInfo.name} (${projectInfo.type})`);
            } catch (error: any) {
                const errorMsg = error.message || String(error);
                this.outputChannel.appendLine(`Error parsing project ${file}: ${errorMsg}`);
            }
        }

        if (this.projects.length === 0) {
            this.outputChannel.appendLine('No valid .NET projects could be parsed. Please check project files.');
            return;
        }

        // Set current project (prefer non-test projects)
        const nonTestProjects = this.projects.filter(p => !p.isTestProject);
        this.currentProject = nonTestProjects.length > 0 
            ? nonTestProjects[0] 
            : this.projects[0];

        this.outputChannel.appendLine(`Selected project: ${this.currentProject.name}`);
        this.onProjectsChangedEmitter.fire(this.projects);
    }

    getProjects(): DotNetProject[] {
        return this.projects;
    }

    getCurrentProject(): DotNetProject | undefined {
        return this.currentProject;
    }

    setCurrentProject(project: DotNetProject): void {
        this.currentProject = project;
        this.outputChannel.appendLine(`Current project set to: ${project.name}`);
    }

    async selectProject(): Promise<void> {
        if (this.projects.length === 0) {
            vscode.window.showWarningMessage('No .NET projects found in workspace');
            return;
        }

        const items = this.projects.map(p => ({
            label: p.name,
            description: `${p.type} - ${p.targetFramework}`,
            detail: p.path,
            project: p
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a .NET project'
        });

        if (selected) {
            this.setCurrentProject(selected.project);
        }
    }

    async refresh(): Promise<void> {
        await this.detectProjects();
    }
}

