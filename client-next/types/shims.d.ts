// Minimal shims for JS packages without TypeScript types

declare module 'kuroshiro' {
  export default class Kuroshiro {
    init(analyzer?: any): Promise<void>;
    convert(input: string, options?: any): Promise<string>;
  }
}

declare module 'kuroshiro-analyzer-kuromoji' {
  export default class KuromojiAnalyzer {
    constructor(options?: any);
  }
}

declare module 'hangul-romanization' {
  export function convert(input: string): string;
}


