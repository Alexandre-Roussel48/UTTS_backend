const { isAdmin, createOrUpdateUser, checkUser, getUser, getUsers, deleteUser, updateLastConnection, getLeaderboard } = require('../models/userModel');
const jwt = require('jsonwebtoken');

exports.checkConnection = async (req, res) => {
    if (typeof req.cookies.authToken !== 'undefined') {
        const bearerToken = req.cookies.authToken;
        jwt.verify(bearerToken, process.env.SECRET_KEY, (err, authData) => {
            if (err) {
                return res.status(200).json({ status: 'Error checking connection' });
            } else {
                req.authData = authData;
            }
        });
        const check_data = await getUser(req.authData.user_id, req.body.increment);
        if (!check_data) {
            return res.status(200).json({ status: 'Error checking connection' });
        }
        const user_data = check_data.user;
        const thefts = check_data.thefts;

        res.json({
            user_data : {
                username: user_data.username,
                connection_count: user_data.connection_count,
                is_admin: user_data.is_admin,
                next_card: user_data.next_card,
                next_theft: user_data.next_theft,
                thefts: thefts
            }
        });
    } else {
        return res.status(200).json({ status: 'Error checking connection' });
    }

};

exports.getLeaderboard = async(req, res) => {
    try {
        const users = await getLeaderboard();
        res.json(users);
    } catch (error) {
        res.status(500).json({ status: 'Something went wrong' });
    }
};

exports.getUsers = async(req, res) => {
    try {
        if (isAdmin(req.authData.user_id)) {
            const users = await getUsers();
            res.json(users);
        } else {
            res.status(500).json({ status: 'Admin route' });
        }
    } catch (error) {
        res.status(500).json({ status: 'Something went wrong' });
    }
};

exports.deleteUser = async(req, res) => {
    try {
        if (isAdmin(req.authData.user_id)) {
            await deleteUser(req.body.user_id);
            res.status(200).json({ status: 'User deleted' });
        } else {
            res.status(500).json({ status: 'Admin route' });
        }
    } catch (error) {
        res.status(500).json({ status: 'Something went wrong' });
    }
};

exports.register = async (req, res) => {
    try {
        const data = req.body;
        if (!data.username || !data.password) {
            return res.status(400).json({ status: 'Username and password are required' });
        }

        await createOrUpdateUser(data);

        const check_data = await checkUser(data);

        const user_data = check_data.user;

        let token;
        if (data.remember) {
            token = jwt.sign({ user_id: user_data.id }, process.env.SECRET_KEY);
        } else {
            token = jwt.sign({ user_id: user_data.id }, process.env.SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
            refresh_token = jwt.sign({ user_id: user_data.id }, process.env.REFRESH_SECRET_KEY, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });

            res.cookie('refreshToken', refresh_token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                sameSite: 'none'
            });
        }

        res.cookie('authToken', token, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000,
            sameSite: 'none'
        });

        res.json({
            user_data: {
                connection_count: user_data.connection_count,
                is_admin: user_data.is_admin,
                next_card: user_data.next_card,
                next_theft: user_data.next_theft
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'Something went wrong' });
    }
};

exports.setLastConnection = async (req, res) => {
    if (typeof req.cookies.authToken !== 'undefined') {
        const bearerToken = req.cookies.authToken;
        jwt.verify(bearerToken, process.env.SECRET_KEY, (err, authData) => {
            if (err) {
                return res.status(200).json({ status: 'Error checking connection' });
            } else {
                req.authData = authData;
            }
        });
        await updateLastConnection(req.authData.user_id);
        return res.status(200).json({ status: 'Last connection set' });
    }
    return res.status(200).json({ status: 'Last connection not set' });
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

        let token;
        if (data.remember) {
            token = jwt.sign({ user_id: user_data.id }, process.env.SECRET_KEY);
        } else {
            token = jwt.sign({ user_id: user_data.id }, process.env.SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
            refresh_token = jwt.sign({ user_id: user_data.id }, process.env.REFRESH_SECRET_KEY, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });

            res.cookie('refreshToken', refresh_token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                sameSite: 'none'
            });
        }

        res.cookie('authToken', token, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000,
            sameSite: 'none'
        });

        res.json({
            user_data : {
                connection_count: user_data.connection_count,
                is_admin: user_data.is_admin,
                next_card: user_data.next_card,
                next_theft: user_data.next_theft,
                thefts: thefts
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 'Register before logging in' });
    }
};

exports.logout = async (req, res) => {
    res.clearCookie('authToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ status: 'User logged out' });
}