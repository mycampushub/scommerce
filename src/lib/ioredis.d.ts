declare module 'ioredis' {
  class Redis {
    constructor(url: string, options?: any);
    get(key: string): Promise<string | null>;
    setex(key: string, seconds: number, value: string): Promise<'OK'>;
    del(...keys: string[]): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    on(event: string, handler: (error: Error) => void): void;
  }
  export default Redis;
}
