const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const config = require('./config/db');
const User = require('./app/models/user');

const app = express();
const apiRoutes = express.Router();

mongoose.connect(config.database);
app.set('superSecret', config.secret);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/api', apiRoutes);

app.get('/', (_, res) => {
    res.send('Welcome to home page');
});
app.get('/setup', (req, res) => {
    const user = new User({
        name: 'First User',
        password: 'password',
        admin: true,
    });
    user.save((err) => {
        if (err) {
            throw err;
        }
        console.log('User saved successfully');
        res.json({ success: true });
    });
});
apiRoutes.get('/users', (req, res) => {
    User.find({}, (err, users) => {
        if (err) {
            throw err;
        }
        res.json(users);
    });
});
apiRoutes.post('/authenticate', (req, res) => {
    User.findOne({
        name: req.body.name,
    }, (err, user) => {
        if (err) {
            throw err;
        }
        if (!user) {
            res.json({
                success: false,
                message: 'Authentication failed, User not found',
            });
        } else if (user) {
            if (user.password !== req.body.password) {
                res.json({
                    success: false,
                    message: 'Authentication failed, Incorrect password',
                });
            } else {
                const payload = {
                    admin: user.admin,
                };
                const token = jwt.sign(payload, app.get('superSecret'), {
                    expiresInMinutes: 1440,
                });
                // Send token in response
                res.json({
                    success: true,
                    message: 'Enjoy your token',
                    token,
                });
            }
        }
    });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT);
