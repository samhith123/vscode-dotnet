import * as vscode from 'vscode';
import { ProjectDetector } from './projectDetector';
import { DotNetCli } from './utils/dotnetCli';

export interface TestResult {
    name: string;
    outcome: 'Passed' | 'Failed' | 'Skipped';
    duration?: number;
    errorMessage?: string;
    stackTrace?: string;
}

export class TestRunner {
    private testResults: Map<string, TestResult[]> = new Map();
    private readonly onTestResultsChangedEmitter = new vscode.EventEmitter<void>();
    public readonly onTestResultsChanged = this.onTestResultsChangedEmitter.event;

    constructor(
        public readonly projectDetector: ProjectDetector,
        private dotnetCli: DotNetCli,
        private outputChannel: vscode.OutputChannel
    ) {}

    async discoverTests(projectPath: string): Promise<string[]> {
        try {
            const output = await this.dotnetCli.listTests(projectPath);
            // Parse test names from output
            const testNames: string[] = [];
            const lines = output.split('\n');
            
            for (const line of lines) {
                const match = line.match(/^\s*(\S+.*)$/);
                if (match && match[1].trim()) {
                    testNames.push(match[1].trim());
                }
            }
            
            return testNames;
        } catch (error) {
            this.outputChannel.appendLine(`Error discovering tests: ${error}`);
            return [];
        }
    }

    async runAllTests(): Promise<void> {
        const testProjects = this.projectDetector.getProjects().filter(p => p.isTestProject);
        
        if (testProjects.length === 0) {
            vscode.window.showWarningMessage(
                'No test projects found in workspace. Ensure your test projects reference a test framework (xUnit, NUnit, or MSTest).'
            );
            return;
        }

        this.outputChannel.show(true);
        this.outputChannel.appendLine(`Running tests in ${testProjects.length} test project(s)...`);

        let hasErrors = false;
        for (const project of testProjects) {
            try {
                await this.runTestsForProject(project.path);
            } catch (error: any) {
                hasErrors = true;
                const errorMsg = error.message || String(error);
                this.outputChannel.appendLine(`Error running tests in ${project.name}: ${errorMsg}`);
            }
        }

        if (hasErrors) {
            vscode.window.showWarningMessage('Some tests failed to run. Check output for details.');
        }

        const summary = this.getTestSummary();
        if (summary.total > 0) {
            const message = `Tests completed: ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped`;
            this.outputChannel.appendLine(message);
            if (summary.failed > 0) {
                vscode.window.showWarningMessage(message);
            } else {
                vscode.window.showInformationMessage(message);
            }
        }

        this.onTestResultsChangedEmitter.fire();
    }

    async runTestsForProject(projectPath: string, testFilter?: string): Promise<TestResult[]> {
        try {
            this.outputChannel.appendLine(`Running tests in: ${projectPath}`);
            
            const output = await this.dotnetCli.runTests(projectPath, testFilter);
            const results = this.parseTestResults(output);
            
            this.testResults.set(projectPath, results);
            this.onTestResultsChangedEmitter.fire();
            
            return results;
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to run tests';
            this.outputChannel.appendLine(`Error: ${errorMessage}`);
            vscode.window.showErrorMessage(`Error running tests: ${errorMessage}`);
            return [];
        }
    }

    private parseTestResults(output: string): TestResult[] {
        const results: TestResult[] = [];
        const lines = output.split('\n');
        
        let currentTest: Partial<TestResult> | null = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Look for test result patterns
            if (line.includes('Passed!') || line.match(/^\s*✓\s+/)) {
                if (currentTest) {
                    currentTest.outcome = 'Passed';
                    results.push(currentTest as TestResult);
                    currentTest = null;
                }
            } else if (line.includes('Failed!') || line.match(/^\s*✗\s+/)) {
                if (currentTest) {
                    currentTest.outcome = 'Failed';
                    results.push(currentTest as TestResult);
                    currentTest = null;
                }
            } else if (line.includes('Skipped')) {
                if (currentTest) {
                    currentTest.outcome = 'Skipped';
                    results.push(currentTest as TestResult);
                    currentTest = null;
                }
            } else if (line.match(/^\s*Test Name:\s*(.+)$/i)) {
                const match = line.match(/^\s*Test Name:\s*(.+)$/i);
                if (match) {
                    currentTest = { name: match[1].trim() };
                }
            } else if (line.match(/^\s*Test Method:\s*(.+)$/i)) {
                const match = line.match(/^\s*Test Method:\s*(.+)$/i);
                if (match && currentTest && !currentTest.name) {
                    currentTest.name = match[1].trim();
                }
            } else if (line.match(/^\s*Duration:\s*(.+)$/i)) {
                const match = line.match(/^\s*Duration:\s*(.+)$/i);
                if (match && currentTest) {
                    const durationStr = match[1].trim();
                    const durationMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*(ms|s)/);
                    if (durationMatch) {
                        const value = parseFloat(durationMatch[1]);
                        currentTest.duration = durationMatch[2] === 's' ? value * 1000 : value;
                    }
                }
            } else if (line.match(/^\s*Error Message:\s*(.+)$/i)) {
                const match = line.match(/^\s*Error Message:\s*(.+)$/i);
                if (match && currentTest) {
                    currentTest.errorMessage = match[1].trim();
                }
            } else if (line.match(/^\s*Stack Trace:/i)) {
                if (currentTest) {
                    const stackTraceLines: string[] = [];
                    for (let j = i + 1; j < lines.length && j < i + 20; j++) {
                        if (lines[j].trim()) {
                            stackTraceLines.push(lines[j]);
                        } else {
                            break;
                        }
                    }
                    currentTest.stackTrace = stackTraceLines.join('\n');
                }
            }
        }

        // If we have a summary line, parse it
        const summaryMatch = output.match(/(\d+)\s+passed[,\s]+(\d+)\s+failed[,\s]+(\d+)\s+skipped/i);
        if (summaryMatch) {
            // Results already parsed above
        }

        return results;
    }

    getTestResults(projectPath?: string): TestResult[] {
        if (projectPath) {
            return this.testResults.get(projectPath) || [];
        }
        
        // Return all results
        const allResults: TestResult[] = [];
        for (const results of this.testResults.values()) {
            allResults.push(...results);
        }
        return allResults;
    }

    getTestSummary(): { passed: number; failed: number; skipped: number; total: number } {
        const allResults = this.getTestResults();
        const passed = allResults.filter(r => r.outcome === 'Passed').length;
        const failed = allResults.filter(r => r.outcome === 'Failed').length;
        const skipped = allResults.filter(r => r.outcome === 'Skipped').length;
        
        return {
            passed,
            failed,
            skipped,
            total: allResults.length
        };
    }
}

