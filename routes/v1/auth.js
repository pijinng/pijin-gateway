const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const { PijinRPC, AuthRPC } = require('../../includes/proto');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  // Validate
  const schema = Joi.object()
    .keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
    })
    .unknown(true);

  const validation = Joi.validate(req.body, schema);
  if (validation.error !== null) {
    res.status(400).send({
      success: false,
      message: validation.error.details[0].message,
    });
    return;
  }

  try {
    const userData = await PijinRPC.createUser({ username });
    const user = JSON.parse(userData.data);

    await AuthRPC.createAuthorization({ userID: user._id, password });

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: '30d',
      },
    );

    res
      .set({
        Authorization: `Bearer ${token}`,
      })
      .json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ success: false, error: 'Username already exists' });
      return;
    }
    res.status(500).json({ success: false, error });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate
  const schema = Joi.object()
    .keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
    })
    .unknown(true);

  const validation = Joi.validate(req.body, schema);
  if (validation.error !== null) {
    res.status(400).send({
      success: false,
      message: validation.error.details[0].message,
    });
    return;
  }

  try {
    const userData = await PijinRPC.getUserByUsername({ username, deleted: false });
    if (!userData.data) {
      res.status(400).json({ success: false, message: 'User not found' });
      return;
    }
    const user = JSON.parse(userData.data);

    const isValidPasswordData = await AuthRPC.validatePasswordWithUserID({
      userID: user._id,
      password,
    });
    const isValidPassword = JSON.parse(isValidPasswordData.data);
    if (!isValidPassword) {
      res.status(400).json({ success: false, message: 'Invalid username or password' });
      return;
    }

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: '30d',
      },
    );

    res
      .set({
        Authorization: `Bearer ${token}`,
      })
      .json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

// Login with FB
router.get('/login/facebook', async (req, res) => {
  try {
    passport.authenticate('facebook', { scope: 'email', session: false })(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

// Login with FB callback
router.get(
  '/login/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect: '/home',
    failureRedirect: '/login',
    session: false,
  }),
);

// Get user
router.get('/me', async (req, res) => {
  try {
    const userData = await PijinRPC.getUserByID({ id: req.user._id, deleted: false });
    if (!userData.data) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    const user = JSON.parse(userData.data);
    res.json({ success: true, data: JSON.parse(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

// Update User
router.post('/me', async (req, res) => {
  const { username } = req.body;

  const schema = Joi.object()
    .keys({
      username: Joi.string().optional(),
    })
    .unknown(true);
  const validation = Joi.validate(req.body, schema);
  if (validation.error !== null) {
    res.status(400).send({
      success: false,
      message: validation.error.details[0].message,
    });
    return;
  }

  try {
    const userData = await PijinRPC.updateUser({
      id: req.user._id,
      username,
    });
    const user = JSON.parse(userData.data);

    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

module.exports = router;
