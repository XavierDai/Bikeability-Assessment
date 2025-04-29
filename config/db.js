require('dotenv').config();
const mongoose = require('mongoose');

// 从环境变量中获取 MongoDB Atlas 连接字符串
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@<cluster-url>/bikeability?retryWrites=true&w=majority';

// 连接到 MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB 已连接: ${conn.connection.host}`);
  } catch (err) {
    console.error(`连接 MongoDB 出错: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;