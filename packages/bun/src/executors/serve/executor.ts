import * as path from 'node:path';
import { ChildProcess, spawn } from 'node:child_process';
import {randomUUID} from 'node:crypto'
import { assert } from '@deepkit/type';
import type { ExecutorContext, ProjectGraphProjectNode } from '@nx/devkit';
import { joinPathFragments, logger, parseTargetString, readTargetOptions, runExecutor } from '@nx/devkit';
import { getRelativeDirectoryToProjectRoot } from '@nx/js/src/utils/get-main-file-dir';
import { fileExists } from 'nx/src/utils/fileutils';
import { calculateProjectBuildableDependencies } from '@nx/js/src/utils/buildable-libs-utils';
import { createAsyncIterable } from '@nx/devkit/src/utils/async-iterable';
import { debounce } from 'radash';
import { killTree } from '@nx/js/src/executors/node/lib/kill-tree';

import { ServeExecutorSchema } from './schema';

interface ActiveTask {
  id: string;
  killed: boolean;
  promise: Promise<void> | null;
  childProcess: null | ChildProcess;
  start: () => Promise<void>;
  stop: (signal: NodeJS.Signals) => Promise<void>;
}

export default async function *serveExecutor(
  options: ServeExecutorSchema,
  context: ExecutorContext,
) {
  assert<ServeExecutorSchema>(options);

  const project = context.projectGraph!.nodes[context.projectName!];

  const buildTarget = parseTargetString(options.buildTarget, context.projectGraph!);
  if (!project.data.targets![buildTarget.target]) {
    throw new Error(
      `Cannot find build target ${options.buildTarget} for project ${context.projectName}`
    );
  }

  const buildTargetExecutor =
    project.data.targets![buildTarget.target]?.executor;
  if (!buildTargetExecutor) {
    throw new Error('Missing executor')
  }

  const buildOptions: ServeExecutorSchema = {
    ...readTargetOptions(buildTarget, context),
    ...options.buildTargetOptions,
  };

  // Re-map buildable workspace projects to their output directory.
  const mappings = calculateResolveMappings(context, options);
  const fileToRun = getFileToRun(
    context,
    project,
    buildOptions,
    buildTargetExecutor
  );

  let currentTask: ActiveTask | undefined;
  const tasks: ActiveTask[] = [];

  yield* createAsyncIterable<{
    success: boolean;
    options?: Record<string, any>;
  }>(async ({ done, next }) => {
    const processQueue = async () => {
      if (tasks.length === 0) return;

      const previousTask = currentTask;
      const task = tasks.shift();
      currentTask = task;
      await previousTask?.stop('SIGTERM');
      await task?.start();
    };

    const debouncedProcessQueue = debounce(
      { delay: options.debounce ?? 1_000 },
      processQueue,
    );

    const addToQueue = async (
      childProcess: null | ChildProcess,
      buildResult: Promise<{ success: boolean }>
    ) => {
      const task: ActiveTask = {
        id: randomUUID(),
        killed: false,
        childProcess,
        promise: null,
        start: async () => {
          // Wait for build to finish.
          const result = await buildResult;

          if (!result.success) {
            // If in watch-mode, don't throw or else the process exits.
            if (options.watch) {
              if (!task.killed) {
                // Only log build error if task was not killed by a new change.
                logger.error(`Build failed, waiting for changes to restart...`);
              }
              return;
            } else {
              throw new Error(`Build failed. See above for errors.`);
            }
          }

          // Before running the program, check if the task has been killed (by a new change during watch).
          if (task.killed) return;

          // Run the program
          task.promise = new Promise<void>((resolve) => {
            task.childProcess = spawn('bun',
              ['run', require.resolve('@nx/js/src/executors/node/node-with-require-overrides'), ...getExecArgv(options)],
              {
                stdio: [0, 1, 'pipe', 'ipc'],
                env: {
                  ...process.env,
                  NX_FILE_TO_RUN: fileToRunCorrectPath(fileToRun),
                  NX_MAPPINGS: JSON.stringify(mappings),
                },
              }
            );

            const handleStdErr = (data: any) => {
              // Don't log out error if task is killed and new one has started.
              // This could happen if a new build is triggered while new process is starting, since the operation is not atomic.
              // Log the error in normal mode
              if (!options.watch || !task.killed) {
                logger.error(data.toString());
              }
            };
            task.childProcess.stderr?.on('data', handleStdErr);
            task.childProcess.once('exit', (code) => {
              task.childProcess?.off('data', handleStdErr);
              if (options.watch && !task.killed) {
                logger.info(
                  `NX Process exited with code ${code}, waiting for changes to restart...`
                );
              }
              if (!options.watch) done();
              resolve();
            });

            next({ success: true, options: buildOptions });
          });
        },
        stop: async (signal = 'SIGTERM') => {
          task.killed = true;
          // Request termination and wait for process to finish gracefully.
          // NOTE: `childProcess` may not have been set yet if the task did not have a chance to start.
          // e.g. multiple file change events in a short time (like git checkout).
          if (task.childProcess) {
            await killTree(task.childProcess.pid!, signal);
          }
          try {
            await task.promise;
          } catch {
            // Doesn't matter if task fails, we just need to wait until it finishes.
          }
        },
      };

      tasks.push(task);
    };

    const output = await runExecutor(
      buildTarget,
      {
        ...options.buildTargetOptions,
        watch: options.watch,
      },
      context
    );
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const event = await output.next();
      await addToQueue(null, Promise.resolve(event.value));
      await debouncedProcessQueue();
      if (event.done || !options.watch) {
        break;
      }
    }

    const stopAllTasks = (signal: Signal = 'SIGTERM') => {
      for (const task of tasks) {
        task.stop(signal);
      }
    };

    process.on('SIGTERM', async () => {
      stopAllTasks('SIGTERM');
      process.exit(128 + 15);
    });
    process.on('SIGINT', async () => {
      stopAllTasks('SIGINT');
      process.exit(128 + 2);
    });
    process.on('SIGHUP', async () => {
      stopAllTasks('SIGHUP');
      process.exit(128 + 1);
    });
  });
}

