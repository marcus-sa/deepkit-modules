import { graphql, Parent } from '@deepkitx/graphql';

import { User } from '../types';
import { Database } from '../db';
import { PostRepository, UserRepository } from '../repositories';

export interface CreateUserArgs {
  readonly username: string;
}

@graphql.resolver<User>()
export class UserResolver {
  constructor(
    private readonly db: Database,
    private readonly user: UserRepository,
    private readonly post: PostRepository,
  ) {}

  @graphql.resolveField()
  async posts(parent: Parent<User>): Promise<User['posts']> {
    return await this.post.findByAuthor(parent);
  }

  @graphql.mutation()
  async createUser(args: CreateUserArgs): Promise<User> {
    const user = User.create(args);

    await this.db.persist(user);

    return await this.user.findOne(user);
  }
}
