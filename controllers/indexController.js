const { createOrUpdateUser, checkUser } = require('../models/userModel');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const data = req.body;
        if (!data.username || !data.password) {
            return res.status(400).json({ status: 'Username and password are required' });
        }

        await createOrUpdateUser(data);

        const check_data = await checkUser(data);

        const user_data = check_data.user;

        const token = jwt.sign({ user_id: user_data.id }, process.env.SECRET_KEY, { expiresIn: '1h' });

        res.json({
            token: token,
            connection_count: user_data.connection_count,
            next_card: user_data.next_card,
            next_theft: user_data.next_theft
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const data = req.body;
        if (!data.username || !data.password) {
            return res.status(400).json({ status: 'Username and password are required' });
        }

        const check_data = await checkUser(data);
        const user_data = check_data.user;
        const thefts = check_data.thefts;

        const token = jwt.sign({ user_id: user_data.id }, process.env.SECRET_KEY, { expiresIn: '1h' });

        res.json({
            token: token,
            connection_count: user_data.connection_count,
            next_card: user_data.next_card,
            next_theft: user_data.next_theft,
            thefts: thefts
        });
    } catch (error) {
        return res.status(500).json({ status: 'Register before logging in' });
    }
};