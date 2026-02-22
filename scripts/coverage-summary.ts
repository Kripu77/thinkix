import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface CoverageData {
  lines: { total: number; covered: number; percentage: number };
  functions: { total: number; covered: number; percentage: number };
  branches: { total: number; covered: number; percentage: number };
  statements: { total: number; covered: number; percentage: number };
}

function parseCoverageFinal(filePath: string): CoverageData {
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  let totalLines = 0, coveredLines = 0;
  let totalFunctions = 0, coveredFunctions = 0;
  let totalBranches = 0, coveredBranches = 0;
  let totalStatements = 0, coveredStatements = 0;

  for (const file of Object.values(data) as any[]) {
    if (file.l) {
      totalLines += Object.keys(file.l).length;
      coveredLines += Object.values(file.l).filter((v: any) => v > 0).length;
    }
    if (file.f) {
      totalFunctions += Object.keys(file.f).length;
      coveredFunctions += Object.values(file.f).filter((v: any) => v > 0).length;
    }
    if (file.b) {
      for (const branch of Object.values(file.b) as any[][]) {
        totalBranches += branch.length;
        coveredBranches += branch.filter((v: any) => v > 0).length;
      }
    }
    if (file.s) {
      totalStatements += Object.keys(file.s).length;
      coveredStatements += Object.values(file.s).filter((v: any) => v > 0).length;
    }
  }

  return {
    lines: {
      total: totalLines,
      covered: coveredLines,
      percentage: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100 * 100) / 100 : 0
    },
    functions: {
      total: totalFunctions,
      covered: coveredFunctions,
      percentage: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100 * 100) / 100 : 0
    },
    branches: {
      total: totalBranches,
      covered: coveredBranches,
      percentage: totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100 * 100) / 100 : 0
    },
    statements: {
      total: totalStatements,
      covered: coveredStatements,
      percentage: totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100 * 100) / 100 : 0
    }
  };
}

const coveragePath = join(process.cwd(), 'coverage', 'coverage-final.json');
const summary = parseCoverageFinal(coveragePath);
const outputPath = join(process.cwd(), 'coverage', 'coverage-summary.json');
writeFileSync(outputPath, JSON.stringify(summary, null, 2));
console.log('Coverage summary generated:', summary);
