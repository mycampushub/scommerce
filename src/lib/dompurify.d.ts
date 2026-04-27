declare module 'dompurify' {
  namespace DOMPurify {
    interface Config {
      ALLOWED_TAGS?: string[];
      ALLOWED_ATTR?: string[];
      FORBID_TAGS?: string[];
      FORBID_ATTR?: string[];
      FORCE_BODY?: boolean;
      SANITIZE_DOM?: boolean;
      KEEP_CONTENT?: boolean;
      [key: string]: unknown;
    }
  }

  interface DOMPurify {
    sanitize: (dirty: string, config?: DOMPurify.Config) => string;
    addHook: (hook: string, fn: (node: any, data: any) => void) => void;
    removeHook: (hook: string) => void;
    removeAllHooks: () => void;
  }

  const DOMPurify: DOMPurify;
  export default DOMPurify;
}
