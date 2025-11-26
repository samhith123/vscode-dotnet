import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface LaunchProfile {
    commandName: string;
    commandLineArgs?: string;
    environmentVariables?: { [key: string]: string };
    applicationUrl?: string;
    launchBrowser?: boolean;
    launchUrl?: string;
    dotnetRunMessages?: boolean;
    workingDirectory?: string;
    [key: string]: any;
}

export interface LaunchSettings {
    profiles: { [profileName: string]: LaunchProfile };
    iisSettings?: any;
}

export class LaunchProfileManager {
    static async getLaunchSettings(projectPath: string): Promise<LaunchSettings | null> {
        const projectDir = path.dirname(projectPath);
        const launchSettingsPath = path.join(projectDir, 'Properties', 'launchSettings.json');

        if (!fs.existsSync(launchSettingsPath)) {
            return null;
        }

        try {
            const content = fs.readFileSync(launchSettingsPath, 'utf8');
            const settings = JSON.parse(content) as LaunchSettings;
            return settings;
        } catch (error) {
            return null;
        }
    }

    static async getProfiles(projectPath: string): Promise<string[]> {
        const settings = await this.getLaunchSettings(projectPath);
        if (!settings || !settings.profiles) {
            return [];
        }

        return Object.keys(settings.profiles);
    }

    static async getProfile(projectPath: string, profileName: string): Promise<LaunchProfile | null> {
        const settings = await this.getLaunchSettings(projectPath);
        if (!settings || !settings.profiles || !settings.profiles[profileName]) {
            return null;
        }

        return settings.profiles[profileName];
    }

    static async selectProfile(projectPath: string, outputChannel?: vscode.OutputChannel): Promise<string | null> {
        const profiles = await this.getProfiles(projectPath);
        
        if (profiles.length === 0) {
            return null;
        }

        if (profiles.length === 1) {
            return profiles[0];
        }

        // Load profile details for better display
        const items = await Promise.all(profiles.map(async (name) => {
            const profile = await this.getProfile(projectPath, name);
            if (!profile) {
                return {
                    label: name,
                    description: 'Launch profile',
                    detail: ''
                };
            }

            // Build detail string with key information
            const details: string[] = [];
            
            if (profile.applicationUrl) {
                details.push(`URL: ${profile.applicationUrl}`);
            }
            
            if (profile.environmentVariables) {
                const envCount = Object.keys(profile.environmentVariables).length;
                details.push(`${envCount} env var${envCount !== 1 ? 's' : ''}`);
            }
            
            if (profile.commandLineArgs) {
                details.push('Has args');
            }
            
            if (profile.workingDirectory) {
                details.push(`WorkingDir: ${profile.workingDirectory}`);
            }

            return {
                label: name,
                description: profile.commandName || 'Project',
                detail: details.length > 0 ? details.join(' • ') : 'Default settings'
            };
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a launch profile',
            matchOnDescription: true,
            matchOnDetail: true
        });

        return selected ? selected.label : null;
    }

    static getProfileCommandLineArgs(profile: LaunchProfile): string {
        const args: string[] = [];

        if (profile.commandLineArgs) {
            args.push(...profile.commandLineArgs.split(' ').filter(arg => arg.length > 0));
        }

        return args.join(' ');
    }

    static getProfileEnvironmentVariables(profile: LaunchProfile): { [key: string]: string } {
        return profile.environmentVariables || {};
    }

    static getProfileWorkingDirectory(profile: LaunchProfile, projectPath: string): string | undefined {
        if (!profile.workingDirectory) {
            return undefined;
        }

        // Resolve $(ProjectDir) variable
        const projectDir = path.dirname(projectPath);
        let workingDir = profile.workingDirectory;
        
        // Replace $(ProjectDir) with actual project directory
        workingDir = workingDir.replace(/\$\(ProjectDir\)/g, projectDir);
        workingDir = workingDir.replace(/\$\{ProjectDir\}/g, projectDir);
        
        // Resolve relative paths
        if (!path.isAbsolute(workingDir)) {
            workingDir = path.resolve(projectDir, workingDir);
        }
        
        return workingDir;
    }
}