function getExecArgv(options: ServeExecutorSchema): readonly string[] {
  const args = (options.args || []) as string[];
  args.push('-r', require.resolve('source-map-support/register'));

  if (options.watch) {
    args.push('--watch');
  }

  if (options.hot) {
    args.push('--hot');
  }

  /*if (options.buildTarget) {
    args.push('--tsconfig-override')
  }*/

  return args;
}

function calculateResolveMappings(
  context: ExecutorContext,
  options: ServeExecutorSchema
): Record<string, string> {
  const parsed = parseTargetString(options.buildTarget, context.projectGraph!);
  const { dependencies } = calculateProjectBuildableDependencies(
    context.taskGraph,
    context.projectGraph!,
    context.root,
    parsed.project,
    parsed.target,
    parsed.configuration!
  );
  return dependencies.reduce<Record<string, string>>((m, c) => {
    if (c.node.type !== 'npm' && c.outputs[0] != null) {
      m[c.name] = joinPathFragments(context.root, c.outputs[0]);
    }
    return m;
  }, {});
}

function getFileToRun(
  context: ExecutorContext,
  project: ProjectGraphProjectNode,
  buildOptions: Record<string, any>,
  buildTargetExecutor: string
): string {
  // If using run-commands or another custom executor, then user should set
  // outputFileName, but we can try the default value that we use.
  if (!buildOptions?.outputPath && !buildOptions?.outputFileName) {
    const fallbackFile = path.join('dist', project.data.root, 'main.js');
    logger.warn(
      `Build option outputFileName not set for ${project.name}. Using fallback value of ${fallbackFile}.`
    );
    return path.join(context.root, fallbackFile);
  }

  let outputFileName = buildOptions.outputFileName;

  if (!outputFileName) {
    const fileName = `${path.parse(buildOptions.main).name}.js`;
    if (
      buildTargetExecutor === '@nx/js:tsc' ||
      buildTargetExecutor === '@nx/js:swc' ||
      buildTargetExecutor.endsWith('bun:build')
    ) {
      outputFileName = path.join(
        getRelativeDirectoryToProjectRoot(buildOptions.main, project.data.root),
        fileName
      );
    } else {
      outputFileName = fileName;
    }
  }

  return path.join(context.root, buildOptions.outputPath, outputFileName);
}

function fileToRunCorrectPath(fileToRun: string): string {
  if (fileExists(fileToRun)) return fileToRun;

  const extensionsToTry = ['.cjs', '.mjs', 'cjs.js', '.esm.js'];

  for (const ext of extensionsToTry) {
    const file = fileToRun.replace(/\.js$/, ext);
    if (fileExists(file)) return file;
  }

  throw new Error(
    `Could not find ${fileToRun}. Make sure your build succeeded.`
  );
}
