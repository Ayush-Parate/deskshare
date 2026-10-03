const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ name: 'DeskShare API', status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/spaces', require('./routes/spaces'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/memberships', require('./routes/memberships'));

app.use(notFound);
app.use(errorHandler);
module.exports = app;
