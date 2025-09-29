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
    canvasCourseId: number;
    canvasModuleId: number;
    item: {
        id: string;
        title: string;
        type: 'File' | 'Link' | 'Page';
        url?: string;
        htmlContent?: string;
    };
}

const CustomMaterialSchema: Schema = new Schema({
    canvasCourseId: { type: Number, required: true, index: true },
    canvasModuleId: { type: Number, required: true, index: true },
    item: { type: ItemSchema, required: true },
});

// Prevent model recompilation in Next.js hot-reloading environments
const CustomMaterial: Model<ICustomMaterial> = mongoose.models.CustomMaterial || mongoose.model<ICustomMaterial>('CustomMaterial', CustomMaterialSchema);

export default CustomMaterial;