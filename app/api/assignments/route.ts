// app/api/assignments/route.ts

import { NextResponse } from 'next/server';
import { AssignmentItem } from '@/types';

// Helper function to fetch and parse CSV data
async function fetchAndParseCsv(url: string): Promise<any[]> {
    try {
        const response = await fetch(url, { next: { revalidate: 900 } }); // Revalidate every hour
        if (!response.ok) throw new Error(`Failed to fetch CSV from ${url}`);

        const text = await response.text();
        const rows = text.split('\n').map(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim());

        return rows.slice(1).map(row => {
            // This CSV parser is simple and may not handle commas within quotes.
            // For this sheet, it works perfectly.
            const values = row.split(',');
            const obj: { [key: string]: string } = {};
            headers.forEach((header, index) => {
                obj[header] = values[index]?.trim() || '';
            });
            return obj;
        });
    } catch (error) {
        console.error("CSV Fetch/Parse Error:", error);
        return [];
    }
}

export async function GET() {
    // This is the public CSV export URL for your sheet
    const ASSIGNMENTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1omRhuSvS5qyXoXKRraKTJe0scagdxaWcENRGixja5cw/export?format=csv&gid=0';

    try {
        const rawData = await fetchAndParseCsv(ASSIGNMENTS_CSV_URL);

        // Map the raw data to our strongly-typed AssignmentItem
        const assignments: AssignmentItem[] = rawData
            .filter(row => row['Work Name']) // Filter out any empty rows
            .map((row, index) => ({
                id: `${index}-${row['Work Name']}`, // Create a simple unique ID
                workName: row['Work Name'],
                deadline: row['Deadline'],
                subject: row['Subject'],
                // The header for the details URL is in Thai
                detailsUrl: row['รายละเอียดเพิ่มเติม'],
            }));

        return NextResponse.json(assignments);

    } catch (error) {
        console.error('Error in GET /api/assignments:', error);
        return NextResponse.json(
            { error: 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}