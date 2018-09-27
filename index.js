const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const { getUserFromToken } = require('./middleware/auth');

const auth = require('./routes/v1/auth');
const entries = require('./routes/v1/entries');

const app = express();

app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/v1', async (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Pijin.ng API service',
  });
});

app.use('/v1/auth', auth);
app.use(getUserFromToken);
app.use('/v1/entries', entries);

app.use((req, res) => {
  res.status(404).send({ error: 'Not found' });
});

app.listen(process.env.GATEWAY_PORT, () => {
  console.info(`Pijin.ng gateway listening on port ${process.env.GATEWAY_PORT}`);
});
