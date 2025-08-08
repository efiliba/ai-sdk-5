import Redis from "ioredis";

import { ClearRedisButton } from "@/app/components";

const redis = new Redis(process.env.REDIS_URL!);

export default async function RedisPage() {
  const keys = await redis.keys("*");

  const data = await Promise.all(
    keys.map(async (key) => ({ key, value: await redis.get(key) }))
  );

  // Helper function to safely parse JSON or return as string
  const formatValue = (value: string | null) => {
    if (!value) return "null";
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If it's not valid JSON, return as plain string
      return value;
    }
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-[1fr_max-content] gap-x-2 mb-4">
        <h1 className="text-2xl font-bold">Redis Data</h1>
        <ClearRedisButton />
      </div>
      <div>
        <h2 className="text-lg font-semibold">
          Key-Value Pairs: ({data.length} keys)
        </h2>
        <div className="space-y-2">
          {data.map(({ key, value }) => (
            <div key={key} className="border p-2 rounded">
              <strong>Key:</strong> {key}
              <br />
              <strong>Value:</strong> {formatValue(value)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
