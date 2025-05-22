
# **App Name**: TestLock

## Core Features:

*   **Secure Testing Environment**:
    *   **Disable Copy/Paste**: Prevents copy/paste in the answer textarea to deter cheating. Other input fields (student email, matriculation) allow normal copy/paste.
    *   **Page Security Monitoring**: Detects page visibility changes (tab switching, minimizing) and significant window resizing (excluding normal orientation changes or keyboard popups). Such events trigger a penalty, submitting current answers and ending the test.
    *   **Fullscreen Mode**: Requires users to enter fullscreen mode after providing student details and before starting the test. Exiting fullscreen also triggers a penalty.
*   **Authentication & User Identification**:
    *   **Wix Member Login**: Integrates with Wix SDK for user authentication. Users must log in before starting a test.
    *   **Student Information**: Collects "Student email" and "Matriculation number" before the test begins.
    *   **Owner Attribution**: Associates test submissions with the logged-in Wix Member ID.
*   **Test Data Handling**:
    *   **Dynamic Test Loading**:
        *   **Parent Frame Communication**: Can receive test questions and information (test title, instructions, timing, geolocation) via `window.postMessage` when embedded in an iframe.
        *   **Direct API Fetch**: When standalone, fetches test questions and information from an external API (`https://sapiensng.wixsite.com/annah-ai/_functions-dev/test`) via a Next.js proxy route (`/api/test-proxy`). Requires a `q` URL parameter for the test ID.
    *   **Test Availability**: Checks if the current system time is within the test's scheduled start and late start window. Displays "Test Unavailable" messages if outside this window.
*   **Test Progression & Question Handling**:
    *   **Timed Question Display**: Shows one question at a time with a countdown timer based on `dur_millis` for each question.
    *   **Question Types**: Supports "MCQ" (Multiple Choice Questions), "G_OBJ" (General Objective), "SHORT" (Short Answer), and "PARAGRAPH" (Essay) type questions.
    *   **Question Sorting & Randomization**: Sorts questions by type ("MCQ" -> "G_OBJ" -> "SHORT" -> "PARAGRAPH") before the test begins. Within each type group, questions are randomized.
    *   **Answer Capture**: Captures user responses and time taken for each question.
    *   **Automatic Advancement**: Moves to the next question when the timer expires or when the user submits an answer.
    *   **Progress Display**: Shows progress bars for each question type, indicating answered questions versus the total for that type.
    *   **Auto-Focus**: Automatically focuses the answer textarea for non-MCQ questions when a new question is displayed.
*   **Submission**:
    *   **Secure Submission**: Submits captured answers, student information, Wix Member ID, test ID, and status ("completed" or "penalized") to an external API (`https://sapiensng.wixsite.com/annah-ai/_functions-dev/save_assessment`) via a Next.js proxy route (`/api/submit-assessment`).
    *   **Retry Mechanism**: Implements an exponential backoff strategy (up to 7 retries) for submissions.
    *   **Parent Frame Notification**: Posts submission results/errors to the parent window if embedded.
*   **UI & User Experience**:
    *   **Responsive Design**: Adapts layout for mobile and desktop. Left pane (info/instructions) hides on mobile after the test starts.
    *   **Minimalist Theme**: Clean, distraction-free interface with pointillism and glass translucency effects.
    *   **Test Information Display**: Shows test title, start/late start times, and a link to the test location on Google Maps.
    *   **Loading States**: Displays loading indicators during data fetching and submission.

## Style Guidelines:

*   **Primary Colors**:
    *   Background: White or light grey (`hsl(var(--background))`).
    *   Text/Foreground: Dark grey (`hsl(var(--foreground))`).
*   **Accent Color**: `#38C68B` (HSL: `153 58% 54%`) used for timers, submit buttons, and highlights.
*   **Destructive Color**: Standard red used for error states/warnings (e.g., late start time, destructive toast variant).
*   **Layout**:
    *   Two-column layout (40:60 ratio on desktop):
        *   Left: Student info, test info, instructions, login controls.
        *   Right: Test questions, timer, answer input.
    *   On mobile, panes stack vertically. Left pane hides after test starts.
*   **Effects & Animations**:
    *   Subtle fade-in animation for new questions.
    *   Pointillism background pattern (`pointillism` class).
    *   Glass translucency effect for cards (`glass` class).
