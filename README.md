# Siriraj 136 Academic Hub

A comprehensive web portal for SI-136 students built with Next.js, TypeScript, and MongoDB. This platform serves as a centralized hub for academic information, upcoming events, assignments, and other useful resources.

![Project Overview Screenshot](https://i.imgur.com/65q5ji6bolvWRbMlloTCBi7PPQa-Jijq65V0qZUhnAEe0MIXMta2yhNySeJ8nS_1hsJ38jMt1GFKXZyQ9OMNiktd2fRdVGBYxIUNiShHogj4prI9H3CX4uPzAkeTDqFrtUfVSzt3d6pFmtdtUVuFrZtavDzG8icl0EujIRuGYtiFTZR68BTulQ=w1280) <!-- You can replace this with a better screenshot of your homepage -->

## 🚀 Project Overview

This project is a modern, dynamic web application designed to streamline academic life for Siriraj 136 medical students. It features a live dashboard of upcoming events, a detailed breakdown of academic subjects with their materials, and a powerful admin panel for easy content management.

---

## ✨ Features

### For Students
- **Dynamic Homepage Dashboard:** At-a-glance view of upcoming events, assignments, and examinations.
- **Live Calendar Events:** Upcoming events are fetched in real-time from a public Google Calendar.
- **Comprehensive Academics Section:** Browse all subjects, grouped by year and semester.
- **Detailed Subject Pages:** View topics, lecture materials, resources (PDFs, links, videos), and related assignments for each subject.
- **Useful Info Page:** A collection of static but important information, such as shuttle bus schedules.

### For Administrators
- **Secure Admin Panel:** A dedicated section at `/admin` for managing all dynamic content.
- **Subject Management:** Create new academic subjects directly from the UI.
- **Task Management:** Create, view, and delete tasks (assignments and examinations).
- **Resource Linking:** Add multiple resources (files, links, videos) to each task.
- **MongoDB Integration:** All subject and task data is stored and managed in a robust MongoDB Atlas database.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) with [Mongoose](https://mongoosejs.com/)
- **API:** Next.js API Routes (Serverless Functions)
- **External Services:** [Google Calendar API](https://developers.google.com/calendar)
- **Static Assets:** Images are managed locally within the `/public` folder.

---

## 🏁 Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later)
- `npm` or `yarn`
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.
- A [Google Cloud Platform](https://console.cloud.google.com/) project with the Google Calendar API enabled.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Setup

1.  Create a `.env.local` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env.local
    ```

2.  Fill in the required values in your new `.env.local` file:

    ```env
    # MongoDB Connection String from Atlas
    # Remember to replace <password> with your database user's password.
    MONGODB_URI="mongodb+srv://your_user:<password>@your_cluster.mongodb.net/?retryWrites=true&w=majority"

    # Google Calendar API Key (for public calendars)
    # Get this from your Google Cloud Platform project credentials.
    GOOGLE_API_KEY="your_google_api_key"

    # The ID of the public Google Calendar to fetch events from.
    # Found in the calendar's settings under "Integrate calendar".
    GOOGLE_CALENDAR_ID="your_calendar_id@group.calendar.google.com"

    # The base URL of your application for server-side API calls.
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```

### Running the Application

1.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

2.  **Build for production:**
    ```bash
    npm run build
    ```

3.  **Start the production server:**
    ```bash
    npm run start
    ```

---

## 📂 Project Structure

A brief overview of the key directories in this project:

-   `app/`: The core of the Next.js App Router.
    -   `academics/`: Pages for listing and viewing subjects.
    -   `admin/`: The admin panel UI and its components.
    -   `api/`: All backend serverless functions for handling data.
-   `components/`: Shared, reusable React components used across the application.
-   `lib/`: Shared utility functions, such as the MongoDB connection helper (`mongodb.ts`).
-   `models/`: Mongoose schemas that define the structure of the database collections (`Subject.ts`, `Task.ts`).
-   `public/`: Static assets, including all locally-hosted images.
-   `types/`: TypeScript type definitions for the project.