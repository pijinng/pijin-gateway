const express = require('express');
const Joi = require('joi');

const { confirmUserCreatedVote } = require('../../middleware/auth');
const proto = require('../../includes/proto');

const router = express.Router();
const { PijinRPC } = proto;

// Create a new Vote
router.post('/', async (req, res) => {
  const { entry, type } = req.body;

  // Validate
  const schema = Joi.object()
    .keys({
      entry: Joi.string().required(),
      type: Joi.string()
        .valid(['up', 'down'])
        .required(),
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
    const prevVotesData = await PijinRPC.getAllVotes({
      voter: req.user._id,
      entry,
      deleted: false,
    });
    const prevVotes = JSON.parse(prevVotesData.data);
    if (prevVotes.length) {
      res.status(400).json({ success: false, error: 'Vote already exists for this entry' });
      return;
    }

    const voteData = await PijinRPC.createVote({
      entry,
      type,
      voter: req.user._id,
    });
    const vote = JSON.parse(voteData.data);

    res.json({ success: true, data: vote });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

// Get Vote by id
router.get('/:voteID', confirmUserCreatedVote, async (req, res) => {
  const { voteID } = req.params;

  try {
    const data = await PijinRPC.getVoteByID({ id: voteID, deleted: false });
    res.json({ success: true, data: JSON.parse(data.data) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

// Get all Votes
router.get('/', async (req, res) => {
  const { entry, type } = req.query;

  // Validate
  const schema = Joi.object()
    .keys({
      entry: Joi.string().optional(),
      type: Joi.string()
        .valid(['up', 'down'])
        .optional(),
    })
    .unknown(true);

  const validation = Joi.validate(req.query, schema);
  if (validation.error !== null) {
    res.status(400).send({
      success: false,
      message: validation.error.details[0].message,
    });
    return;
  }

  try {
    const data = await PijinRPC.getAllVotes({
      voter: req.user._id,
      entry,
      type,
      deleted: false,
    });
    res.json({ success: true, data: JSON.parse(data.data) });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// Update Vote
router.post('/:voteID', confirmUserCreatedVote, async (req, res) => {
  const { entry, type } = req.body;
  const { voteID } = req.params;

  const schema = Joi.object()
    .keys({
      entry: Joi.string().optional(),
      type: Joi.string()
        .valid(['up', 'down'])
        .optional(),
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
    const voteData = await PijinRPC.updateVote({
      id: voteID,
      entry,
      type,
    });

    const vote = JSON.parse(voteData.data);
    res.json({ success: true, data: vote });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

// Delete a Vote
router.delete('/:voteID', confirmUserCreatedVote, async (req, res) => {
  const { voteID } = req.params;

  try {
    await PijinRPC.deleteVoteByID({ id: voteID });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.json(error);
  }
});

module.exports = router;
