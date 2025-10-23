const mongoose = require('mongoose');

// Connect with retry/backoff
const connectWithRetry = async (maxAttempts = 5) => {
    let attempt = 0;
    const connect = async () => {
        attempt++;
        try {
            const conn = await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return conn;
        } catch (err) {
            console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
            if (attempt >= maxAttempts) {
                console.error('Max MongoDB connection attempts reached. Exiting.');
                throw err;
            }
            const delay = Math.min(2000 * Math.pow(2, attempt - 1), 30000);
            console.log(`Retrying MongoDB connection in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return connect();
        }
    };

    return connect();
};

module.exports = connectWithRetry;