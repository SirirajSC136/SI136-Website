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

// Define the type for a resource link (e.g., PDF, Slides)
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
export interface Topic {
    id: string;
    title: string;
    // Optional fields
    dateTime?: string;
    tag?: TopicTag;
    resources: Resource[]; // Can be an empty array
    assignments?: Assignment[]; // Can be undefined or empty
}

// The Subject type remains mostly the same, just uses the new Topic type
export interface Subject {
    id: string;
    courseCode: string;
    title: string;
    year: number;
    semester: number;
    imageUrl: string;
    canvasUrl: string | null;
    topics: Topic[];
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

// Represents an assignment or examination
export interface Task {
    id: string;
    type: 'assignment' | 'examination';
    courseCode: string;
    title: string;
    deadline: string; // ISO 8601 format string
}