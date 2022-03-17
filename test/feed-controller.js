const { expect, assert } = require("chai");
const sinon = require("sinon");
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/user");
const Post = require("../models/post");
const AuthController = require("../controllers/auth");
const { getStatus, createPost } = require("../controllers/feed");

describe("Auth Controller", function () {
  before(() => {
    return mongoose.connect(process.env.TEST_MONGODB_URI).then(() => {
      const user = new User({
        email: "test3@test.com",
        password: "tester",
        name: "Test",
        posts: [],
        _id: "622df6d2a2c2044c78dee39f",
      });
      console.log(user);
      return user.save();
    });
  });

  it("Should add a created post to the posts of the creator", async () => {
    const req = {
      file: {
        filename: "abc.png",
      },
      userId: "622df6d2a2c2044c78dee39f",
      isAuth: true,
      body: {
        title: "Test Title",
        content: "Test content",
        imageUrl: "abc.png",
      },
    };

    const res = {
      status: function (code) {
        return this;
      },
      json: function (data) {},
    };

    const result = await createPost(req, res, () => {});
    console.log("result->", result);
    expect(result).to.have.property("post");
    const savedUser = result.post.creator;

    expect(savedUser).to.have.property("posts");
    expect(savedUser.posts).to.have.length(1);
  });

  after(() => {
    return User.deleteMany()
      .then(() => {
        return Post.deleteMany();
      })
      .then(() => {
        return mongoose.disconnect();
      });
  });
});
