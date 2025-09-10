import { Subject } from '@/types';
import { subjectImages } from './subject-images'; // <-- Import our images

export const subjects: Subject[] = [
    // --- Year 3 ---
    {
        id: 'siid343',
        courseCode: 'SIID343',
        title: 'DISORDERS OF URINARY SYSTEM',
        year: 3,
        semester: 1,
        imageUrl: subjectImages.monke, // <-- Use the imported image object
        canvasUrl: '#',
        topics: [
            { id: 1, title: 'Introduction', dateTime: '14/8/2568 10:30', tag: 'Lec', resources: [{ type: 'Handout', url: '#' }, { type: 'Video', url: '#' }] },
            { id: 2, title: 'Principle of Urinalysis', dateTime: '14/8/2568 11:00', tag: 'Lec', resources: [{ type: 'Handout', url: '#' }, { type: 'Exercise', label: 'Exercise (Optional)', url: '#' }] },
            { id: 4, title: 'Glomerular diseases 1', dateTime: '15/8/2568 10:00', tag: 'Lec', resources: [{ type: 'Handout', url: '#' }, { type: 'GA Problems', url: '#' }, { type: 'Lecture', url: '#' }] },
            {
                id: 9, title: 'Obstruction & kidney tumors', dateTime: '22/8/2568 09:00', tag: 'Async', resources: [{ type: 'Handout', url: '#' }, { type: 'Lecture', url: '#' }, { type: 'Summary', label: 'Summary (SI133)', url: '#' }],
                assignments: [
                    { title: 'ใบงาน Obstruction and Kidney Tumors', dueDate: '29/8/2568 16:00', status: 'Overdue', description: 'แบบฝึกหัดประกอบด้วย โจทย์ผู้ป่วย 3 ราย...\nสามารถ download งานกลุ่ม ได้ในวันที่ 19 สิงหาคม 2568...\nส่งที่ canvas (หลังเวลา 16.00 น.ระบบจะปิดรับงาน)', fileUrl: '#' }
                ]
            },
            {
                id: 12, title: 'Infection in urinary system 1', dateTime: '2/9/2568 10:00', tag: 'GA', resources: [{ type: 'Handout', url: '#' }, { type: 'Video', url: '#' }],
                assignments: [
                    { title: 'CLO assessment 1-3', dueDate: '8/9/2568 23:59', status: 'Overdue', description: 'เปิดให้ทำ 18 สิงหาคม 2568 แต่ละ CLO ทำได้จำนวน 5 ครั้ง เกณฑ์ผ่าน 80%' }
                ]
            },
            { id: 99, title: 'Summative', dateTime: '17/10/2568 13:00', tag: 'Test', resources: [] }
        ]
    },
    {
        id: 'siid344',
        courseCode: 'SIID344',
        title: 'PRINCIPLES OF INVESTIGATIVE AND THERAPEUTIC MEDICINE',
        year: 3,
        semester: 1,
        imageUrl: subjectImages.monke,
        topics: [
            { id: 1, title: 'Intro to Therapeutics', tag: 'Lec', resources: [{ type: 'Handout', url: '#' }] },
            { id: 2, title: 'Pharmacokinetics & Pharmacodynamics', tag: 'Async', resources: [{ type: 'Lecture', url: '#' }, { type: 'Video', url: '#' }] },
        ]
    },
    {
        id: 'siid347',
        courseCode: 'SIID347',
        title: 'DISORDERS OF CIRCULATORY SYSTEM',
        year: 3,
        semester: 1,
        imageUrl: subjectImages.monke,
        topics: [
            { id: 1, title: 'Anatomy of the Heart', tag: 'Lec', resources: [{ type: 'Handout', url: '#' }, { type: 'Summary', url: '#' }] },
            { id: 2, title: 'ECG Interpretation Basics', tag: 'LAB', resources: [{ type: 'Handout', url: '#' }, { type: 'Exercise', url: '#' }] },
            { id: 3, title: 'Hypertension Management', tag: 'GA', resources: [{ type: 'GA Problems', url: '#' }] },
            { id: 4, title: 'Ischemic Heart Disease', tag: 'Async', resources: [{ type: 'Lecture', url: '#' }, { type: 'Video', url: '#' }] },
        ]
    },
    // --- Year 2 ---
    {
        id: 'siid243',
        courseCode: 'SIID243',
        title: 'THE HUMAN LIFE',
        year: 2,
        semester: 2,
        imageUrl: subjectImages.monke,
        topics: [
            { id: 1, title: 'Genetics and Human Development', tag: 'Lec', resources: [{ type: 'Handout', url: '#' }] },
            { id: 2, title: 'Ethical Considerations', tag: 'TBL', resources: [{ type: 'Handout', url: '#' }] },
        ]
    },
    {
        id: 'siid244',
        courseCode: 'SIID244',
        title: 'HUMANISTIC HEALTHCARE',
        year: 2,
        semester: 2,
        imageUrl: subjectImages.monke,
        topics: [
            { id: 1, title: 'Doctor-Patient Relationship', tag: 'FC', resources: [{ type: 'Handout', url: '#' }] },
            { id: 2, title: 'Communication Skills Workshop', tag: 'Online', resources: [{ type: 'Video', url: '#' }] },
        ]
    },
    {
        id: 'siid249',
        courseCode: 'SIID249',
        title: 'URINARY SYSTEM',
        year: 2,
        semester: 2,
        imageUrl: subjectImages.monke,
        topics: [
            { id: 1, title: 'Renal Physiology', tag: 'Lec', resources: [{ type: 'Handout', url: '#' }, { type: 'Lecture', url: '#' }] },
            { id: 2, title: 'Kidney Anatomy Lab', tag: 'LAB', resources: [{ type: 'Handout', url: '#' }] },
        ]
    },
];