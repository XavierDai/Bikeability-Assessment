const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB();

const app = express();

// 为所有请求启用 CORS
app.use(cors());

// Body parser 中间件
app.use(express.json());

// 路由
app.use('/api/ratings', require('./routes/ratings'));

// 简单的健康检查路由
app.get('/', (req, res) => {
  res.send('自行车适宜性评估 API 正在运行');
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('出现了一些问题！');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`服务器在 ${process.env.NODE_ENV || '开发'} 模式下运行，端口：${PORT}`);
});