const express = require('express');
const Joi = require('joi');

const { confirmUserCreatedEntry } = require('../../middleware/auth');
const proto = require('../../includes/proto');

const router = express.Router();
const { PijinRPC } = proto;

// Create a new Entry
router.post('/', async (req, res) => {
  const {
    name, meaning, example, tags, image,
  } = req.body;

  // Validate
  const schema = Joi.object()
    .keys({
      name: Joi.string().required(),
      meaning: Joi.string().required(),
      example: Joi.string(),
      tags: Joi.array().items(Joi.string()),
      image: Joi.string().uri(),
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
    const entryData = await PijinRPC.createEntry({
      name,
      meaning,
      example,
      tags: JSON.stringify(tags),
      image,
      author: req.user._id,
    });
    const entry = JSON.parse(entryData.data);

    res.json({ success: true, data: entry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

// Get Entry by id
router.get('/:entryID', confirmUserCreatedEntry, async (req, res) => {
  const { entryID } = req.params;

  try {
    const data = await PijinRPC.getEntryByID({ id: entryID, deleted: false });
    res.json({ success: true, data: JSON.parse(data.data) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

// Get all Entries
router.get('/', async (req, res) => {
  // Validate
  const schema = Joi.object()
    .keys({})
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
    const data = await PijinRPC.getAllEntries({
      author: req.user._id,
      deleted: false,
    });
    res.json({ success: true, data: JSON.parse(data.data) });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// Update Entry
router.post('/:entryID', confirmUserCreatedEntry, async (req, res) => {
  const {
    name, meaning, example, tags, image,
  } = req.body;
  const { entryID } = req.params;

  const schema = Joi.object()
    .keys({
      name: Joi.string(),
      meaning: Joi.string(),
      example: Joi.string(),
      tags: Joi.array().items(Joi.string()),
      image: Joi.string().uri(),
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
    const entryData = await PijinRPC.updateEntry({
      id: entryID,
      name,
      meaning,
      example,
      tags: JSON.stringify(tags),
      image,
    });

    const entry = JSON.parse(entryData.data);
    res.json({ success: true, data: entry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

// Delete an Entry
router.delete('/:entryID', confirmUserCreatedEntry, async (req, res) => {
  const { entryID } = req.params;

  try {
    await PijinRPC.deleteEntryByID({ id: entryID });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.json(error);
  }
});

module.exports = router;
