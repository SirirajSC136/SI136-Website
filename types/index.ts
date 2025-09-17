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


export interface TopicFile {
    id: string;
    title: string;
    url: string;
}

export interface Topic {
    id: string;
    title: string;
    files: TopicFile[];
}

export interface Subject {
    _id: string;
    courseCode: string;
    title: string;
    year: number;
    semester: number;
    imageUrl: string;
    canvasUrl?: string;
    filesUrl?: string; // NEW: Direct link to the Canvas Files page
    syllabus?: string; // NEW: The course syllabus/description HTML
    topics: Topic[];
}

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