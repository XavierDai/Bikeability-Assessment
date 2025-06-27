require('dotenv').config();
const mongoose = require('mongoose');


const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@<cluster-url>/bikeability?retryWrites=true&w=majority';


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: Connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;