import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigManager } from './configManager';

const execAsync = promisify(exec);

export interface DotNetProject {
    path: string;
    name: string;
    type: 'console' | 'web' | 'library' | 'test' | 'unknown';
    targetFramework: string;
    isTestProject: boolean;
}

export class DotNetCli {
    private dotnetPath: string;

    constructor(
        private configManager: ConfigManager,
        private outputChannel: vscode.OutputChannel
    ) {
        const customPath = configManager.getDotNetPath();
        this.dotnetPath = customPath || 'dotnet';
    }

    async validateInstallation(): Promise<boolean> {
        try {
            const { stdout } = await this.executeCommand('--version');
            const version = stdout.trim();
            if (version) {
                this.outputChannel.appendLine(`.NET SDK version: ${version}`);
                return true;
            }
            return false;
        } catch (error: any) {
            const errorMessage = error.message || String(error);
            this.outputChannel.appendLine(`Failed to validate .NET installation: ${errorMessage}`);
            this.outputChannel.appendLine('Please ensure .NET SDK is installed and available in PATH');
            return false;
        }
    }

    async executeCommand(
        command: string,
        cwd?: string,
        options?: { timeout?: number }
    ): Promise<{ stdout: string; stderr: string }> {
        const fullCommand = `${this.dotnetPath} ${command}`;
        this.outputChannel.appendLine(`Executing: ${fullCommand}${cwd ? ` (cwd: ${cwd})` : ''}`);

        try {
            const result = await execAsync(fullCommand, {
                cwd: cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                timeout: options?.timeout || 30000,
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
            });
            
            // Log stdout if present
            if (result.stdout) {
                this.outputChannel.appendLine(result.stdout);
            }
            
            // Log stderr if present (warnings, etc.)
            if (result.stderr) {
                this.outputChannel.appendLine(result.stderr);
            }
            
            return result;
        } catch (error: any) {
            // Capture both stdout and stderr from error
            const stdout = error.stdout || '';
            const stderr = error.stderr || '';
            const errorMessage = error.message || 'Unknown error';
            
            // Log the full output
            if (stdout) {
                this.outputChannel.appendLine('--- Build Output ---');
                this.outputChannel.appendLine(stdout);
            }
            if (stderr) {
                this.outputChannel.appendLine('--- Error Output ---');
                this.outputChannel.appendLine(stderr);
            }
            
            // Combine stdout and stderr for error message (build errors are often in stdout)
            const fullOutput = stdout || stderr || errorMessage;
            this.outputChannel.appendLine(`Command failed: ${errorMessage}`);
            
            // Create enhanced error with full output
            const enhancedError: any = new Error(fullOutput);
            enhancedError.stdout = stdout;
            enhancedError.stderr = stderr;
            enhancedError.originalError = error;
            throw enhancedError;
        }
    }

    async buildProject(
        projectPath: string,
        configuration?: 'Debug' | 'Release',
        platform?: 'Any CPU' | 'x86' | 'x64'
    ): Promise<{ success: boolean; error?: string; output?: string }> {
        let command = `build "${projectPath}"`;
        
        if (configuration) {
            command += ` --configuration ${configuration}`;
        }
        
        if (platform && platform !== 'Any CPU') {
            command += ` --runtime ${platform === 'x86' ? 'win-x86' : 'win-x64'}`;
        }
        
        try {
            const result = await this.executeCommand(command);
            return { success: true };
        } catch (error: any) {
            // Combine stdout and stderr - build errors are often in stdout
            const stdout = error.stdout || '';
            const stderr = error.stderr || '';
            const fullOutput = (stdout + '\n' + stderr).trim() || error.message || 'Build failed';
            
            this.outputChannel.appendLine(`Build failed for: ${projectPath}`);
            this.outputChannel.appendLine('--- Build Errors ---');
            this.outputChannel.appendLine(fullOutput);
            
            return { 
                success: false, 
                error: fullOutput,
                output: fullOutput
            };
        }
    }

    async runProject(projectPath: string, profileName?: string | null, additionalArgs?: string): Promise<void> {
        let command = `run --project "${projectPath}"`;
        
        // Add launch profile if specified
        if (profileName) {
            command += ` --launch-profile "${profileName}"`;
        }
        
        // Add additional arguments (from settings or passed in)
        const runArgs = additionalArgs || this.configManager.getRunArguments();
        if (runArgs) {
            command += ` ${runArgs}`;
        }
        
        await this.executeCommand(command);
    }

    async listTests(projectPath: string): Promise<string> {
        const { stdout } = await this.executeCommand(
            `test "${projectPath}" --list-tests --no-build`
        );
        return stdout;
    }

    async runTests(
        projectPath: string,
        testFilter?: string,
        withCoverage: boolean = false
    ): Promise<string> {
        let command = `test "${projectPath}"`;
        
        if (testFilter) {
            command += ` --filter "${testFilter}"`;
        }

        if (withCoverage) {
            const format = this.configManager.getCoverageFormat();
            command += ` /p:CollectCoverage=true /p:CoverletOutputFormat=${format}`;
        }

        const { stdout } = await this.executeCommand(command);
        return stdout;
    }

    async getProjectInfo(projectPath: string): Promise<DotNetProject> {
        const path = require('path');
        const name = path.basename(projectPath, path.extname(projectPath));
        
        // Try to determine project type by reading the csproj file
        const fs = require('fs');
        const projectContent = fs.readFileSync(projectPath, 'utf8');
        
        let type: DotNetProject['type'] = 'unknown';
        let targetFramework = '';
        let isTestProject = false;

        // Check for test project indicators
        if (projectContent.includes('Microsoft.NET.Test.Sdk') ||
            projectContent.includes('xunit') ||
            projectContent.includes('nunit') ||
            projectContent.includes('MSTest')) {
            type = 'test';
            isTestProject = true;
        } else if (projectContent.includes('Microsoft.AspNetCore')) {
            type = 'web';
        } else if (projectContent.includes('<OutputType>Exe</OutputType>')) {
            type = 'console';
        } else {
            type = 'library';
        }

        // Extract target framework - supports both TargetFramework and TargetFrameworks
        let tfMatch = projectContent.match(/<TargetFramework[^>]*>([^<]+)<\/TargetFramework>/i);
        if (!tfMatch) {
            // Try TargetFrameworks (plural) for multi-targeting projects
            tfMatch = projectContent.match(/<TargetFrameworks[^>]*>([^<]+)<\/TargetFrameworks>/i);
        }
        if (tfMatch) {
            targetFramework = tfMatch[1].split(';')[0]; // Use first framework if multiple
        } else {
            // Try to detect .NET Framework version from other indicators
            if (projectContent.includes('net4') || projectContent.includes('netframework')) {
                targetFramework = 'net48'; // Default to .NET Framework 4.8
            } else if (projectContent.includes('netstandard')) {
                targetFramework = 'netstandard2.1'; // Default to .NET Standard 2.1
            }
        }

        return {
            path: projectPath,
            name,
            type,
            targetFramework,
            isTestProject
        };
    }
}

