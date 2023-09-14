export type BuildTarget = `${string}:${string}` | `${string}:${string}:${string}`;

export interface ServeExecutorSchema {
  readonly buildTarget: BuildTarget;
  readonly buildTargetOptions?: Record<string, any>;
  readonly debounce?: number;
  readonly args?: readonly string[];
  readonly watch?: boolean;
  readonly hot?: boolean;
}
