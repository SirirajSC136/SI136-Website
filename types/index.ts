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


// Define the possible tags for a topic
export type TopicTag = 'Lec' | 'Async' | 'GA' | 'LAB' | 'Test' | 'FC' | 'TBL' | 'Online';

export interface Resource {
    type: 'PDF' | 'Slides' | 'Video' | 'Link';
    title: string;
    url: string;
}

// Define the type for an assignment
export interface Assignment {
    title: string;
    dueDate: string;
    url: string;
}

// Update the Topic interface to include all the new fields
// Update the Topic interface to include _id from MongoDB
export interface Topic {
    _id?: string; // Optional: from MongoDB
    id: string; // The original identifier like "1", "2"
    title: string;
    dateTime?: string;
    tag?: TopicTag;
    resources: Resource[];
    assignments?: Assignment[];
}

// Update the Subject interface
export interface Subject {
    _id?: string; // Add the optional _id from MongoDB
    // id: string; // REMOVE the old 'id' property
    courseCode: string;
    title: string;
    year: number;
    semester: number;
    imageUrl: string;
    canvasUrl: string | null;
    topics: Topic[];
}

// Update the Task interface
export interface Task {
    _id?: string; // Add the optional _id from MongoDB
    type: 'assignment' | 'examination';
    courseCode: string;
    title: string;
    deadline: string;
    resources: Resource[];
}

export interface AssignmentItem {
    id: string; // A unique ID, we'll use the row index for this
    workName: string;
    deadline: string;
    subject: string;
    detailsUrl: string;
}

export interface CalendarEvent {
    id: string;
    courseCode: string;
    title: string;
    startTime: string; // ISO 8601 format string (e.g., "2025-10-10T10:00:00")
    tag: string;
    details: string;
    subjectPageUrl: string; // e.g., "/academics/siid350"
}



