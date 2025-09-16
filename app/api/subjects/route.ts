// app/api/subjects/route.ts

import { NextResponse } from 'next/server';
import { Subject } from '@/types';

// Exporting the mock data so it can be used in server components for testing if needed
export const mockSubjects: Subject[] = [
    {
        id: 'si-101',
        courseCode: 'SI-101',
        title: 'Human Anatomy I',
        year: 1,
        semester: 1,
        imageUrl: '/images/subjects/anatomy.jpg',
        canvasUrl: 'https://canvas.example.com/courses/101',
        topics: [
            {
                id: '1',
                title: 'Introduction to Gross Anatomy',
                dateTime: 'Mon, Sep 8 @ 9:00 AM',
                tag: 'Lec',
                resources: [
                    { type: 'Slides', title: 'Lec 01 - Intro.pdf', url: '#' },
                    { type: 'Video', title: 'Lecture Recording', url: '#' },
                ],
            },
            {
                id: '2',
                title: 'Upper Limb Musculoskeletal System',
                dateTime: 'Wed, Sep 10 @ 10:00 AM',
                tag: 'LAB',
                resources: [
                    { type: 'PDF', title: 'Lab Manual.pdf', url: '#' },
                ],
                assignments: [
                    { title: 'Lab Report 1', dueDate: 'Sep 17, 2025', url: '#' }
                ]
            },
        ],
    },
    // --- ADD THIS DATA ---
    {
        id: 'si-201',
        courseCode: 'SI-201',
        title: 'General Pathology',
        year: 2,
        semester: 1,
        imageUrl: '/images/subjects/pathology.jpg',
        canvasUrl: 'https://canvas.example.com/courses/201',
        topics: [
            {
                id: '1',
                title: 'Cell Injury, Death, and Adaptation',
                dateTime: 'Tue, Sep 9 @ 1:00 PM',
                tag: 'Lec',
                resources: [
                    { type: 'Slides', title: 'Patho-Lec-01.pdf', url: '#' },
                ],
            },
            {
                id: '2',
                title: 'Inflammation and Repair',
                dateTime: 'Thu, Sep 11 @ 2:00 PM',
                tag: 'GA',
                resources: [
                    { type: 'PDF', title: 'Group Assignment Brief.pdf', url: '#' },
                    { type: 'Link', title: 'Reference Material', url: '#' },
                ],
                assignments: [
                    { title: 'Case Study 1', dueDate: 'Sep 20, 2025', url: '#' }
                ]
            },
        ],
    },
    // You can add more subjects for testing
    {
        id: 'si-102',
        courseCode: 'SI-102',
        title: 'Medical Physiology I',
        year: 1,
        semester: 1,
        imageUrl: '/images/subjects/physiology.jpg',
        canvasUrl: 'https://canvas.example.com/courses/102',
        topics: [
            {
                id: '1',
                title: 'Cellular Physiology & Homeostasis',
                tag: 'Async',
                resources: [
                    { type: 'Video', title: 'Async Lecture Video', url: '#' },
                ],
            },
        ],
    },
];


export async function GET() {
    try {
        return NextResponse.json(mockSubjects);
    } catch (error) {
        console.error('Error in GET /api/subjects:', error);
        return NextResponse.json(
            { error: 'An internal server error occurred.' },
            { status: 500 }
        );
    }
} 