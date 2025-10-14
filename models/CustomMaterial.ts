// models/CustomMaterial.ts

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICustomMaterial extends Document {
    // THE FIX: The type is now a generic string
    courseId: string;
    topicId: string; // Also ensure this is a string for consistency
    item: any;
}

const CustomMaterialSchema: Schema = new Schema({
    // THE FIX: Change type to String and remove the 'ref'
    courseId: { type: String, required: true, index: true }, // Added index for faster lookups
    topicId: { type: String, required: true, index: true },
    item: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

const CustomMaterial: Model<ICustomMaterial> = mongoose.models.CustomMaterial || mongoose.model<ICustomMaterial>('CustomMaterial', CustomMaterialSchema);

export default CustomMaterial;