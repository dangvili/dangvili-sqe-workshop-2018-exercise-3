import assert from 'assert';

import {TransCodeToCFG} from '../src/js/code-analyzer';

const testCase = (title, code, args,  expectedOutput) =>{
    return it(title, () => assert.equal(JSON.stringify(TransCodeToCFG(code, ((JSON.parse(args))))), expectedOutput));
};

describe('test Variable Declarator substitute', () => {
    testCase('simple return', 'function foo(x){ return x; }', '{"x":1}', '{"nodes":[{"id":1,"label":"1: return x\\n","shape":"box","color":{"background":"lime","border":"black"}}],"always":[],"dit":[],"dif":[]}');
    testCase('var decl', 'function foo(x, y, z){ let b = x + 17; return b;}', '{"x":1, "y":2, "z":3}', '{"nodes":[{"id":1,"label":"1:      b = x + 17\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":2,"label":"2: return b\\n","shape":"box","color":{"background":"lime","border":"black"}}],"always":[[1,2]],"dit":[],"dif":[]}');
    testCase('if statement', 'function foo(x, y, z){ let d = x; if(x < 10){ x = x + 1; } return d; }', '{"x":1, "y":2, "z":3}', '{"nodes":[{"id":1,"label":"1:      d = x\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":-2,"label":"","shape":"ellipse","color":{"background":"lime","border":"black"}},{"id":2,"label":"2: x < 10","shape":"diamond","color":{"background":"lime","border":"black"}},{"id":3,"label":"3:     x = x + 1\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":4,"label":"4: return d\\n","shape":"box","color":{"background":"lime","border":"black"}}],"always":[[3,-2],[1,2],[-2,4]],"dit":[[2,3]],"dif":[[2,-2]]}');
    testCase('if false', 'function foo(x, y, z){ let d = x; d = 1; if(x > 2){ x = x + 1; } else{ x = x - 1; } d++; return d; }', '{"x":1, "y":2, "z":3}', '{"nodes":[{"id":1,"label":"1:      d = x\\n    d = 1\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":-2,"label":"","shape":"ellipse","color":{"background":"lime","border":"black"}},{"id":2,"label":"2: x > 2","shape":"diamond","color":{"background":"lime","border":"black"}},{"id":3,"label":"3:     x = x + 1\\n","shape":"box","color":{"background":"white","border":"black"}},{"id":4,"label":"4:     x = x - 1\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":5,"label":"5:     d++\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":6,"label":"6: return d\\n","shape":"box","color":{"background":"lime","border":"black"}}],"always":[[3,-2],[1,2],[4,-2],[-2,5],[5,6]],"dit":[[2,3]],"dif":[[2,4]]}');
    testCase('else if', 'function foo(x, y, z){ let d = x + 34; d = 1; if(x < 9){ x = x + 1; } else if (x > 6) { x = x - 1; } d++; return d; }', '{"x":1, "y":2, "z":3}','{"nodes":[{"id":1,"label":"1:      d = x + 34\\n    d = 1\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":-2,"label":"","shape":"ellipse","color":{"background":"lime","border":"black"}},{"id":2,"label":"2: x < 9","shape":"diamond","color":{"background":"lime","border":"black"}},{"id":3,"label":"3:     x = x + 1\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":4,"label":"4: x > 6","shape":"diamond","color":{"background":"white","border":"black"}},{"id":5,"label":"5:     x = x - 1\\n","shape":"box","color":{"background":"white","border":"black"}},{"id":6,"label":"6:     d++\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":7,"label":"7: return d\\n","shape":"box","color":{"background":"lime","border":"black"}}],"always":[[3,-2],[1,2],[5,-2],[2,4],[-2,6],[6,7]],"dit":[[2,3],[4,5]],"dif":[[4,-6]]}');
    testCase('no else', 'function foo(x, y, z){ let d = x + 23; d = 1; if(x >32){ x = x + 1; }  return d; }','{"x":1, "y":2, "z":3}','{"nodes":[{"id":1,"label":"1:      d = x + 23\\n    d = 1\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":-2,"label":"","shape":"ellipse","color":{"background":"lime","border":"black"}},{"id":2,"label":"2: x > 32","shape":"diamond","color":{"background":"lime","border":"black"}},{"id":3,"label":"3:     x = x + 1\\n","shape":"box","color":{"background":"white","border":"black"}},{"id":4,"label":"4: return d\\n","shape":"box","color":{"background":"lime","border":"black"}}],"always":[[3,-2],[1,2],[-2,4]],"dit":[[2,3]],"dif":[[2,-2]]}');
    testCase('while', 'function foo(x, y, z){ let d = x + 34; while (x < 3){ x = x + 3; } return d; }', '{"x":1, "y":2, "z":3}', '{"nodes":[{"id":1,"label":"1:      d = x + 34\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":2,"label":"2: NULL","shape":"box","color":{"background":"lime","border":"black"}},{"id":3,"label":"3: x < 3","shape":"diamond","color":{"background":"lime","border":"black"}},{"id":4,"label":"4:     x = x + 3\\n","shape":"box","color":{"background":"white","border":"black"}},{"id":5,"label":"5: return d\\n","shape":"box","color":{"background":"lime","border":"black"}}],"always":[[1,2],[2,3],[4,2]],"dit":[[3,4]],"dif":[[3,5]]}');
    testCase('update', 'function foo(x, y, z){ let bla = x + 12; if(x < 16){ x = x + 1; } bla++; return bla; }','{"x":1, "y":2, "z":3}','{"nodes":[{"id":1,"label":"1:      bla = x + 12\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":-2,"label":"","shape":"ellipse","color":{"background":"lime","border":"black"}},{"id":2,"label":"2: x < 16","shape":"diamond","color":{"background":"lime","border":"black"}},{"id":3,"label":"3:     x = x + 1\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":4,"label":"4:     bla++\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":5,"label":"5: return bla\\n","shape":"box","color":{"background":"lime","border":"black"}}],"always":[[3,-2],[1,2],[-2,4],[4,5]],"dit":[[2,3]],"dif":[[2,-2]]}');
    testCase('example', 'function foo(x, y, z){ let a = x + 1; let b = a + y; let c = 0; if (b < z) { c = c + 5; } else if (b < z * 2) { c = c + x + 5; } else { c = c + z + 5; } return c; }', '{"x":1,"y":2,"z":3}', '{"nodes":[{"id":1,"label":"1:      a = x + 1\\n     b = a + y\\n     c = 0\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":-2,"label":"","shape":"ellipse","color":{"background":"lime","border":"black"}},{"id":2,"label":"2: b < z","shape":"diamond","color":{"background":"lime","border":"black"}},{"id":3,"label":"3:     c = c + 5\\n","shape":"box","color":{"background":"white","border":"black"}},{"id":4,"label":"4: b < z * 2","shape":"diamond","color":{"background":"lime","border":"black"}},{"id":5,"label":"5:     c = c + x + 5\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":6,"label":"6:     c = c + z + 5\\n","shape":"box","color":{"background":"white","border":"black"}},{"id":7,"label":"7: return c\\n","shape":"box","color":{"background":"lime","border":"black"}}],"always":[[3,-2],[1,2],[5,-2],[2,4],[6,-2],[-2,7]],"dit":[[2,3],[4,5]],"dif":[[4,6]]}');
    testCase('example2', 'function foo(x, y, z){ let a = x + 1; let b = a + y; let c = 0; while (a < z) { c = a + b; z = c * 2; a++; } return z; }','{"x":1, "y":2, "z":3}' ,'{"nodes":[{"id":1,"label":"1:      a = x + 1\\n     b = a + y\\n     c = 0\\n","shape":"box","color":{"background":"lime","border":"black"}},{"id":2,"label":"2: NULL","shape":"box","color":{"background":"lime","border":"black"}},{"id":3,"label":"3: a < z","shape":"diamond","color":{"background":"lime","border":"black"}},{"id":4,"label":"4:     c = a + b\\n    z = c * 2\\n    a++\\n","shape":"box","color":{"background":"white","border":"black"}},{"id":5,"label":"5: return z\\n","shape":"box","color":{"background":"lime","border":"black"}}],"always":[[1,2],[2,3],[4,2]],"dit":[[3,4]],"dif":[[3,5]]}');
});