*   **Typography**: Uses Geist Sans and Geist Mono fonts.
*   **Components**: Leverages ShadCN UI components for a consistent look and feel.
*   **CSS Framework**: Tailwind CSS for utility-first styling.
*   **Icons**: Uses `lucide-react` for iconography (e.g., `MapPin`, `Loader2`).

## Key Dependencies (from `package.json`):

*   **Framework & UI**:
    *   `next`: ^15.2.3
    *   `react`: ^18.3.1
    *   `react-dom`: ^18.3.1
*   **Wix Integration**:
    *   `@wix/sdk`: ^1.13.0
    *   `@wix/members`: ^1.0.114
*   **Client-Side Utilities**:
    *   `js-cookie`: ^3.0.5
*   **Styling & UI Components**:
    *   `tailwindcss`: ^3.4.1
    *   `tailwindcss-animate`: ^1.0.7
    *   `lucide-react`: ^0.475.0
    *   `class-variance-authority`: ^0.7.1
    *   `clsx`: ^2.1.1
    *   `tailwind-merge`: ^3.0.1
    *   Various `@radix-ui/*` packages for ShadCN components (e.g., `react-label`, `react-progress`, `react-radio-group`, `react-dialog`).
*   **Form Handling**:
    *   `react-hook-form`: ^7.54.2
    *   `@hookform/resolvers`: ^4.1.3
*   **Date Handling**:
    *   `date-fns`: ^3.6.0
*   **AI (Genkit - currently included but not actively used in core test features)**:
    *   `genkit`: ^1.6.2
    *   `@genkit-ai/googleai`: ^1.6.2
    *   `@genkit-ai/next`: ^1.6.2
*   **Type Checking & Linting**:
    *   `typescript`: ^5
    *   `zod`: ^3.24.2

## Data Objects and Types:

*   **`Question` Interface**:
    ```typescript
    interface Question {
      _id: string;
      query: string;
      test_id: string;
      type: "MCQ" | "G_OBJ" | "SHORT" | "PARAGRAPH";
      dur_millis: number;
      options?: string[]; // For MCQ, options are processed into an array of strings
    }
    ```
*   **`Answer` Interface**:
    ```typescript
    interface Answer {
      questionId: string;
      questionType: Question['type'];
      answer: string;
      timeTaken: number; // in milliseconds
    }
    ```
*   **`TestInfo` Interface**:
    ```typescript
    interface TestInfo {
      _id: string;
      title: string;
      start: string; // HH:MM:SS.sss
      stop: string;  // HH:MM:SS.sss (late start)
      date: string;  // YYYY-MM-DD or full ISO
      instructions?: string;
      banner?: string; // URL
      geolocation?: {
        latitude: number;
        longitude: number;
        description?: string;
      };
      attempts?: number;
      course_id?: string;
    }
    ```
*   **`Member` Object (from Wix SDK)**: Key fields used:
    *   `_id`: Wix Member ID, used as `_owner` in submission.
    *   `profile.nickname`: For display.
    *   `contact.firstName`: For display.
*   **Submission Data Structure (to `/api/submit-assessment`)**:
    ```json
    {
      "_owner": "string", // Wix Member ID or "ANONYMOUS_USER"
      "matriculationNumber": "string",
      "studentEmail": "string",
      "test_id": "string", // Test ID from URL query param 'q'
      "location": "string", // Currently "Geo-location not implemented"
      "status": "completed" | "penalized",
      "type": "testSubmission",
      "answers": [
        {
          "questionId": "string",
          "questionType": "MCQ" | "G_OBJ" | "SHORT" | "PARAGRAPH",
          "answer": "string",
          "timeTaken": "number" // milliseconds
        }
      ],
      "penalty_reason"?: "string" // Optional, if status is "penalized"
    }
    ```

## Test Taking Instructions (as displayed on the page):

1.  Ensure you are logged in using Wix and have entered your correct email and matriculation number.
2.  Click "Accept & Start Test" to enter fullscreen mode and begin.
3.  Answer each question within the time limit shown.
4.  The test will automatically proceed to the next question when the timer runs out or you submit an answer.
5.  **Do not exit fullscreen, switch tabs, resize the window significantly, or attempt to copy/paste/drag answers. Doing so will result in immediate test submission or penalties.**
6.  Use the "Submit Answer & Next" or "Submit Final Answer" button to move to the next question manually.

This document should serve as a good overview of the TestLock application.
