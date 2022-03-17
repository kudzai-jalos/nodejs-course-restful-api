const authMiddleware = require("../middleware/is-auth");
const { expect } = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");

describe("Authorization middleware", function () {
  it("should throw an error if no Authorization header is sent", function () {
    const req = {
      get: function () {
        return null;
      },
    };

    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw(
      "Not authenticated"
    );
  });

  it("Should throw an error if the Authorization header is only one string", function () {
    const req = {
      get: function () {
        return "xyz";
      },
    };

    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });

  it("Should yield a userId after decoding the token ", function () {
    const req = {
      get: function (headerName) {
        return "Bearer dadaedadfaedfaefdafaefd3f5aefaefabefdef";
      },
    };
    sinon.stub(jwt, "verify");
    jwt.verify.returns({
      userId: "abx",
    });
    authMiddleware(req, {}, () => {});

    expect(req).to.have.property("userId");
    expect(req).to.have.property("userId", "abx");
    expect(jwt.verify.called).to.be.true;
    jwt.verify.restore();
  });

  it("Should throw an error if an invalid token is passed", function () {
    const req = {
      get: function (headerName) {
        return "Bearer xyz";
      },
    };

    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });
});
