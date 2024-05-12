'use strict';
const test = require('tape');

const astMatcher = require('../index');
const extract = astMatcher.extract;
const compilePattern = astMatcher.compilePattern;
const depFinder = astMatcher.depFinder;

const extractTest = function(pattern, part) {
  return extract(compilePattern(pattern), compilePattern(part));
};

let checkedMissing;

module.exports = function (parserName, parser) {
  function testP(title, cb) {
    test('[' + parserName + '] ' + title, t => {
      astMatcher.setParser(parser);
      cb(t);
    });
  }

  if (!checkedMissing) {
    checkedMissing = true;

    test('missing parser throws error', t => {
      t.throws(() => astMatcher('a()'));
      t.end();
    });
  }

  testP('compilePattern understands extree node', t => {
    let node = parser('a = 1');
    t.equal(compilePattern(node).type, 'AssignmentExpression');
    t.end();
  });

  testP('compilePattern returns single expression node, unwrap ExpressionStatement', t => {
    let p = compilePattern('a');
    t.equal(p.type, 'Identifier');
    t.equal(p.name, 'a');
    t.end();
  });

  testP('compilePattern rejects multi statements', t => {
    t.throws(() => compilePattern('a; b = 1'));
    t.end();
  });

  testP('compilePattern rejects empty pattern', t => {
    t.throws(() => compilePattern('// nope'));
    t.end();
  });

  testP('compilePattern rejects syntax err', t => {
    t.throws(() => compilePattern('a+'));
    t.end();
  });

  testP('extract bare term has limited support', t => {
    t.deepEqual(extractTest('__any', 'a(foo)'), {});
    t.equal(extractTest('__anl', 'foo,bar'), false);
    t.deepEqual(extractTest('(__str)', '("foo")'), {});
    t.deepEqual(extractTest('(__str_a)', '("foo")'), {a: 'foo'});
    t.end();
  });

  testP('extract __any matches any node but no extract', t => {
    t.deepEqual(extractTest('a(__any)', 'a(foo)'), {});
    t.deepEqual(extractTest('a(__any)', 'a("foo")'), {});
    t.deepEqual(extractTest('a(__any,__any)', 'a("foo", "bar")'), {});
      t.end();
  });

  testP('extract __any_name matches any node', t => {
    let r = extractTest('a(__any_a)', 'a(foo)');
    t.deepEqual(Object.keys(r), ['a']);
    t.equal(r.a.type, 'Identifier');
    t.equal(r.a.name, 'foo');

    r = extractTest('a(__any_a)', 'a("foo")');
    t.deepEqual(Object.keys(r), ['a']);
    t.ok(['Literal', 'StringLiteral'].includes(r.a.type));
    t.equal(r.a.value, 'foo');

    r = extractTest('a(__any_a,__any_b)', 'a("foo", "bar")');
    t.deepEqual(Object.keys(r).sort(), ['a', 'b']);
    t.ok(['Literal', 'StringLiteral'].includes(r.a.type));
    t.equal(r.a.value, 'foo');
    t.ok(['Literal', 'StringLiteral'].includes(r.b.type));
    t.equal(r.b.value, 'bar');
    t.end();
  });

  testP('extract __anl matches nodes array, but no extract', t => {
    let r = extractTest('a(__anl)', 'a(foo, bar)');
    t.deepEqual(r, {});
    r = extractTest('a([__anl])', 'a(foo, bar)');
    t.equal(r, false);

    r = extractTest('a([__anl])', 'a(foo, bar)');
    t.equal(r, false);
    r = extractTest('a([__anl])', 'a([foo, bar])');
    t.deepEqual(r, {});
    t.end();
  });

  testP('extract __anl_name matches nodes array', t => {
    let r = extractTest('a(__anl_a)', 'a(foo, bar)');
    t.deepEqual(Object.keys(r), ['a']);
    t.equal(r.a.length, 2);
    t.equal(r.a[0].type, 'Identifier');
    t.equal(r.a[0].name, 'foo');
    t.equal(r.a[1].type, 'Identifier');
    t.equal(r.a[1].name, 'bar');

    r = extractTest('a(__anl_a)', 'a([foo, bar])');
    t.deepEqual(Object.keys(r), ['a']);
    t.equal(r.a.length, 1);
    t.equal(r.a[0].type, 'ArrayExpression');
    t.end();
  });

  testP('extract __anl_name matches nodes array case2', t => {
    let r = extractTest('a([__anl_a])', 'a([foo, bar])');
    t.deepEqual(Object.keys(r), ['a']);
    t.equal(r.a.length, 2);
    t.equal(r.a[0].type, 'Identifier');
    t.equal(r.a[0].name, 'foo');
    t.equal(r.a[1].type, 'Identifier');
    t.equal(r.a[1].name, 'bar');

    r = extractTest('a([__anl_a])', 'a(foo, bar)');
    t.equal(r, false);
    t.end();
  });

  testP('extract extracts matching string literal', t => {
    t.equal(extractTest('a(__str_a)', 'a(foo)'), false);
    t.deepEqual(extractTest('a(__str_a)', 'a("foo")'), {a: 'foo'});
    t.deepEqual(extractTest('a(__str_a,__str_b)', 'a("foo", "bar")'), {a: 'foo', b: 'bar'});
      t.end();
  });

  testP('extract matches string literal', t => {
    t.equal(extractTest('a(__str)', 'a(foo)'), false);
    t.deepEqual(extractTest('a(__str)', 'a("foo")'), {});
    t.deepEqual(extractTest('a(__str,__str)', 'a("foo", "bar")'), {});
    t.end();
  });

  testP('extract extracts matching array string literal', t => {
    t.equal(extractTest('a(__arr_a)', 'a(["foo", "bar"])'), false);
    t.deepEqual(extractTest('a(__arr_a)', 'a("foo", "bar")'), {a: ['foo', 'bar']});

    t.deepEqual(extractTest('a([__arr_a])', 'a(["foo", "bar"])'), {a: ['foo', 'bar']});
    t.equal(extractTest('a([__arr_a])', 'a("foo", "bar")'), false);

    t.deepEqual(extractTest('a([__arr_a])', 'a(["foo", partial, literal, arr, "bar"])'), {a: ['foo', 'bar']});
    t.equal(extractTest('a([__arr_a])', 'a([no, literal, arr])'), false);
    t.end();
  });

  testP('extract matches array string literal', t => {
    t.equal(extractTest('a(__arr)', 'a(["foo", "bar"])'), false);
    t.deepEqual(extractTest('a(__arr)', 'a("foo", "bar")'), {});

    t.deepEqual(extractTest('a([__arr])', 'a(["foo", "bar"])'), {});
    t.equal(extractTest('a([__arr])', 'a("foo", "bar")'), false);

    t.deepEqual(extractTest('a([__arr])', 'a(["foo", partial, literal, arr, "bar"])'), {});
    t.equal(extractTest('a([__arr])', 'a([no, literal, arr])'), false);
    t.end();
  });

  testP('extract extracts matching array string literal, and string literal', t => {
    t.equal(extractTest('a(__str_a, __arr_b)', 'a("foo", "bar")'), false);
    t.equal(extractTest('a(__str_a, __arr_b)', 'a("foo", ["bar"])'), false);
    t.deepEqual(extractTest('a(__str_a, [__arr_b])', 'a("foo", ["bar"])'), {a: 'foo', b: ['bar']});
    t.end();
  });

  testP('extract supports wildcard', t => {
    t.equal(extractTest('__any.a(__str_a, [__arr_b])', 'a("foo", ["bar"])'), false);
    t.deepEqual(extractTest('__any.a(__str_a, [__arr_b])', 'bar.a("foo", ["bar"])'), {a: 'foo', b: ['bar']});
    t.end();
  });

  testP('extract try complex pattern', t => {
    t.equal(extractTest(
      '(0, __any.noView)([__arr_deps], __str_baseUrl)',
      '(0, _aureliaFramework.noView)(["foo", "bar"])'
    ), false);
    t.deepEqual(extractTest(
      '(__any, __any.noView)([__arr_deps], __str_baseUrl)',
      '(1, _aureliaFramework.noView)(["./foo", "./bar"], "lorem")'
    ), {deps: ['./foo', './bar'], baseUrl: 'lorem'});
    t.deepEqual(extractTest(
      '(__any, __any.noView)([__arr_deps])',
      '(1, _aureliaFramework.noView)(["./foo", "./bar"])'
    ), {deps: ['./foo', './bar']});
    t.deepEqual(extractTest(
      '(__any, __any.useView)(__arr_dep)',
      '(1, _aureliaFramework.useView)("./foo.html")'
    ), {dep: ['./foo.html']});
    t.end();
  });

  testP('extact matches string literal without testing raw', t => {
    t.deepEqual(extractTest('a("foo")', "a('foo')"), {});
    t.end();
  });

  testP('astMatcher builds matcher', t => {
    t.equal(typeof astMatcher('a(__str_a)'), 'function');
    t.end();
  });

  testP('matcher built by astMatcher returns undefined on no match', t => {
    let m = astMatcher('__any.method(__str_foo, [__arr_opts])');
    let r = m('au.method(["b", "c"]); method("d", ["e"])');
    t.equal(r, undefined);
    t.end();
  });

  testP('matcher built by astMatcher accepts both string input or node input', t => {
    let m = astMatcher('a(__str_foo)');
    t.equal(m('a("foo")').length, 1);
    t.equal(m(parser('a("foo")')).length, 1);
    t.end();
  });

  testP('matcher built by astMatcher returns matches and matching nodes', t => {
    let m = astMatcher('__any.method(__str_foo, [__arr_opts])');
    let r = m('function test(au, jq) { au.method("a", ["b", "c"]); jq.method("d", ["e"]); }');
    t.equal(r.length, 2);

    t.deepEqual(r[0].match, {foo: 'a', opts: ['b', 'c']});
    t.equal(r[0].node.type, 'CallExpression');
    t.equal(r[0].node.callee.object.name, 'au');
    t.deepEqual(r[1].match, {foo: 'd', opts: ['e']});
    t.equal(r[1].node.type, 'CallExpression');
    t.equal(r[1].node.callee.object.name, 'jq');
    t.end();
  });

  testP('matcher built by astMatcher returns matching nodes with no named matches', t => {
    let m = astMatcher('__any.method(__any, [__anl])');
    let r = m('function test(au, jq) { au.method("a", ["b", "c"]); jq.method("d", ["e"]); }');
    t.equal(r.length, 2);

    t.deepEqual(r[0].match, {});
    t.equal(r[0].node.type, 'CallExpression');
    t.equal(r[0].node.callee.object.name, 'au');
    t.deepEqual(r[1].match, {});
    t.equal(r[1].node.type, 'CallExpression');
    t.equal(r[1].node.callee.object.name, 'jq');
    t.end();
  });

  testP('matcher built by astMatcher complex if statement', t => {
    let m = astMatcher('if (__any) { __anl }');
    let r = m('if (yes) { a(); b(); }');
    t.equal(r.length, 1);

    r = m('if (yes) { a(); b(); } else {}');
    t.equal(r, undefined);

    r = m('if (c && d) { a(); b(); }');
    t.equal(r.length, 1);
    t.end();
  });

  testP('matcher built by astMatcher complex pattern', t => {
    const m = astMatcher('(__any, __any.noView)([__arr_deps])');
    const r = m('(dec = (1, _aureliaFramework.noView)(["./foo", "./bar"]), dec())');
    t.ok(r);
    t.equal(r.length, 1);
    t.deepEqual(r[0].match.deps, ["./foo", "./bar"]);

    const m2 = astMatcher('(__any, __any.useView)(__arr_dep)');
    const r2 = m2('(dec = (1, _aureliaFramework.useView)("./foo.html"), dec())');
    t.ok(r2);
    t.equal(r2.length, 1);
    t.deepEqual(r2[0].match.dep, ['./foo.html']);
    t.end();
  });

  if (parserName === 'cherow') {
    testP('matcher built by astMatcher supports class body with __anl', t => {
      let m = astMatcher('export class __any_name { __anl_body }');
      let r = m(`
export class Foo {
  name = 'ok';
  bar() {}
  get loo() {}
}
`);
      t.equal(r.length, 1);
      t.equal(r[0].match.name.name, 'Foo');
      t.equal(r[0].match.body.length, 3);
      t.equal(r[0].match.body[0].key.name, 'name');
      t.equal(r[0].match.body[1].key.name, 'bar');
      t.equal(r[0].match.body[2].key.name, 'loo');
      t.end();
    });

    testP('matcher built by astMatcher supports class body with __anl case 2', t => {
      let m = astMatcher('class __any_name { __anl }');
      let r = m(`
class Foo {
  name = 'ok';
  bar() {}
  get loo() {}
}
`);
      t.equal(r.length, 1);
      t.equal(r[0].match.name.name, 'Foo');
      t.end();
    });
  }

  testP('matcher built by astMatcher continues to match even after match found', t => {
    let m = astMatcher('__any.__any_m()');
    let r = m('a.m1().m2()');
    t.equal(r.length, 2);
    t.deepEqual(r.map(i => i.match.m.name).sort(), ['m1', 'm2']);
    t.end();
  });

  testP('depFinder rejects empty input', t => {
    t.throws(() => depFinder());
    t.end();
  });

  testP('depFinder complains about wrong exp', t => {
    t.throws(() => depFinder('+++'));
    t.end();
  });

  testP('depFinder returns empty array on no match', t => {
    let f = depFinder('a(__dep)');
    t.deepEqual(f('fds("a")'), []);
    t.end();
  });

  testP('depFinder finds matching dep', t => {
    let f = depFinder('a(__dep)');
    t.deepEqual(f('a("a"); b("b"); b.a("c")'), ['a']);
    t.end();
  });

  testP('depFinder finds matching dep, accepts esprima node as input', t => {
    let f = depFinder('a(__dep)');
    t.deepEqual(f(parser('a("a"); b("b"); b.a("c")')), ['a']);
    t.end();
  });

  testP('depFinder finds matching dep by matching length', t => {
    let f = depFinder('a(__dep, __dep)');
    t.deepEqual(f('a("a"); a("b", "c"); a("d", "e", "f")'), ['b', 'c']);
    t.end();
  });

  testP('depFinder finds matching dep with wild card', t => {
    let f = depFinder('__any.a(__dep)');
    t.deepEqual(f('a("a"); b.a("b"); c["f"].a("c")'), ['b', 'c']);
    t.end();
  });

  testP('depFinder find matching deps', t => {
    let f = depFinder('a(__deps)');
    t.deepEqual(f('a("a"); a("b", "c");'), ['a', 'b', 'c']);
    t.end();
  });

  testP('depFinder accepts multiple patterns', t => {
    let f = depFinder('a(__deps)', '__any.a(__deps)');
    t.deepEqual(f('fds("a")'), []);
    t.deepEqual(
      f('a("a"); b("b"); b.a("c"); c.a("d", "e"); a("f", "g")'),
      ['a', 'c', 'd', 'e', 'f', 'g']);

    f = depFinder('a(__dep)', '__any.globalResources([__deps])');
    t.deepEqual(
      f('a("a"); a("b"); config.globalResources(["./c", "./d"])'),
      ['a', 'b', './c', './d']);
    t.end();
  });
}
