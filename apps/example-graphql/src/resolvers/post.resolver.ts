import { graphql } from '@deepkitx/graphql';

import { Post } from '../types';

@graphql.resolver<Post>()
export class PostResolver{}
