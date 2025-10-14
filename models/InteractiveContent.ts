// models/InteractiveContent.ts

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IInteractiveContent extends Document {
    courseId: mongoose.Schema.Types.ObjectId;
    title: string;
    contentType: 'Quiz' | 'Flashcard';
    content: any; // Flexible field to store the JSON data for the quiz or flashcards
}

const InteractiveContentSchema: Schema = new Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomCourse', required: true },
    title: { type: String, required: true },
    contentType: { type: String, required: true, enum: ['Quiz', 'Flashcard'] },
    content: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

// Avoid recompiling the model if it already exists
const InteractiveContent: Model<IInteractiveContent> = mongoose.models.InteractiveContent || mongoose.model<IInteractiveContent>('InteractiveContent', InteractiveContentSchema);

export default InteractiveContent;