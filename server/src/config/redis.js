import { Redis } from "@upstash/redis";

let redisClient;

const getRedisClient = () => {
    if (!redisClient) {
        redisClient = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    }
    return redisClient;
};

export default getRedisClient;
