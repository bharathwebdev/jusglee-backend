import express from 'express';
import pkg from 'jsonwebtoken';
import bodyParser from 'body-parser';
const app = express();
import cors from 'cors'
import mongoose from 'mongoose';
import { Kafka, Partitioners } from 'kafkajs';
// Secret key for signing JWT tokens
const secretKey = 'sdknjrvbwqwdbqucebwfiiuyvqbd';
const { json } = bodyParser

app.use(json());
app.use(cors());
import Order from './model/Order.js';




// Mock user database
const users = [
    { id: 1, username: 'user1', password: 'password1' },
    { id: 2, username: 'user2', password: 'password2' },
    { id: 3, username: 'test', password: 'test' },
];

mongoose.connect('mongodb+srv://bharath:testing123456@cluster0.z1y9zvl.mongodb.net/justglee')
    .then(() => console.log('MongoDB connected to justglee'))
    .catch(err => console.error(err));

// Initialize Kafka
const kafka = new Kafka({ clientId: 'food-delivery-app', brokers: ['localhost:9092'] });
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner })

app.post('/api/orders', async (req, res) => {

    console.log(req.body)
    const orderData = {
        userId: req.body.userId,
        items: req.body.items,
        totalAmount: req.body.totalAmount,
        status: req.body.status,
    }
    const pushToken = req.body.pushToken
    try {
        const order = new Order(orderData);
        await order.save();
        await producer.connect();

        await producer.send({
            topic: 'orders',
            messages: [{ value: JSON.stringify({ type: 'ORDER_PLACED', orderId: order._id, pushToken }) }],
        });
    } catch (err) {
        console.error(err)
        res.status(500).send('Error Placing  order');
    }
    res.status(201).send('order placed');
    // if (order.userId && order.restaurantId && order.items && order.totalAmount && order.paymentStatus === 'paid') {
    //     producer.send([{ topic: 'orders', messages: JSON.stringify(order) }], (err, data) => {
    //         if (err) {
    //             res.status(500).send('Error queueing order');
    //         } else {
    //             res.status(200).send('Order placed successfully');
    //         }
    //     });
    // } else {
    //     res.status(400).send('Invalid order data');
    // }
});



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


