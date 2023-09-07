import { graphql } from '@deepkitx/graphql';

import { User } from '../types';

@graphql.resolver<User>()
export class UserResolver {}
