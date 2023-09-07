import { composePlugins, withNx } from '@nx/webpack';

import { withDeepkit } from '../with-deepkit';

// eslint-disable-next-line import/no-default-export
export default composePlugins(withNx(), withDeepkit());
