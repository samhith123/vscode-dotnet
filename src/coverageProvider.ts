import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TestRunner } from './testRunner';
import { DotNetCli } from './utils/dotnetCli';
import { ConfigManager } from './utils/configManager';

export interface CoverageData {
    filePath: string;
    coverage: number;
    lines: {
        line: number;
        covered: boolean;
    }[];
}

export class CoverageProvider {
    private coverageData: Map<string, CoverageData> = new Map();
    private coverageDecorations: {
        covered: vscode.TextEditorDecorationType;
        uncovered: vscode.TextEditorDecorationType;
    };
    private readonly onCoverageChangedEmitter = new vscode.EventEmitter<void>();
    public readonly onCoverageChanged = this.onCoverageChangedEmitter.event;

    constructor(
        private testRunner: TestRunner,
        private dotnetCli: DotNetCli,
        private configManager: ConfigManager,
        private outputChannel: vscode.OutputChannel
    ) {
        // Create decorations for coverage visualization
        this.coverageDecorations = {
            covered: vscode.window.createTextEditorDecorationType({
                backgroundColor: new vscode.ThemeColor('editor.lineHighlightBackground'),
                overviewRulerColor: 'green',
                overviewRulerLane: vscode.OverviewRulerLane.Right
            }),
            uncovered: vscode.window.createTextEditorDecorationType({
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                overviewRulerColor: 'red',
                overviewRulerLane: vscode.OverviewRulerLane.Right
            })
        };
    }

    async runTestsWithCoverage(): Promise<void> {
        if (!this.configManager.isCoverageEnabled()) {
            vscode.window.showWarningMessage(
                'Code coverage is disabled in settings. Enable "dotnet.coverage.enabled" to collect coverage.'
            );
            return;
        }

        const testProjects = this.testRunner.projectDetector.getProjects().filter(p => p.isTestProject);
        
        if (testProjects.length === 0) {
            vscode.window.showWarningMessage(
                'No test projects found in workspace. Ensure your test projects reference a test framework.'
            );
            return;
        }

        this.outputChannel.show(true);
        this.outputChannel.appendLine(`Running tests with coverage in ${testProjects.length} test project(s)...`);
        this.outputChannel.appendLine('Note: Ensure Coverlet is installed in your test projects for coverage collection.');

        let hasErrors = false;
        for (const project of testProjects) {
            try {
                await this.collectCoverage(project.path);
            } catch (error: any) {
                hasErrors = true;
                const errorMsg = error.message || String(error);
                this.outputChannel.appendLine(`Error collecting coverage for ${project.name}: ${errorMsg}`);
            }
        }

        if (hasErrors) {
            vscode.window.showWarningMessage('Some coverage collection failed. Check output for details.');
        }

        const overallCoverage = this.getOverallCoverage();
        if (overallCoverage > 0) {
            const message = `Coverage collected: ${overallCoverage.toFixed(1)}%`;
            this.outputChannel.appendLine(message);
            vscode.window.showInformationMessage(message);
        } else {
            vscode.window.showWarningMessage(
                'No coverage data collected. Ensure Coverlet is installed and configured in your test projects.'
            );
        }

        this.visualizeCoverage();
        this.onCoverageChangedEmitter.fire();
    }

    private async collectCoverage(projectPath: string): Promise<void> {
        try {
            const output = await this.dotnetCli.runTests(projectPath, undefined, true);
            this.outputChannel.appendLine(`Coverage collected for: ${projectPath}`);
            
            // Parse coverage report
            await this.parseCoverageReport(projectPath, output);
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to collect coverage';
            this.outputChannel.appendLine(`Error collecting coverage: ${errorMessage}`);
            vscode.window.showErrorMessage(`Error collecting coverage: ${errorMessage}`);
        }
    }

    private async parseCoverageReport(projectPath: string, output: string): Promise<void> {
        const format = this.configManager.getCoverageFormat();
        const projectDir = path.dirname(projectPath);
        
        // Look for coverage report files
        const coverageFiles = [
            path.join(projectDir, 'coverage.cobertura.xml'),
            path.join(projectDir, 'coverage.json'),
            path.join(projectDir, 'coverage.lcov'),
            path.join(projectDir, 'coverage', 'coverage.cobertura.xml'),
            path.join(projectDir, 'coverage', 'coverage.json')
        ];

        for (const coverageFile of coverageFiles) {
            if (fs.existsSync(coverageFile)) {
                await this.parseCoverageFile(coverageFile, format);
                break;
            }
        }
    }

    private async parseCoverageFile(filePath: string, format: string): Promise<void> {
        try {
            if (format === 'cobertura' || filePath.endsWith('.xml')) {
                await this.parseCoberturaReport(filePath);
            } else if (format === 'json' || filePath.endsWith('.json')) {
                await this.parseJsonReport(filePath);
            } else if (format === 'lcov' || filePath.endsWith('.lcov')) {
                await this.parseLcovReport(filePath);
            }
        } catch (error) {
            this.outputChannel.appendLine(`Error parsing coverage file: ${error}`);
        }
    }

