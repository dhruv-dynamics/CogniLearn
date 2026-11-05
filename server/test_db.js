import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const testQuery = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    const coll = db.collection("lessons");
    const lesson = await coll.findOne({});
    console.log("A Lesson from DB:", JSON.stringify(lesson, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
};

testQuery();
