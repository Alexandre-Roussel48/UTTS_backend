const { isAdmin, createUser, checkUser, getUser, getUsers, deleteUser, updateLastConnection, getLeaderboard } = require('../models/userModel');
const jwt = require('jsonwebtoken');

exports.checkConnection = async (req, res) => {
    const user = await getUser(req.authData.user_id);
    if (!user) {
        return res.status(200).json({ status: 'Error checking user' });
    }

    res.json({
            username: user.username,
            is_admin: user.is_admin,
            next_card: user.next_card,
            next_theft: user.next_theft
    });
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

        const user_data = await createUser(data);

        let token;
        if (data.remember) {
            token = jwt.sign({ user_id: user_data.id }, process.env.SECRET_KEY);
        } else {
            token = jwt.sign({ user_id: user_data.id }, process.env.SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
            refresh_token = jwt.sign({ user_id: user_data.id }, process.env.REFRESH_SECRET_KEY, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });

            res.cookie('refreshToken', refresh_token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                sameSite: 'Lax',
                domain: process.env.DOMAIN,
                secure: true
            });
        }

        res.cookie('authToken', token, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000,
            sameSite: 'Lax',
            domain: process.env.DOMAIN,
            secure: true
        });

        res.json({
            is_admin: user_data.is_admin,
            next_card: user_data.next_card,
            next_theft: user_data.next_theft
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: 'Something went wrong' });
    }
};

exports.login = async (req, res) => {
    try {
        const data = req.body;
        if (!data.username || !data.password) {
            return res.status(400).json({ status: 'Username and password are required' });
        }

        const user_data = await getUser(data);

        let token;
        if (data.remember) {
            token = jwt.sign({ user_id: user_data.id }, process.env.SECRET_KEY);
        } else {
            token = jwt.sign({ user_id: user_data.id }, process.env.SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
            refresh_token = jwt.sign({ user_id: user_data.id }, process.env.REFRESH_SECRET_KEY, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });

            res.cookie('refreshToken', refresh_token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                sameSite: 'Lax',
                domain: process.env.DOMAIN,
                secure: true
            });
        }

        res.cookie('authToken', token, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000,
            sameSite: 'Lax',
            domain: process.env.DOMAIN,
            secure: true
        });

        res.json({
            is_admin: user_data.is_admin,
            next_card: user_data.next_card,
            next_theft: user_data.next_theft
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 'Register before logging in' });
    }
};

exports.logout = async (req, res) => {
    res.clearCookie('authToken', {
        path: '/',
        domain: process.env.DOMAIN,
        secure: true,
        sameSite: 'Lax',
        httpOnly: true
    });
    res.clearCookie('refreshToken', {
        path: '/',
        domain: process.env.DOMAIN,
        secure: true,
        sameSite: 'Lax',
        httpOnly: true
    });
    return res.status(200).json({ status: 'User logged out' });
};