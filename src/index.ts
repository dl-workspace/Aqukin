require("dotenv").config();
import { connectRedis } from "./cache/client";
import { ExtendedClient } from "./models/client";

declare global {
  interface Array<T> {
    random(): T;
    standardDeviation(): Promise<number>;
  }
}

Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)];
};

Array.prototype.standardDeviation = async function () {
  const n = this.length;
  const mean = (await this.reduce((a, b) => a + b)) / n;
  return Math.sqrt(
    this.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
};

const client = new ExtendedClient();

(async () => {
  await connectRedis();
  client.start();
})();

export { client };
