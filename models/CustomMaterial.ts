// models/CustomMaterial.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the structure of a single custom item
const ItemSchema = new Schema({
    id: { type: String, required: true, unique: true }, // e.g., "custom-168..."
    title: { type: String, required: true },
    type: { type: String, required: true, enum: ['File', 'Link', 'Page'] },
    url: { type: String },
    htmlContent: { type: String },
});

// Define the main document structure
export interface ICustomMaterial extends Document {
    courseId: string; // Can be Canvas ID (e.g., "1106") or Mongo ObjectId
    topicId: string;  // Can be Canvas Module ID (e.g., "35065") or Mongo ObjectId
    item: {
        id: string;
        title: string;
        type: 'File' | 'Link' | 'Page';
        url?: string;
        htmlContent?: string;
    };
}

const CustomMaterialSchema: Schema = new Schema({
    // Update the types to String and rename the fields
    courseId: { type: String, required: true, index: true },
    topicId: { type: String, required: true, index: true },
    item: { type: ItemSchema, required: true },
});


// Prevent model recompilation in Next.js hot-reloading environments
const CustomMaterial: Model<ICustomMaterial> =
    mongoose.models.CustomMaterial ||
    mongoose.model<ICustomMaterial>('CustomMaterial', CustomMaterialSchema, 'custom_materials');

export default CustomMaterial;