    private async parseCoberturaReport(filePath: string): Promise<void> {
        const xml2js = require('xml2js') as typeof import('xml2js');
        const parser = new xml2js.Parser();
        const content = fs.readFileSync(filePath, 'utf8');
        
        const result = await parser.parseStringPromise(content);
        const coverage = result.coverage;
        
        if (coverage && coverage.packages) {
            const packages = Array.isArray(coverage.packages[0].package) 
                ? coverage.packages[0].package 
                : [coverage.packages[0].package];
            
            for (const pkg of packages) {
                if (pkg.classes && pkg.classes[0].class) {
                    const classes = Array.isArray(pkg.classes[0].class)
                        ? pkg.classes[0].class
                        : [pkg.classes[0].class];
                    
                    for (const cls of classes) {
                        const fileName = cls.$.filename;
                        const lineRate = parseFloat(cls.$.lineRate || '0');
                        
                        const coverageData: CoverageData = {
                            filePath: fileName,
                            coverage: lineRate * 100,
                            lines: []
                        };
                        
                        if (cls.lines && cls.lines[0].line) {
                            const lines = Array.isArray(cls.lines[0].line)
                                ? cls.lines[0].line
                                : [cls.lines[0].line];
                            
                            for (const line of lines) {
                                const lineNumber = parseInt(line.$.number);
                                const hits = parseInt(line.$.hits || '0');
                                coverageData.lines.push({
                                    line: lineNumber,
                                    covered: hits > 0
                                });
                            }
                        }
                        
                        this.coverageData.set(fileName, coverageData);
                    }
                }
            }
        }
    }

    private async parseJsonReport(filePath: string): Promise<void> {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Parse based on Coverlet JSON format
        if (data.modules) {
            for (const module of Object.values(data.modules) as any[]) {
                if (module.documents) {
                    for (const [filePath, doc] of Object.entries(module.documents)) {
                        const document = doc as any;
                        const coverageData: CoverageData = {
                            filePath: filePath,
                            coverage: (document.linecoverage || 0) * 100,
                            lines: []
                        };
                        
                        if (document.lines) {
                            for (const [lineNum, lineData] of Object.entries(document.lines)) {
                                const line = lineData as any;
                                coverageData.lines.push({
                                    line: parseInt(lineNum),
                                    covered: (line.usages || 0) > 0
                                });
                            }
                        }
                        
                        this.coverageData.set(filePath, coverageData);
                    }
                }
            }
        }
    }

    private async parseLcovReport(filePath: string): Promise<void> {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        let currentFile = '';
        let currentCoverage: CoverageData | null = null;
        
        for (const line of lines) {
            if (line.startsWith('SF:')) {
                currentFile = line.substring(3);
                currentCoverage = {
                    filePath: currentFile,
                    coverage: 0,
                    lines: []
                };
            } else if (line.startsWith('DA:') && currentCoverage) {
                const match = line.match(/^DA:(\d+),(\d+)$/);
                if (match) {
                    const lineNum = parseInt(match[1]);
                    const hits = parseInt(match[2]);
                    currentCoverage.lines.push({
                        line: lineNum,
                        covered: hits > 0
                    });
                }
            } else if (line === 'end_of_record' && currentCoverage) {
                if (currentCoverage.lines.length > 0) {
                    const covered = currentCoverage.lines.filter(l => l.covered).length;
                    currentCoverage.coverage = (covered / currentCoverage.lines.length) * 100;
                }
                this.coverageData.set(currentFile, currentCoverage);
                currentCoverage = null;
            }
        }
    }

    private visualizeCoverage(): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const filePath = editor.document.uri.fsPath;
        const coverage = this.coverageData.get(filePath);
        
        if (!coverage) {
            return;
        }

        const coveredRanges: vscode.Range[] = [];
        const uncoveredRanges: vscode.Range[] = [];

        for (const lineInfo of coverage.lines) {
            const line = editor.document.lineAt(lineInfo.line - 1);
            const range = new vscode.Range(line.range.start, line.range.end);
            
            if (lineInfo.covered) {
                coveredRanges.push(range);
            } else {
                uncoveredRanges.push(range);
            }
        }

        editor.setDecorations(this.coverageDecorations.covered, coveredRanges);
        editor.setDecorations(this.coverageDecorations.uncovered, uncoveredRanges);
    }

    getOverallCoverage(): number {
        if (this.coverageData.size === 0) {
            return 0;
        }

        let totalCoverage = 0;
        for (const coverage of this.coverageData.values()) {
            totalCoverage += coverage.coverage;
        }

        return totalCoverage / this.coverageData.size;
    }

    getCoverageForFile(filePath: string): CoverageData | undefined {
        return this.coverageData.get(filePath);
    }

    getAllCoverage(): Map<string, CoverageData> {
        return this.coverageData;
    }

    dispose(): void {
        this.coverageDecorations.covered.dispose();
        this.coverageDecorations.uncovered.dispose();
    }
}

