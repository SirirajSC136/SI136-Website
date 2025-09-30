// models/CustomCourse.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

// This defines the structure of a topic within a custom course
const TopicSchema = new Schema({
    title: { type: String, required: true },
});

export interface ICustomCourse extends Document {
    courseCode: string;
    title: string;
    year: number;
    semester: number;
    // An array of topics that belong to this course
    topics: { _id: mongoose.Types.ObjectId; title: string }[];
}

const CustomCourseSchema: Schema = new Schema({
    courseCode: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    topics: [TopicSchema],
});

const CustomCourse: Model<ICustomCourse> = mongoose.models.CustomCourse || mongoose.model<ICustomCourse>('CustomCourse', CustomCourseSchema);

export default CustomCourse;