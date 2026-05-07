declare module 'better-sqlite3' {
  interface Database {
    prepare(sql: string): Statement
    exec(sql: string): void
    close(): void
    transaction(fn: (...args: unknown[]) => unknown): (...args: unknown[]) => unknown
    pragma(name: string): any
  }

  interface Statement {
    run(...params: any[]): RunResult
    get(...params: any[]): any
    all(...params: any[]): any[]
    bind(...params: any[]): Statement
  }

  interface RunResult {
    changes: number
    lastInsertRowid: number
  }

  interface Options {
    readonly?: boolean
    fileMustExist?: boolean
    timeout?: number
    verbose?: (...args: unknown[]) => void
  }

  interface DatabaseConstructor {
    new (filename: string, options?: Options): Database
  }

  const Database: DatabaseConstructor
  export default Database
}
