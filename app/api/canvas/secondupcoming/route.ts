// app/api/canvas/secondupcoming/route.ts

import { NextResponse } from 'next/server';

/**
 * A generic and reusable helper function to parse any CSV text into an array of objects.
 * @param {string} csvText The raw CSV text data.
 * @returns {Record<string, string>[]} An array of objects, where keys are headers.
 */
function parseCSV(csvText: string): Record<string, string>[] {
  // Handle empty or invalid CSV text gracefully
  if (!csvText || typeof csvText !== 'string') {
    return [];
  }
  
  const lines = csvText.trim().split('\n');
  if (lines.length < 1) {
    return [];
  }

  // Use the first line as headers. Trim each header to remove extra whitespace.
  const headers = lines[0].split(',').map(header => header.trim());
  const data: Record<string, string>[] = [];

  // Loop through the data rows
  for (let i = 1; i < lines.length; i++) {
    // Skip empty lines
    if (!lines[i]) continue;

    const values = lines[i].split(',').map(value => value.trim());
    const entry: Record<string, string> = {};
    
    for (let j = 0; j < headers.length; j++) {
      // Assign value to the corresponding header key. Handle cases where a row has fewer columns than headers.
      entry[headers[j]] = values[j] || '';
    }
    data.push(entry);
  }
  
  return data;
}

// This is the Route Handler for the GET method
export async function GET(req: Request) {
  const ASSIGNMENTS_SHEET_ID = '1omRhuSvS5qyXoXKRraKTJe0scagdxaWcENRGixja5cw';
  const EXAMS_SHEET_ID = '11RdWKC338mjIA7f9zxQQG1IWaW2XJZFtEZk3DbjJFso';
  const GID = '0';
  
  const assignmentsUrl = `https://docs.google.com/spreadsheets/d/${ASSIGNMENTS_SHEET_ID}/export?format=csv&gid=${GID}`;
  const examsUrl = `https://docs.google.com/spreadsheets/d/${EXAMS_SHEET_ID}/export?format=csv&gid=${GID}`;

  try {
    console.log(`Fetching data from two sources in parallel...`);
    
    // Use Promise.all to fetch both sheets concurrently for better performance
    const [assignmentsResponse, examsResponse] = await Promise.all([
      fetch(assignmentsUrl),
      fetch(examsUrl)
    ]);

    // Check if either of the fetches failed
    if (!assignmentsResponse.ok) {
      throw new Error(`Failed to fetch assignments sheet. Status: ${assignmentsResponse.status}`);
    }
    if (!examsResponse.ok) {
      throw new Error(`Failed to fetch exams sheet. Status: ${examsResponse.status}`);
    }

    // Get the CSV text from both responses, also in parallel
    const [assignmentsCsvText, examsCsvText] = await Promise.all([
      assignmentsResponse.text(),
      examsResponse.text()
    ]);
    
    // Parse both CSV texts into JSON data
    const assignmentsData = parseCSV(assignmentsCsvText);
    const examsData = parseCSV(examsCsvText);

    // Log the fetched data to the backend console for verification
    console.log('--- ✅ Fetched Assignments Data ---');
    console.log(assignmentsData);
    console.log('--- ✅ Fetched Examinations Data ---');
    console.log(examsData);
    console.log('------------------------------------');

    // Return a structured response containing both datasets
    return NextResponse.json({
      message: 'Successfully fetched assignments and examinations data.',
      assignments: {
        count: assignmentsData.length,
        data: assignmentsData,
      },
      examinations: {
        count: examsData.length,
        data: examsData,
      }
    });

  } catch (error) {
    console.error('❌ Error fetching Google Sheet data:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from one or more Google Sheets',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}