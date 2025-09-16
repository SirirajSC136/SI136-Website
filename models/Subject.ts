// models/Subject.ts
import mongoose, { Schema, Document, models } from 'mongoose';
import { Subject as ISubject, Topic as ITopic, Resource as IResource, Assignment as IAssignment } from '@/types';

// Define sub-schemas for nested data to ensure structure
const ResourceSchema: Schema = new Schema({
    type: { type: String, enum: ['PDF', 'Slides', 'Video', 'Link'], required: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
});

const AssignmentSchema: Schema = new Schema({
    title: { type: String, required: true, trim: true },
    dueDate: { type: String, required: true },
    url: { type: String, required: true },
});

const TopicSchema: Schema = new Schema({
    id: { type: String, required: true }, // e.g., "1", "2"
    title: { type: String, required: true, trim: true },
    dateTime: { type: String },
    tag: { type: String },
    resources: [ResourceSchema],
    assignments: [AssignmentSchema],
});

// Define the main Subject schema
const SubjectSchema: Schema = new Schema({
    // We use courseCode as the primary, human-readable identifier
    courseCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    title: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    canvasUrl: { type: String },
    topics: [TopicSchema],
});

// This prevents Mongoose from recompiling the model on every hot-reload
export default models.Subject || mongoose.model<ISubject & Document>('Subject', SubjectSchema);
