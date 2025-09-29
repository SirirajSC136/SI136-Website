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




export interface AssignmentItem {
    id: string; // A unique ID, we'll use the row index for this
    workName: string;
    deadline: string;
    subject: string;
    detailsUrl: string;
}


export type TopicItemType = 'File' | 'Page' | 'Link' | 'Header' | 'Other';

export type TopicItemData = {
    id: string; // The Canvas or custom unique ID (e.g., "custom-123")
    _id?: string; // <-- ADD THIS LINE. The optional MongoDB document ID
    title: string;
    type: TopicItemType;
    url?: string;
    htmlContent?: string;
    canvasUrl?: string;
};

// Update the Topic type to hold these new, richer items
export type Topic = {
    id: string;
    title: string;
    items: TopicItemData[]; // <-- Changed from 'files: TopicFile[]'
};

// The main Subject type
export type Subject = {
    _id: string;
    courseCode: string;
    title: string;
    year: number;
    semester: number;
    imageUrl: string;
    canvasUrl: string;
    filesUrl: string;
    syllabus: string;
    topics: Topic[]; // This now contains the richer Topic structure
};

export interface CalendarEvent {
    id: string;
    courseCode: string;
    title: string;
    startTime: string;
    tag: string;
    details: string;
    subjectPageUrl: string;
}

export interface Task {
    id: string;
    type: 'assignment' | 'examination';
    courseCode: string;
    subjectTitle: string;
    title: string;
    deadline: string;
    subjectId: string;
}