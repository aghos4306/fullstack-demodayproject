const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { route } = require('./users');

// @route  GET api/profile/me
// @desc   Get current user profile
// @access Private cos get profile by id in token
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'No profile found for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  POST api/profile
// @desc   Create and update user data
// @access Private
router.post('/', [auth, [check('status', 'Status is required').not().isEmpty(), check('skills', 'Skills is required').not().isEmpty()]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  //pull out these fields if validation passes through
  const { company, website, location, bio, status, githubusername, skills, youtube, facebook, twitter, instagram, linkedin } = req.body;

  //Build profile object
  const profileFields = {};
  profileFields.user = req.user.id;
  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubusername) profileFields.githubusername = githubusername;
  //convert the skills into an array
  if (skills) {
    profileFields.skills = skills.split(',').map((skill) => skill.trim());
  }

  //Build Social Object
  profileFields.social = {};
  if (youtube) profileFields.social.youtube = youtube;
  if (twitter) profileFields.social.twitter = twitter;
  if (facebook) profileFields.social.facebook = facebook;
  if (linkedin) profileFields.social.linkedin = linkedin;
  if (instagram) profileFields.social.instagram = instagram;

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      //update
      profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });

      return res.json(profile);
    }

    //create profile
    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  GET api/profile
// @desc   Get all profiles
// @access Public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  GET api/profile/user/:user_id
// @desc   Get user profile
// @access Public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

    if (!profile) return res.status(400).json({ msg: 'There is no profile for this user' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    res.status(500).send('Server Error');
  }
});

// @route  DELETE api/profile
// @desc   Delete profile, user and posts
// @access Private

router.delete('/', auth, async (req, res) => {
  try {
    //@wip delete users post

    //Delete profile
    await Profile.findOneAndRemove({ user: req.user.id });
    //Delete user
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  PUT api/profile
// @desc   Add experience to profile
// @access Private

router.put(
  '/experience',
  [auth, [check('title', 'Title is required').not().isEmpty(), check('company', 'Company is required').not().isEmpty(), check('from', 'From date is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, from, to, current, description } = req.body;
    const newExp = { title, company, location, from, to, current, description };

    //mongodb query
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
