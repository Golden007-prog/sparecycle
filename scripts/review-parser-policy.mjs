/** Conservative pure-parser syntax policy, shared by the API and the trusted runner.
 * This is intentionally a small language subset, not a general JavaScript sandbox.
 * Execution isolation remains necessary for loops, memory pressure and regular expressions.
 */
const GLOBALS = new Set(['Number', 'String', 'Boolean', 'Array', 'Math', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'NaN', 'Infinity', 'undefined', 'Error', 'TypeError', 'RangeError']);
const FORBIDDEN = new Set(['constructor', 'prototype', '__proto__', 'caller', 'callee', 'arguments', 'call', 'apply', 'bind', 'process', 'global', 'globalThis', 'eval', 'Function', 'AsyncFunction', 'GeneratorFunction', 'Reflect', 'Object', 'Proxy', 'Symbol', 'WebAssembly', 'require', 'module', 'exports', 'import', 'fetch', 'XMLHttpRequest', 'Deno', 'Bun', 'window', 'self', 'document', 'console']);
const METHODS = new Set(['isFinite', 'isInteger', 'isSafeInteger', 'isNaN', 'parseInt', 'parseFloat', 'isArray', 'from', 'of', 'abs', 'ceil', 'floor', 'round', 'trunc', 'min', 'max', 'pow', 'sqrt', 'sign', 'log', 'log10', 'exp', 'parse', 'stringify', 'trim', 'trimStart', 'trimEnd', 'toLowerCase', 'toUpperCase', 'split', 'match', 'matchAll', 'replace', 'replaceAll', 'search', 'test', 'exec', 'slice', 'substring', 'substr', 'startsWith', 'endsWith', 'includes', 'indexOf', 'lastIndexOf', 'charAt', 'charCodeAt', 'codePointAt', 'at', 'concat', 'join', 'map', 'filter', 'reduce', 'reduceRight', 'find', 'findIndex', 'some', 'every', 'forEach', 'flat', 'flatMap', 'sort', 'reverse', 'push', 'pop', 'shift', 'unshift', 'toFixed', 'toPrecision', 'toString', 'padStart', 'padEnd']);
const SAFE_NODES = new Set(['Program', 'ExportNamedDeclaration', 'ExportDefaultDeclaration', 'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'VariableDeclaration', 'VariableDeclarator', 'Identifier', 'Literal', 'BlockStatement', 'ReturnStatement', 'IfStatement', 'ConditionalExpression', 'BinaryExpression', 'LogicalExpression', 'UnaryExpression', 'UpdateExpression', 'AssignmentExpression', 'ExpressionStatement', 'CallExpression', 'NewExpression', 'MemberExpression', 'ArrayExpression', 'ObjectExpression', 'Property', 'ArrayPattern', 'ObjectPattern', 'AssignmentPattern', 'RestElement', 'SpreadElement', 'TemplateLiteral', 'TemplateElement', 'ForStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement', 'BreakStatement', 'ContinueStatement', 'SwitchStatement', 'SwitchCase', 'ThrowStatement', 'TryStatement', 'CatchClause', 'EmptyStatement', 'ChainExpression']);
const denied = () => { throw new Error('This profile permits pure parser functions, safe literals and local computation only.'); };
const propertyName = node => {
  if (!node.computed && node.property?.type === 'Identifier') return node.property.name;
  if (node.computed && node.property?.type === 'Literal' && (typeof node.property.value === 'string' || Number.isSafeInteger(node.property.value))) return String(node.property.value);
  denied();
};
const propertyKey = node => {
  if (node.computed) {
    if (node.key.type !== 'Literal' || !['string', 'number'].includes(typeof node.key.value)) denied();
    return String(node.key.value);
  }
  if (node.key.type === 'Identifier') return node.key.name;
  if (node.key.type === 'Literal') return String(node.key.value);
  denied();
};
const exportedNames = ast => {
  const names = [];
  const collectBinding = node => {
    if (!node) return;
    if (node.type === 'Identifier') { names.push(node.name); return; }
    if (node.type === 'AssignmentPattern') { collectBinding(node.left); return; }
    if (node.type === 'RestElement') { collectBinding(node.argument); return; }
    if (node.type === 'ArrayPattern') { for (const item of node.elements) collectBinding(item); return; }
    if (node.type === 'ObjectPattern') { for (const item of node.properties) collectBinding(item.type === 'RestElement' ? item.argument : item.value); return; }
    denied();
  };
  for (const node of ast.body) {
    if (node.type === 'ExportDefaultDeclaration') names.push('default');
    if (node.type !== 'ExportNamedDeclaration') continue;
    if (node.declaration?.type === 'FunctionDeclaration') collectBinding(node.declaration.id);
    else if (node.declaration?.type === 'VariableDeclaration') for (const item of node.declaration.declarations) collectBinding(item.id);
    else denied();
  }
  if (names.length === 0) throw new Error('A parser must contain executable exported declarations, not comments or an empty module.');
  return names.sort();
};
/** @param {string} source @param {(text:string, options:object)=>object} parse */
function inspectPureParser(source, parse) {
  if (typeof source !== 'string' || Buffer.byteLength(source, 'utf8') > 32_000) denied();
  let ast;
  try { ast = parse(source, { ecmaVersion: 2022, sourceType: 'module' }); } catch { denied(); }
  let count = 0;
  const root = { names: new Set(), parent: null };
  const local = (name, scope) => { for (let current = scope; current; current = current.parent) if (current.names.has(name)) return true; return false; };
  const bind = (pattern, scope) => {
    if (!pattern) return;
    if (pattern.type === 'Identifier') {
      if (FORBIDDEN.has(pattern.name) || GLOBALS.has(pattern.name)) denied();
      scope.names.add(pattern.name); return;
    }
    if (pattern.type === 'AssignmentPattern') return bind(pattern.left, scope);
    if (pattern.type === 'RestElement') return bind(pattern.argument, scope);
    if (pattern.type === 'ArrayPattern') { for (const item of pattern.elements) bind(item, scope); return; }
    if (pattern.type === 'ObjectPattern') {
      for (const item of pattern.properties) {
        if (item.type === 'RestElement') bind(item.argument, scope);
        else { if (FORBIDDEN.has(propertyKey(item))) denied(); bind(item.value, scope); }
      }
      return;
    }
    denied();
  };
  const predeclare = (nodes, scope) => {
    for (let node of nodes) {
      if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') node = node.declaration;
      if (!node) denied();
      if (node.type === 'FunctionDeclaration' && node.id) bind(node.id, scope);
      if (node.type === 'VariableDeclaration') for (const item of node.declarations) bind(item.id, scope);
    }
  };
  const visitPattern = (pattern, scope, depth) => {
    if (!pattern || pattern.type === 'Identifier') return;
    if (pattern.type === 'AssignmentPattern') { visitPattern(pattern.left, scope, depth + 1); visit(pattern.right, scope, depth + 1); return; }
    if (pattern.type === 'RestElement') return visitPattern(pattern.argument, scope, depth + 1);
    if (pattern.type === 'ArrayPattern') { for (const item of pattern.elements) visitPattern(item, scope, depth + 1); return; }
    if (pattern.type === 'ObjectPattern') { for (const p of pattern.properties) visitPattern(p.type === 'RestElement' ? p.argument : p.value, scope, depth + 1); return; }
    denied();
  };
  const visit = (node, scope, depth = 0) => {
    if (!node) return;
    if (++count > 12_000 || depth > 64 || !SAFE_NODES.has(node.type)) denied();
    if (node.type === 'Identifier') { if (FORBIDDEN.has(node.name) || (!local(node.name, scope) && !GLOBALS.has(node.name))) denied(); return; }
    if (node.type === 'Program' || node.type === 'BlockStatement') {
      const inner = node.type === 'Program' ? scope : { names: new Set(), parent: scope };
      if (node.type === 'Program' && node.body.some(n => !['FunctionDeclaration', 'VariableDeclaration', 'ExportNamedDeclaration', 'ExportDefaultDeclaration', 'EmptyStatement'].includes(n.type))) denied();
      predeclare(node.body, inner); for (const item of node.body) visit(item, inner, depth + 1); return;
    }
    if (node.type.startsWith('Export')) {
      if (!node.declaration || node.source || node.specifiers?.length) denied();
      visit(node.declaration, scope, depth + 1); return;
    }
    if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)) {
      if (node.async || node.generator) denied();
      const inner = { names: new Set(), parent: scope };
      if (node.id) bind(node.id, inner);
      for (const param of node.params) bind(param, inner);
      for (const param of node.params) visitPattern(param, inner, depth + 1);
      visit(node.body, inner, depth + 1); return;
    }
    if (node.type === 'VariableDeclaration') {
      if (!['const', 'let'].includes(node.kind)) denied();
      for (const declaration of node.declarations) { bind(declaration.id, scope); visitPattern(declaration.id, scope, depth + 1); visit(declaration.init, scope, depth + 1); } return;
    }
    if (node.type === 'MemberExpression') {
      if (FORBIDDEN.has(propertyName(node))) denied();
      visit(node.object, scope, depth + 1); return;
    }
    if (node.type === 'Property') {
      if (node.kind !== 'init' || node.method || FORBIDDEN.has(propertyKey(node))) denied();
      visit(node.value, scope, depth + 1); return;
    }
    if (node.type === 'CallExpression') {
      if (node.callee.type === 'MemberExpression') { if (!METHODS.has(propertyName(node.callee))) denied(); }
      else if (node.callee.type !== 'Identifier' || (!local(node.callee.name, scope) && !GLOBALS.has(node.callee.name))) denied();
      visit(node.callee, scope, depth + 1); for (const arg of node.arguments) visit(arg, scope, depth + 1); return;
    }
    if (node.type === 'NewExpression') {
      if (node.callee.type !== 'Identifier' || !['Error', 'TypeError', 'RangeError'].includes(node.callee.name)) denied();
      for (const arg of node.arguments) visit(arg, scope, depth + 1); return;
    }
    if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression') {
      const target = node.left ?? node.argument;
      if (target.type !== 'Identifier' || !local(target.name, scope) || GLOBALS.has(target.name)) denied();
    }
    if (node.type === 'UnaryExpression' && ['delete'].includes(node.operator)) denied();
    if (node.type === 'ForStatement' || node.type === 'ForOfStatement') {
      if (node.await) denied();
      if (node.type === 'ForOfStatement' && node.left.type !== 'VariableDeclaration' && (node.left.type !== 'Identifier' || !local(node.left.name, scope) || GLOBALS.has(node.left.name))) denied();
      const inner = { names: new Set(), parent: scope };
      const initial = node.init ?? node.left;
      if (initial?.type === 'VariableDeclaration') for (const declaration of initial.declarations) bind(declaration.id, inner);
      for (const [key, value] of Object.entries(node)) if (!['type', 'start', 'end'].includes(key)) {
        if (value && typeof value === 'object' && typeof value.type === 'string') visit(value, inner, depth + 1);
      }
      return;
    }
    if (node.type === 'CatchClause') {
      const inner = { names: new Set(), parent: scope }; bind(node.param, inner); visitPattern(node.param, inner, depth + 1); visit(node.body, inner, depth + 1); return;
    }
    // Property names, bindings and function scopes are handled explicitly above. All remaining child expressions are references.
    for (const [key, value] of Object.entries(node)) {
      if (['type', 'start', 'end', 'raw', 'regex', 'value'].includes(key)) continue;
      if (Array.isArray(value)) { for (const child of value) if (child && typeof child.type === 'string') visit(child, scope, depth + 1); }
      else if (value && typeof value === 'object' && typeof value.type === 'string') visit(value, scope, depth + 1);
    }
  };
  visit(ast, root);
  return exportedNames(ast);
}
/** @param {string} source @param {(text:string, options:object)=>object} parse */
export function validatePureParser(source, parse) {
  inspectPureParser(source, parse);
  return true;
}
/** Validate both the pure-parser language boundary and the exact module export contract. */
export function validateParserReplacement(before, after, parse) {
  const expected = inspectPureParser(before, parse);
  const actual = inspectPureParser(after, parse);
  if (expected.length !== actual.length || expected.some((name, index) => name !== actual[index])) throw new Error('The replacement must preserve every original exported name, without adding or removing exports.');
  return true;
}
