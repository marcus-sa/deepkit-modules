import { DatabaseQueryModel } from '@deepkit/orm';

import { Database } from '../db';
import { Post, User } from '../types';

export class PostRepository {
  constructor(private readonly db: Database) {}

  async findOne(filter: DatabaseQueryModel<Post>['filter']): Promise<Post> {
    return await this.db.query(Post).filter(filter).findOne();
  }

  async find(
    filter: DatabaseQueryModel<Post>['filter'],
  ): Promise<readonly Post[]> {
    return await this.db.query(Post).filter(filter).find();
  }

  async findByAuthor(author: User): Promise<readonly Post[]> {
    return await this.find({ author });
  }
}
