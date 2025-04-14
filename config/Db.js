const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.Mongo_URL);
        console.log("MonogDB Connected");
    }
    catch (err) {
        console.error("MongoDB connection error: ", err.message);
        process.exit(1);
    }
}

module.exports = connectDB;