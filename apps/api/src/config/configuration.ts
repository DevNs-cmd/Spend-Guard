// Central env config loader. Shared file — edit via PR only.
export default () => ({
  port: parseInt(process.env.PORT ?? "4000", 10),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
});
