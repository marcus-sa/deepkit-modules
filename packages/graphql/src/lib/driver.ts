import { GraphQLSchema } from 'graphql';

export abstract class Driver {
  async start(schema: GraphQLSchema): Promise<void> {
    throw new Error('Not yet implemented');
  }

  async stop(): Promise<void> {
    throw new Error('Not yet implemented');
  }
}
