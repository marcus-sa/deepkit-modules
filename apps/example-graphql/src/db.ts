import { Database as ORM } from '@deepkit/orm';
import { PostgresDatabaseAdapter } from '@deepkit/postgres';
import { onServerMainBootstrap } from '@deepkit/framework';
import { eventDispatcher } from '@deepkit/event';

import { Config } from './config';
import { Post, User } from './types';

export class Database extends ORM {
  constructor(config: Config) {
    const adapter = new PostgresDatabaseAdapter({
      connectionString: config.pgConnectionString,
    });
    super(adapter, [User, Post]);
  }

  @eventDispatcher.listen(onServerMainBootstrap)
  async onServerMainBootstrap(): Promise<void> {
    await this.migrate();
  }
}
