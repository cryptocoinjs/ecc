var assert = require('assert');
var BigMath = require('math-buffer');
var ECCurveFp = require('../lib/ecurve');

function fromHex(s) {
  var buf =  new Buffer(s, 'hex');
  // Now reverse the bytes to make it little-endian:
  var out = new Buffer(buf.length);
  for (var i = 0; i < buf.length; i++) {
    out[i] = buf[buf.length-i];
  }
  return out;
};
function arrayToHex(a) { return a.map(function(i) { return ('00'+i.toString(16)).slice(-2); }).join(''); };

describe('Ecurve', function() {
  it('should create curve objects', function() {
    // secp160r1: p = 2^160 - 2^31 - 1
    var q = fromHex('ffffffffffffffffffffffffffffffff7fffffff');
    var a = fromHex('ffffffffffffffffffffffffffffffff7ffffffc');
    var b = fromHex('1c97befc54bd7a8b65acf89f81d4d4adc565fa45');
    var curve = new ECCurveFp(q, a, b);
    assert.ok(curve);
    assert.equal(curve.getQ().toString('hex'), 'ffffffffffffffffffffffffffffffff7fffffff');
    assert.equal(curve.getA().toBigInteger().toString('hex'), 'ffffffffffffffffffffffffffffffff7ffffffc');
    assert.equal(curve.getB().toBigInteger().toString('hex'), '1c97befc54bd7a8b65acf89f81d4d4adc565fa45');
  });
  /*
  it('should calculate keys correctly for secp160r1', function() {
    // sect163k1: p = 2^160 - 2^31 - 1
    var q = fromHex('ffffffffffffffffffffffffffffffff7fffffff');
    var a = fromHex('ffffffffffffffffffffffffffffffff7ffffffc');
    var b = fromHex('1c97befc54bd7a8b65acf89f81d4d4adc565fa45');
    var curve = new ECCurveFp(q, a, b);
    var G = curve.decodePointHex('04'
      + '4A96B5688EF573284664698968C38BB913CBFC82'
      + '23A628553168947D59DCC912042351377AC5FB32'); // ECPointFp
    
    var d = new BigInteger('971761939728640320549601132085879836204587084162', 10); // test vector from http://www.secg.org/collateral/gec2.pdf 2.1.2
    var Q = G.multiply(d);
    assert.equal(arrayToHex(Q.getEncoded(true)), '0251b4496fecc406ed0e75a24a3c03206251419dc0');
    assert.ok(Q.getX().toBigInteger().equals(new BigInteger('466448783855397898016055842232266600516272889280', 10)));
    assert.ok(Q.getY().toBigInteger().equals(new BigInteger('1110706324081757720403272427311003102474457754220', 10)));

    var d = new BigInteger('702232148019446860144825009548118511996283736794', 10); // test vector from http://www.secg.org/collateral/gec2.pdf 2.1.2
    var k = G.multiply(d);
    assert.ok(k.getX().toBigInteger().equals(new BigInteger('1176954224688105769566774212902092897866168635793', 10)));
    assert.ok(k.getY().toBigInteger().equals(new BigInteger('1130322298812061698910820170565981471918861336822', 10)));

    var d = new BigInteger('399525573676508631577122671218044116107572676710', 10); // test vector from http://www.secg.org/collateral/gec2.pdf 3.1.2
    var Q = G.multiply(d);
    assert.equal(arrayToHex(Q.getEncoded(true)), '0349b41e0e9c0369c2328739d90f63d56707c6e5bc');
    assert.ok(Q.getX().toBigInteger().equals(new BigInteger('420773078745784176406965940076771545932416607676', 10)));
    assert.ok(Q.getY().toBigInteger().equals(new BigInteger('221937774842090227911893783570676792435918278531', 10)));
  });
  describe('Field math', function() {
    var curve = new ECCurveFp(
      fromHex('0b'),
      fromHex('01'),
      fromHex('00')
    );
    // General Elliptic curve formula: y^2 = x^3 + ax + b
    // Testing field: y^2 = x^3 + x (a = 1, b = 0);
    // Wolfram Alpha: solve mod(y^2, 11)=mod(x^3+x, 11)
    // There are 12 valid points on this curve (11 plus point at infinity)
    //   (0,0), (5,8), (7,8), (8,5), (9,10), (10,8)
    //          (5,3), (7,3), (8,6), (9,1),  (10,3)
    
    // 10                           X
    //  9
    //  8               X     X        X
    //  7
    //  6                        X
    //  5                        X
    //  4
    //  3               X     X        X
    //  2
    //  1                           X
    //  0 X
    //    0 1  2  3  4  5  6  7  8  9 10
    
    var inf = curve.getInfinity();
    var a = new ECCurveFp.ECPointFp(
      curve,
      curve.fromBigInteger(new BigInteger('5')),
      curve.fromBigInteger(new BigInteger('3'))
    );
    var b = new ECCurveFp.ECPointFp(
      curve,
      curve.fromBigInteger(new BigInteger('9')),
      curve.fromBigInteger(new BigInteger('10'))
    );
    var z = new ECCurveFp.ECPointFp(
      curve,
      curve.fromBigInteger(new BigInteger('0')),
      curve.fromBigInteger(new BigInteger('0'))
    );
    var y = new ECCurveFp.ECPointFp(
      curve,
      curve.fromBigInteger(new BigInteger('1')),
      curve.fromBigInteger(new BigInteger('1'))
    );
    
    it('should validate field elements properly', function() {
      assert.ok(a.validate());
      assert.ok(b.validate());
      //assert.ok(z.validate()); // FAILS: claims 0,0 is out of bounds, which is not true; 0,0 is a valid curve point
      assert.ok(z.isOnCurve());
      assert.ok(!y.isOnCurve());
      //assert.ok(!y.validate()); // FAILS: Throws an error instead of returning false
      assert.ok(!a.isInfinity());
      assert.ok(!b.isInfinity());
      assert.ok(inf.isInfinity());
      assert.ok(inf.isOnCurve());
      //assert.ok(inf.validate()); // FAILS: Throws an error instead of returning false
    });
    it('should negate field elements properly', function() {
      assert.equal(a.negate().toString(), '(5,8)'); // -(5,3) = (5,8)
      assert.equal(b.negate().toString(), '(9,1)'); // -(9,10) = (9,1)
      //assert.equal(inf.negate().toString(), '(INFINITY)'); // FAILS: can't negate infinity point; should fail out gracefully
      assert.equal(z.negate().toString(), '(0,0)'); // -(0,0) = (0,0)
    });
    it('should add field elements properly', function() {
      assert.equal(a.add(b).toString(), '(9,1)');  // (5,3) + (9,10) = (9,1)
      assert.equal(b.add(a).toString(), '(9,1)');  // (9,10) + (5,3) = (9,1)
      assert.equal(a.add(z).toString(), '(9,10)'); // (5,3) + (0,0) = (9,10)
      assert.equal(a.add(y).toString(), '(8,1)');  // (5,3) + (1,1) = (8,1)  <-- weird result; should error out if one of the operands isn't on the curve
      
      assert.equal(a.add(inf).toString(), '(5,3)'); // (5,3) + INFINITY = (5,3)
      assert.equal(inf.add(a).toString(), '(5,3)'); // INFINITY + (5,3) = (5,3)
    });
    it('should multiply field elements properly', function() {
      assert.equal(a.multiply(new BigInteger('2')).toString(), '(5,8)');      // (5,3) x 2 = (5,8)
      assert.equal(a.multiply(new BigInteger('3')).toString(), '(INFINITY)'); // (5,3) x 3 = INFINITY
      assert.equal(a.multiply(new BigInteger('4')).toString(), '(5,3)');      // (5,3) x 4 = (5,3)
      assert.equal(a.multiply(new BigInteger('5')).toString(), '(5,8)');      // (5,3) x 5 = (5,8)
      
      assert.equal(b.multiply(new BigInteger('2')).toString(), '(5,8)'); // (9,10) x 2 = (5,8)
      assert.equal(b.multiply(new BigInteger('3')).toString(), '(0,0)'); // (9,10) x 3 = (0,0)
      assert.equal(b.multiply(new BigInteger('4')).toString(), '(5,3)'); // (9,10) x 4 = (5,3)
      assert.equal(b.multiply(new BigInteger('5')).toString(), '(9,1)'); // (9,10) x 5 = (9,1)
      
      assert.equal(inf.multiply(new BigInteger('2')).toString(), '(INFINITY)'); // INFINITY x 2 = INFINITY
      assert.equal(inf.multiply(new BigInteger('3')).toString(), '(INFINITY)'); // INFINITY x 3 = INFINITY
      assert.equal(inf.multiply(new BigInteger('4')).toString(), '(INFINITY)'); // INFINITY x 4 = INFINITY
      assert.equal(inf.multiply(new BigInteger('5')).toString(), '(INFINITY)'); // INFINITY x 5 = INFINITY
      
      assert.equal(z.multiply(new BigInteger('2')).toString(), '(INFINITY)'); // (0,0) x 2 = INFINITY
      assert.equal(z.multiply(new BigInteger('3')).toString(), '(0,0)');      // (0,0) x 3 = (0,0)
      assert.equal(z.multiply(new BigInteger('4')).toString(), '(INFINITY)'); // (0,0) x 4 = INFINITY
      assert.equal(z.multiply(new BigInteger('5')).toString(), '(0,0)');      // (0,0) x 5 = (0,0)
      
      assert.equal(a.multiplyTwo(new BigInteger('4'), b, new BigInteger('4')).toString(), '(5,8)'); // (5,3) x 4 + (9,10) x 4 = (5,8)
      
      assert.equal(a.multiply(new BigInteger('2')).toString(), a.twice().toString()); // .multiply(2) == .twice()
      assert.equal(b.multiply(new BigInteger('2')).toString(), b.twice().toString());
      assert.equal(inf.multiply(new BigInteger('2')).toString(), inf.twice().toString());
      assert.equal(z.multiply(new BigInteger('2')).toString(), z.twice().toString());

      assert.equal(a.multiply(new BigInteger('2')).toString(), a.add(a).toString()); // this.multiply(2) == this.add(this)
      assert.equal(b.multiply(new BigInteger('2')).toString(), b.add(b).toString());
      assert.equal(inf.multiply(new BigInteger('2')).toString(), inf.add(inf).toString());
      assert.equal(z.multiply(new BigInteger('2')).toString(), z.add(z).toString());
    });
  });
  */
});
