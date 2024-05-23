import express from 'express';
import pkg from 'jsonwebtoken';
import bodyParser from 'body-parser';
const app = express();
import cors from 'cors'

// Secret key for signing JWT tokens
const secretKey = 'sdknjrvbwqwdbqucebwfiiuyvqbd';
const { json } = bodyParser

app.use(json());
app.use(cors())



// Mock user database
const users = [
    { id: 1, username: 'user1', password: 'password1' },
    { id: 2, username: 'user2', password: 'password2' },
    { id: 3, username: 'test', password: 'test' },
];

// health
app.get("/health", (req, res) => {
    console.log("test")
    return res.status(200).json({ 'status': 'ok' })
})


// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log("Logged in triggered")
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Generate JWT token
    const token = pkg.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
    res.json({ token });
});

// Protected route
app.get('/protected', verifyToken, (req, res) => {
    // If token is valid, respond with protected data
    res.json({ message: 'Protected data' });
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    pkg.verify(token, secretKey, (err, decoded) => {
        if (err) {
            console.log(err.message)
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.userId = decoded.userId;
        next();
    });
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
export const login = (token) => ({
    type: 'LOGIN',
    payload: token,
});

export const logout = () => ({
    type: 'LOGOUT',
});
