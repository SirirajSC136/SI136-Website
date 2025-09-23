// app/api/assignments/route.ts

import { NextResponse } from 'next/server';

// Helper function to fetch CSV data as text
async function fetchCsvText(url: string) {
    try {
        const response = await fetch(url);

        // Check if the request was successful
        if (!response.ok) {
            // Log the error and return null if the fetch failed
            console.error(`HTTP error! status: ${response.status}`);
            return null;
        }

        // Get the body of the response as plain text
        const csvText = await response.text();
        console.log(csvText)
        return csvText;

    } catch (error) {
        console.error("Failed to fetch CSV:", error);
        return null;
    }
}

export async function GET() {
    const ASSIGNMENTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1w9JQbGU-4orrFGwmOBiUYxIiAQGjp4AfmlkPv3TOYoA/edit?gid=0#gid=0';

    // Await the result from the helper function
    const csvData = await fetchCsvText(ASSIGNMENTS_CSV_URL);

    // --- This is the crucial part that was missing ---

    // If fetching the data failed, return a 500 server error response
    if (csvData === null) {
        return NextResponse.json(
            { error: 'Failed to fetch assignments data.' },
            { status: 500 }
        );
    }

    // If successful, return the CSV data as a response.
    // We set the Content-Type header so the browser knows it's a CSV file.
    return
}