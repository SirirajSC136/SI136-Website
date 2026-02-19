// app/api/canvas/secondupcoming/route.ts

import { NextResponse } from 'next/server';
import Papa from 'papaparse';

/**
 * A robust helper function to parse CSV text using papaparse.
 * Correctly handles commas within quoted fields.
 * @param {string} csvText The raw CSV text data.
 * @returns {Record<string, string>[]} An array of objects, where keys are headers.
 */
function parseCSV(csvText: string): Record<string, string>[] {
  if (!csvText || typeof csvText !== 'string') {
    return [];
  }

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing had errors:', result.errors);
  }

  return result.data;
}

// This is the Route Handler for the GET method
export async function GET(req: Request) {
  const ASSIGNMENTS_SHEET_ID = '1omRhuSvS5qyXoXKRraKTJe0scagdxaWcENRGixja5cw';
  const EXAMS_SHEET_ID = '11RdWKC338mjIA7f9zxQQG1IWaW2XJZFtEZk3DbjJFso';
  const GID = '0';

  const assignmentsUrl = `https://docs.google.com/spreadsheets/d/${ASSIGNMENTS_SHEET_ID}/export?format=csv&gid=${GID}`;
  const examsUrl = `https://docs.google.com/spreadsheets/d/${EXAMS_SHEET_ID}/export?format=csv&gid=${GID}`;

  try {
    // Use Promise.all to fetch both sheets concurrently for better performance
    // Added Next.js revalidation for caching (revalidate every 15 minutes)
    const [assignmentsResponse, examsResponse] = await Promise.all([
      fetch(assignmentsUrl, { next: { revalidate: 900 } }),
      fetch(examsUrl, { next: { revalidate: 900 } })
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

    // Filter out items that are past by more than 3 days
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const filteredAssignments = assignmentsData.filter(item => {
      const deadline = item['Deadline'];
      if (!deadline) return true; // Keep if no deadline

      // Parse DD/MM/YYYY format
      const parts = deadline.split('/');
      if (parts.length !== 3) return true; // Keep if invalid format

      const itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return itemDate >= threeDaysAgo;
    });

    const filteredExams = examsData.filter(item => {
      const dateStr = item['Date'];
      if (!dateStr) return true; // Keep if no date

      // Parse DD/MM/YYYY format
      const parts = dateStr.split('/');
      if (parts.length !== 3) return true; // Keep if invalid format

      const itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return itemDate >= threeDaysAgo;
    });

    // Return a structured response containing both datasets
    return NextResponse.json({
      message: 'Successfully fetched assignments and examinations data.',
      assignments: {
        count: filteredAssignments.length,
        data: filteredAssignments,
      },
      examinations: {
        count: filteredExams.length,
        data: filteredExams,
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