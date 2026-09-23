import mongoose from "mongoose";

const configOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectToDB = async () => {
  const connectionUrl = process.env.DATABASE_URL;

  if (!connectionUrl) {
    throw new Error(
      "DATABASE_URL is not set. Please add it to your .env.local file (see .env.example)."
    );
  }

  // Reuse an existing connection instead of opening a new one on every call.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(connectionUrl, configOptions);
    console.log("Ecommerce database connected successfully!");
    return mongoose.connection;
  } catch (err) {
    console.log(`Getting Error from DB connection ${err.message}`);
    throw err;
  }
};

export default connectToDB;
