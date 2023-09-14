import { ExecutorContext, logger } from '@nx/devkit';
import * as childProcess from 'node:child_process';
import { assert } from '@deepkit/type';
import { promisify } from 'node:util';

import { BuildExecutorSchema } from './schema';

const exec = promisify(childProcess.exec);

export default async function buildExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext,
) {
  assert<BuildExecutorSchema>(options);

  const args = getExecArgs(options);

  const result = await exec(`bun build ${options.main} ${args.join(' ')}`);
  if (result.stderr) {
    logger.error(result.stderr);
  } else {
    logger.log(result.stdout)
  }

  return { success: !result.stderr };
}

function getExecArgs({
                       outputPath, tsConfig, bundle, main, ...options }: BuildExecutorSchema): readonly string[] {
  const args: string[] = [
    `--outdir=${outputPath}`,
    `--tsconfig-override=${tsConfig}`,
  ];

  if (bundle === false) {
    args.push('--no-bundle');
  }

  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      value.forEach(value => args.push(`--${key}="${value}"`))
      continue;
    }

    if (typeof value !== 'boolean') {
      args.push(`--${key}="${value}"`);
    } else if (value) {
      args.push(`--${key}`);
    }
  }

  return args;
}
