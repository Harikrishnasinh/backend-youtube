import mongoose, { Schema, mongo } from "mongoose";

const subscrptionSchema = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

export const Subscribe = mongoose.model("Subscribe", subscrptionSchema);
