import {config} from '@notifications/config';
import {AppLogger} from '@notifications/utils/logger';
import {RedisClient} from '@hiep20012003/joblance-shared';

export class CacheStore extends RedisClient {

}

export const cacheStore = new CacheStore(config.REDIS_URL, AppLogger);
