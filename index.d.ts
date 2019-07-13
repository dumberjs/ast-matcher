export = astMatcher;

interface MatchedResult {
  match: any,
  node: any
}

declare function astMatcher(pattern: string | any): ((code: string | any) => MatchedResult[] | undefined);

declare namespace astMatcher {
  export function depFinder(...patterns: string[]): ((code: string | any) => string[]);
  export function setParser(parser: ((code: string) => any)): void;
}
