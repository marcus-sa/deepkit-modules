import { cast, entity, PrimaryKey, Reference, uuid, UUID } from '@deepkit/type';

import { User } from './user';

@entity.name('post')
export class Post {
  readonly id: UUID & PrimaryKey = uuid();

  readonly title: string;

  readonly content: string;

  readonly author: User & Reference;

  readonly createdAt = new Date();

  static create(author: User, data: Pick<Post, 'title' | 'content'>): Post {
    return cast<Post>({ author, ...data });
  }
}
