import { Kafka } from 'kafkajs';
import Order from './model/Order.js';
import mongoose from 'mongoose';
import axios from 'axios';
const kafka = new Kafka({ clientId: 'order-service', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'order-group' });

mongoose.connect('mongodb+srv://bharath:testing123456@cluster0.z1y9zvl.mongodb.net/justglee')
    .then(() => console.log('MongoDB connected to justglee'))
    .catch(err => console.error(err));


 const sendPushNotification = async (pushToken) => {
        const url = 'https://exp.host/--/api/v2/push/send';
        const data = {
          title: "justglee green 💚",
          channel: "default",
          to:pushToken,
          sound: "default",
          body: "Your order confirmed"
        };
      
        try {
          const response = await axios.post(url, data, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          console.log('Successs sending push notification : ', response.data);
        } catch (error) {
          console.error('Error sending push notification : ', error.response ? error.response.data : error.message);
        }
      };

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'orders', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const event = JSON.parse(message.value.toString());

            if (event.type === 'ORDER_PLACED') {
                const orderId = event.orderId;
                // Process the order (e.g., update status, send notifications)
                console.log(`Order received: ${orderId}`);
                // Example: Update order status
                // Update order status in the database
                await Order.findOneAndUpdate({ _id: orderId }, { status: "confirm" })

                console.log(event.pushToken)
                sendPushNotification(event.pushToken)
                // const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: 'Confirmed' });
                // if (updatedOrder.isModified) {
                //     console.log("Updated the status in db")
                // } else {
                //     console.error("Error updating the status ")
                // }
            }
        },
    });
};

run().catch(console.error);
