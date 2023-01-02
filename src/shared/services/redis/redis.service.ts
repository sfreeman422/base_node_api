import ioredis, { Redis } from 'ioredis';
import { Logger } from '../logger/logger.service';

export class RedisService {
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }
  private logger = new Logger('redisService');
  private static instance: RedisService;
  private static redis: Redis = new ioredis().on('connect', () =>
    RedisService.getInstance().logger.info('Connected to Redis.'),
  );

  getValue(key: string): Promise<string | null> {
    return RedisService.redis.get(key);
  }

  setValue(key: string, value: string | number): Promise<string | null> {
    return RedisService.redis.set(key, value, 'KEEPTTL');
  }

  setValueWithExpireSeconds(key: string, value: string | number, seconds: number): Promise<string | null> {
    return RedisService.redis.set(key, value, 'EX', seconds);
  }

  getTimeRemaining(key: string): Promise<number> {
    return RedisService.redis.ttl(key);
  }

  expireSeconds(key: string, seconds: number): Promise<number> {
    return RedisService.redis.expire(key, seconds);
  }

  getPattern(pattern: string): Promise<string[]> {
    return RedisService.redis.keys(`*${pattern}*`);
  }

  removeKey(key: string) {
    return RedisService.redis.del(key);
  }
}
