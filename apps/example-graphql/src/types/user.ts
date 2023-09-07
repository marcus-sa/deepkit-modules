import { BackReference, entity, PrimaryKey, uuid, UUID } from '@deepkit/type';

import { Post } from './post';

@entity.name('user')
export class User {
  readonly id: UUID & PrimaryKey = uuid();
  readonly posts?: readonly Post[] & BackReference;
}
