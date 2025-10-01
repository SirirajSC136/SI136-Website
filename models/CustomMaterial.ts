// models/CustomMaterial.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// THE FIX: Remove the 'id' field from the sub-schema.
const ItemSchema = new Schema({
    title: { type: String, required: true },
    type: { type: String, required: true, enum: ['File', 'Link', 'Page'] },
    url: { type: String },
    htmlContent: { type: String },
});

export interface ICustomMaterial extends Document {
    courseId: string;
    topicId: string;
    item: {
        title: string;
        type: 'File' | 'Link' | 'Page';
        url?: string;
        htmlContent?: string;
    };
}

const CustomMaterialSchema: Schema = new Schema({
    courseId: { type: String, required: true, index: true },
    topicId: { type: String, required: true, index: true },
    item: { type: ItemSchema, required: true },
});

const CustomMaterial: Model<ICustomMaterial> =
    mongoose.models.CustomMaterial ||
    mongoose.model<ICustomMaterial>('CustomMaterial', CustomMaterialSchema, 'custom_materials');

export default CustomMaterial;