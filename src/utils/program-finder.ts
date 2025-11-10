import * as fs from 'fs';
import * as path from 'path';
import { RAConfig, ProgramInfo } from '../types';

export async function findPrograms(
  config: RAConfig,
  specificProgram?: string
): Promise<ProgramInfo[]> {
  const artifactsPath = config.paths?.artifacts || './target';
  const deployPath = path.join(artifactsPath, 'deploy');
  const idlPath = path.join(artifactsPath, 'idl');

  if (!fs.existsSync(deployPath)) {
    throw new Error(`Deploy directory not found: ${deployPath}`);
  }

  const files = fs.readdirSync(deployPath);
  const programs: ProgramInfo[] = [];

  for (const file of files) {
    if (file.endsWith('.so')) {
      const programName = file.replace('.so', '');
      
      if (specificProgram && programName !== specificProgram) {
        continue;
      }

      const keypairFile = file.replace('.so', '-keypair.json');
      const keypairPath = path.join(deployPath, keypairFile);

      if (!fs.existsSync(keypairPath)) {
        console.warn(`⚠️  Keypair not found for ${programName}, skipping...`);
        continue;
      }

      const idlFile = path.join(idlPath, `${programName}.json`);

      programs.push({
        name: programName,
        soPath: path.join(deployPath, file),
        keypairPath,
        idlPath: fs.existsSync(idlFile) ? idlFile : undefined,
      });
    }
  }

  if (programs.length === 0) {
    const msg = specificProgram
      ? `Program "${specificProgram}" not found`
      : 'No programs found to deploy';
    throw new Error(msg);
  }

  return programs;
}
