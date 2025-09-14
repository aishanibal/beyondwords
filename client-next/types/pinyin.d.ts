declare module 'pinyin' {
  interface Options { style?: any }
  type PinyinResult = string[][];
  function pinyin(input: string, options?: Options): PinyinResult;
  namespace pinyin {
    const STYLE_TONE: any;
  }
  export = pinyin;
}


