// models/Task.ts
import mongoose, { Schema, Document, models } from 'mongoose';
import { Task as ITask } from '@/types';

// Define a sub-schema for resources
const ResourceSchema: Schema = new Schema({
    type: {
        type: String,
        enum: ['PDF', 'Slides', 'Video', 'Link'],
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    url: {
        type: String,
        required: true,
        trim: true,
    },
});

const TaskSchema: Schema = new Schema({
    type: {
        type: String,
        enum: ['assignment', 'examination'],
        required: true,
    },
    courseCode: {
        type: String,
        required: true,
        trim: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    deadline: {
        type: Date,
        required: true,
    },
    // Add the resources array using the sub-schema
    resources: [ResourceSchema],
});

export default models.Task || mongoose.model<ITask & Document>('Task', TaskSchema);