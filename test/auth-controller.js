const { expect, assert } = require("chai");
const sinon = require("sinon");
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/user");
const AuthController = require("../controllers/auth");
const { getStatus } = require("../controllers/feed");

describe("Auth Controller", function () {
  before(() => {
    return mongoose.connect(process.env.TEST_MONGODB_URI).then(() => {
      const user = new User({
        email: "test3@test.com",
        password: "tester",
        name: "Test",
        post: [],
        _id: "622df6d2a2c2044c78dee39f",
      });
      return user.save();
    });
  });

  it("Should throw an error with code 500 if accessing the database fails", function () {
    sinon.stub(User, "findOne");
    User.findOne.throws();

    const req = {
      body: {
        email: "test@gmail.com",
        password: "fakepassword",
      },
    };
    console.log(req);
    let error;
    return AuthController.postLogin(req, { status: () => {} }, (err) => {
      // error = err;
      // done();
    })
      .then((result) => {
        User.findOne.restore();

        throw result;
      })
      .catch((err) => {
        expect(err).to.be.an("error");
        expect(err).to.have.property("statusCode", 500);
        // done();
      });
  });

  it("Should send a response with a valid user satus for an existing user", () => {
    const req = {
      userId: "622df6d2a2c2044c78dee39f",
      isAuth: true,
    };
    const res = {
      statusCode: 500,
      userStatus: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.userStatus = data.status;
      },
    };

    return getStatus(req, res, () => {}).then((result) => {
      expect(res.statusCode).to.be.equal(200);
      expect(res.userStatus).to.be.equal("I am new!");
    });
  });

  after(() => {
   return User.deleteMany().then(() => {
      return mongoose.disconnect();
    });
  });
});
