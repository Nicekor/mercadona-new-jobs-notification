const express = require('express');
const app = express();
const helmet = require('helmet');
require('dotenv').config();

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server running on ${port}`));

// Middlewares
// logging
app.use('/', (req, res, next) => {
  console.log(new Date(), req.method, req.url);
  next();
});
app.use(helmet());

app.get('/', (req, res) => {
  res.send('Welcome :D');
});

app.use('/new-mercadona-jobs', require('./routes/new-mercadona-jobs'));
