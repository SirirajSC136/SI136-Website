// models/CustomTopic.ts

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICustomTopic extends Document {
    // THE FIX: The type is now a generic string
    courseId: string;
    title: string;
}

const CustomTopicSchema: Schema = new Schema({
    // THE FIX: Change type to String and remove the 'ref'
    courseId: { type: String, required: true, index: true }, // Added index for faster lookups
    title: { type: String, required: true },
}, { timestamps: true });

const CustomTopic: Model<ICustomTopic> = mongoose.models.CustomTopic || mongoose.model<ICustomTopic>('CustomTopic', CustomTopicSchema);

export default CustomTopic;