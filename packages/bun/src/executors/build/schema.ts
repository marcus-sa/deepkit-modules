export type Target = 'browser' | 'bun' | 'node';

export type Sourcemap = 'inline' | 'external' | 'none';

export interface BuildExecutorSchema {
  readonly main: string;
  readonly outputPath: string;
  readonly sourcemap?: Sourcemap;
  readonly splitting?: boolean;
  readonly bundle?: boolean;
  // readonly entryNaming?: string;
  // readonly chunkNaming?: string;
  // readonly assetNaming?: string;
  readonly inspect?: boolean;
  readonly target?: Target;
  readonly watch?: boolean;
  readonly tsConfig?: string;
  readonly minify?: boolean;
  readonly smol?: boolean;
  readonly external?: readonly string[];
  readonly define?: Record<string, string>;
}
