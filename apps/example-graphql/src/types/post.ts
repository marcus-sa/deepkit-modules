import { entity, PrimaryKey, Reference, uuid, UUID } from '@deepkit/type';

import { User } from './user';

@entity.name('post')
export class Post {
  readonly id: UUID & PrimaryKey = uuid();
  readonly author: User & Reference;
}
