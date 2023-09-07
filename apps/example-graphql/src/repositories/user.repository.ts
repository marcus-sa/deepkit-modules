import { DatabaseQueryModel } from '@deepkit/orm';

import { Database } from '../db';
import { Post, User } from '../types';

export class UserRepository {
  constructor(private readonly db: Database) {}

  async findOne(filter: DatabaseQueryModel<User>['filter']): Promise<User> {
    return await this.db.query(User).filter(filter).findOne();
  }

  async findOneByPost(post: Post): Promise<User> {
    return await this.findOne({ posts: [post] });
  }
}
