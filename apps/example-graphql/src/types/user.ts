import {
  BackReference,
  cast,
  entity,
  PrimaryKey,
  uuid,
  UUID,
} from '@deepkit/type';

import { Post } from './post';

@entity.name('user')
export class User {
  readonly id: UUID & PrimaryKey = uuid();

  readonly posts?: readonly Post[] & BackReference;

  readonly username: string;

  readonly createdAt = new Date();

  static create(data: Pick<User, 'username'>): User {
    return cast<User>(data);
  }
}
