const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false); // Set strictQuery to false

    // Use the environment variable if it exists, otherwise use a fallback URI
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/CURD ';

    await mongoose.connect(mongoURI, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
