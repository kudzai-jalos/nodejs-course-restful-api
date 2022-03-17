const { validationResult } = require("express-validator");
const Post = require("../models/post");
const fs = require("fs");
const path = require("path");
const User = require("../models/user");
const handleError = (err, next) => {
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  next(err);
};

const clearImage = (imagePath) => {
  const filePath = path.join(__dirname, "..", "images", imagePath);
  fs.unlink(filePath, (err) => {
    console.log(err);
  });
};

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  console.log(currentPage);
  let totalItems;
  const ITEMS_PER_PAGE = 2;
  Post.countDocuments()
    .then((count) => {
      totalItems = count;
      return Post.find()
        .skip((currentPage - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((posts) => {
      res.status(200).json({
        message: "Posts fetched",
        posts,
        totalItems,
      });
    })
    .catch((err) => {
      console.log(err);
      handleError(err, next);
    });
};

exports.createPost = async (req, res, next) => {
  const { title, content } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty() || !req.file) {
    const err = new Error(
      req.file
        ? "Validation failed. Entered data is invalid."
        : "No image provided"
    );
    err.statusCode = 422;
    throw err;
  }
  // Store in database
  // res.status()

  const imageUrl = req.file.filename;
  const post = new Post({
    title,
    imageUrl,
    content,
    creator: req.userId,
  });
  let creator;
  try {
    await post.save();
    const user = await User.findById(req.userId);
    // console.log("USER:", user);
    user.posts.push(post);
    creator = user;
    await user.save();
    res.status(201).json({
      message: "Post created successfully",
      post: {
        ...post._doc,
        creator: {
          _id: creator._id,
          name: creator.name,
        },
      },
    });
    return {
      message: "Post created successfully",
      post: {
        ...post._doc,
        creator,
      },
    };
  } catch (err) {
    handleError(err, next);
    return err;
  }
};

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error(
      req.file
        ? "Validation failed. Entered data is invalid."
        : "No image provided"
    );
    err.statusCode = 422;
    throw err;
  }

  const { title, content } = req.body;
  let { image: imageUrl } = req.body;
  const { postId } = req.params;
  // Store in database
  // res.status()
  if (req.file) {
    imageUrl = req.file.filename;
  }
  if (!imageUrl) {
    const err = new new Error("No file picked")();
    err.statusCode = 422;
    throw err;
  }

  Post.findById(postId)
    .then((post) => {
      if (post.creator.toString() !== req.userId) {
        const error = new Error("Not authorized!");
        error.statusCode(401);
        throw error;
      }
      if (!post) {
        const err = new new Error("Post not found")();
        err.statusCode = 404;
        return handleError(err, next);
      }

      if (imageUrl !== post.imageUrl) {
        clearImage(imageUrl);
      }

      return post.updateOne({ title, content, imageUrl });
    })
    .then((result) => {
      res.status(200).json({
        message: "Post updated",
        post: {
          ...result,
          creator: {
            name: "Kudzai",
          },
        },
      });
    })
    .catch((err) => {
      handleError(err, next);
    });
};

exports.getPost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post.");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: "Post fetched",
        post,
      });
    })
    .catch((err) => {
      handleError(err, next);
    });
};

exports.deletePost = (req, res, next) => {
  const { postId } = req.params;

  Post.findById(postId)
    .then((post) => {
      // check if user is authorized
      console.log(post.creator);
      console.log(req.userId);
      if (post.creator.toString() !== req.userId) {
        const error = new Error("Not authorized!");
        error.statusCode = 401;
        throw error;
      }
      clearImage(post.imageUrl);
      if (!post) {
        const err = new Error("Could not find post.");
        err.statusCode = 404;
        throw err;
      }

      return post.deleteOne();
    })
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.pull(postId);
      return user.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "Post deleted",
      });
    })
    .catch((err) => {
      handleError(err, next);
    });
};

exports.getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    res.status(200).json({
      message: "Status fetched",
      status: user.status,
    });
    return;
  } catch (err) {
    handleError(err, next);
  }
};

exports.updateStatus = (req, res, next) => {
  const { status } = req.body;
  return User.findById(req.userId)
    .then((user) => {
      user.status = status;
      return user.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "Status updated.",
      });
    })
    .catch((err) => {
      handleError(err, next);
    });
};
