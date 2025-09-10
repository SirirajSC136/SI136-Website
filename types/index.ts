import { StaticImageData } from 'next/image'; // <-- Import this type

export interface IActivity {
    id: string;
    type: 'event' | 'assignment' | 'examination';
    courseCode: string;
    title: string;
    dateTime: string; // Using string for simplicity in hardcoded data
    details?: string;
    tag?: string;
}

// Add these new types to your existing types/index.ts file

export interface Resource {
    type: 'Handout' | 'Video' | 'Lecture' | 'Exercise' | 'GA Problems' | 'Summary' | 'Other';
    label?: string; // Optional custom label, e.g., "Exercise (Optional)"
    url: string;
}

export interface Assignment {
    title: string;
    dueDate: string;
    status: 'Overdue' | 'Upcoming';
    description: string;
    fileUrl?: string;
}

export interface Topic {
    id: number;
    title: string;
    dateTime?: string;
    tag?: 'Lec' | 'Async' | 'GA' | 'LAB' | 'FC' | 'TBL' | 'Online' | 'Test';
    resources: Resource[];
    assignments?: Assignment[];
}

export interface Subject {
    id: string;
    courseCode: string;
    title: string;
    year: number;
    semester: number;
    imageUrl: StaticImageData; // <-- Change this from string to StaticImageData
    canvasUrl?: string;
    topics: Topic[];
}