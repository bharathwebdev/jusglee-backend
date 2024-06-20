import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {

        userId: String,
        items: Array,
        totalAmount: Number,
        status: String,
    }
);


const Order = mongoose.model('Order', orderSchema);

export default Order;