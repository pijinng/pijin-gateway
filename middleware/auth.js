const jwt = require('jsonwebtoken');

const { PijinRPC } = require('../includes/proto');

async function getUserFromToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(403).json({ success: false, error: 'No or invalid token provided' });
      return;
    }
    const token = authHeader.split('Bearer ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    } catch (error) {
      res.status(403).json({ success: false, error: 'No or invalid token provided' });
      return;
    }

    const userData = await PijinRPC.getUserByID({ id: decoded._id, deleted: false });
    if (!userData.data) {
      res.status(403).json({ success: false, error: 'User not found' });
      return;
    }
    const user = JSON.parse(userData.data);

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
}

async function confirmUserCreatedEntry(req, res, next) {
  const { entryID } = req.params;

  try {
    const entryData = await PijinRPC.getEntryByID({ id: entryID, deleted: false });
    if (!entryData.data) {
      res.status(404).json({ success: false, error: 'Entry not found' });
      return;
    }

    const entry = JSON.parse(entryData.data);
    if (entry.author !== req.user._id) {
      res.status(403).json({ success: false, error: 'Unauthorized to view entry' });
      return;
    }

    req.entry = entry;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
}

module.exports = { getUserFromToken, confirmUserCreatedEntry };
