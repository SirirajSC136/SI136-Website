// models/CustomTopic.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomTopic extends Document {
    courseId: string; // The ID of the course it belongs to (Canvas or custom)
    title: string;
}

const CustomTopicSchema: Schema = new Schema({
    courseId: { type: String, required: true, index: true },
    title: { type: String, required: true },
});

const CustomTopic: Model<ICustomTopic> = mongoose.models.CustomTopic || mongoose.model<ICustomTopic>('CustomTopic', CustomTopicSchema);

export default CustomTopic;