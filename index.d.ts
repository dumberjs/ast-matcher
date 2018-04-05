export = astMatcher;
export as namespace astMatcher;

interface MatchedResult {
  match: any,
  node: any
}

declare function astMatcher(pattern: string | any): ((code: string | any) => MatchedResult[] | undefined);

declare namespace astMatcher {
  function depFinder(...patterns: string[]): ((code: string | any) => string[]);
  function setParser(parser: ((code: string) => any)): void;
}
