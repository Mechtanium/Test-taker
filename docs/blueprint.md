
# **App Name**: TestLock

## Core Features:

*   **Secure Testing Environment**:
    *   **Disable Copy/Paste in Answer Area**: Prevents copy/paste actions (copy, cut, paste) specifically within the answer textarea to deter cheating. Drag and drop actions are also disabled in the answer area. Other input fields (student email, matriculation number) allow normal copy/paste.
    *   **Page Security Monitoring**: Detects page visibility changes (tab switching, minimizing) and significant window resizing (excluding normal orientation changes or keyboard popups). Such events trigger a penalty, submitting current answers and ending the test.
    *   **Fullscreen Mode**: Requires users to enter fullscreen mode after providing student details and before starting the test. Exiting fullscreen also triggers a penalty.
*   **Authentication & User Identification**:
    *   **Wix Member Login**: Integrates with Wix SDK for user authentication via OAuth. Users must log in before starting a test. The logged-in member's ID (`_owner`) is associated with the test submission.
    *   **Student Information**: Collects "Student email" and "Matriculation number" before the test begins. These fields are disabled after the test starts.
*   **Test Data Handling**:
    *   **Dynamic Test Loading**:
        *   **Parent Frame Communication**: Can receive test questions and test information (title, instructions, timing, geolocation) via `window.postMessage` when embedded in an iframe.
        *   **Direct API Fetch (Standalone Mode)**: When not in an iframe, fetches test questions and information from an external API (`https://sapiensng.wixsite.com/annah-ai/_functions/test`) via a Next.js proxy route (`/api/test-proxy`). Requires a `q` URL query parameter for the test ID.
    *   **Test Availability Check**:
        *   Verifies if the current system time is within the test's scheduled `start` time and `stop` (late start) time, based on `test_info.date`.
        *   Displays "Test Unavailable" messages if the current time is outside this window (too early or too late).
        *   If `start` time is missing, the test is assumed available. If `date` is missing, current day is assumed. If `stop` time is missing, only `start` time is checked.
*   **Test Progression & Question Handling**:
    *   **Timed Question Display**: Shows one question at a time. Each question has an individual countdown timer based on its `dur_millis` property.
    *   **Question Types**: Supports "MCQ" (Multiple Choice Questions), "G_OBJ" (General Objective), "SHORT" (Short Answer), and "PARAGRAPH" (Essay) type questions.
    *   **Question Sorting & Randomization**: Before the test begins, questions are sorted by type in the order: "MCQ" -> "G_OBJ" -> "SHORT" -> "PARAGRAPH". Within each type group, questions are randomized.
    *   **Answer Capture**: Captures user responses and the time taken for each question.
    *   **Automatic Advancement**: Moves to the next question when the timer expires or when the user submits an answer.
    *   **Progress Display**: Shows progress bars for each question type ("MCQ", "G_OBJ", "SHORT", "PARAGRAPH"), indicating the number of answered questions versus the total for that type.
    *   **Auto-Focus**: Automatically focuses the answer textarea for non-MCQ questions when a new question is displayed.
*   **Submission**:
    *   **Secure Submission**: Submits captured answers, student information, Wix Member ID (`_owner`), test ID, and status ("completed" or "penalized") to an external API (`https://sapiensng.wixsite.com/annah-ai/_functions/save_assessment`) via a Next.js proxy route (`/api/submit-assessment`).
    *   **Retry Mechanism**: Implements an exponential backoff strategy (up to 7 retries) for submission attempts. An error toast is shown only after all retries fail.
    *   **Parent Frame Notification**: Posts submission results/errors to the parent window if embedded in an iframe.
*   **UI & User Experience**:
    *   **Responsive Design**: Adapts layout for mobile and desktop.
        *   On mobile screens (`<md`), the left pane (student info, test info, instructions, login controls) is hidden after the test starts to maximize space for the question area.
    *   **Minimalist Modern Theme**: Clean, distraction-free interface with subtle visual effects.
        *   Uses a "pointillism" background pattern.
        *   Cards have a "glass" translucency effect.
    *   **Test Information Display**: Shows test title, start and late start times, and a link to the test location on Google Maps (if geolocation data is provided).
    *   **Loading States**: Displays loading indicators during data fetching and submission.
    *   **Status Cards**: Shows "Waiting to Start", "Test Unavailable", "Submitting Test", and "Test Finished" cards in the right pane based on the application state.

## Style Guidelines:

*   **Primary Colors**:
    *   Background: White or light grey (`hsl(var(--background))`).
    *   Text/Foreground: Dark grey (`hsl(var(--foreground))`).
*   **Accent Color**: `#38C68B` (HSL: `153 58% 54%`) used for timers, submit buttons, progress bar indicators, and highlights (e.g., test start time).
*   **Destructive Color**: Standard red (`hsl(var(--destructive))`) used for error states, warnings (e.g., test late start time, destructive toast variant).
*   **Layout**:
    *   Two-column layout (approx. 40:60 ratio on desktop: `md:w-2/5` and `md:w-3/5`):
        *   Left Pane: AnnahAI Logo, Wix Login controls, Student info, Test info, Instructions. Hidden on mobile after test start.
        *   Right Pane: Test questions, timer, answer input/options, progress bars, status cards. Takes full width on mobile when left pane is hidden.
    *   On mobile, panes stack vertically. The right pane's content is arranged in a single scrollable column.
*   **Effects & Animations**:
    *   Subtle fade-in animation for new questions (`fade-in` class).
    *   Pointillism background pattern (`pointillism` class).
    *   Glass translucency effect for cards (`glass` class, applied to cards and specific sections).
*   **Typography**: Uses Geist Sans (variable: `--font-geist-sans`) and Geist Mono (variable: `--font-geist-mono`) fonts.
*   **Components**: Leverages ShadCN UI components for a consistent look and feel (e.g., Card, Button, Input, Progress, RadioGroup, Label, Toast).
*   **CSS Framework**: Tailwind CSS for utility-first styling.
*   **Icons**: Uses `lucide-react` for iconography (e.g., `MapPin`, `Loader2`, `UserCircle2`, `LogIn`, `LogOut`).

## Key Dependencies (from `package.json`):

*   **Framework & UI**:
    *   `next`: `15.2.3`
    *   `react`: `^18.3.1`
    *   `react-dom`: `^18.3.1`
*   **Wix Integration**:
    *   `@wix/sdk`: `^1.13.0`
    *   `@wix/members`: `^1.0.114`
*   **Client-Side Utilities**:
    *   `js-cookie`: `^3.0.5`
*   **Styling & UI Components**:
    *   `tailwindcss`: `^3.4.1`
    *   `tailwindcss-animate`: `^1.0.7`
    *   `lucide-react`: `^0.475.0`
    *   `class-variance-authority`: `^0.7.1`
    *   `clsx`: `^2.1.1`
    *   `tailwind-merge`: `^3.0.1`
    *   Various `@radix-ui/*` packages for ShadCN components (e.g., `react-label`, `react-progress`, `react-radio-group`, `react-dialog`, `react-toast`).
*   **State Management (Implicit)**: React Context API (`LoadingContext`, `ModalContext`).
*   **Type Checking & Linting**:
    *   `typescript`: `^5`
    *   `eslint`, `eslint-config-next`

## Data Objects and Types (Key Interfaces in `src/app/page.tsx`):

*   **`Question` Interface**:
    ```typescript
    interface Question {
      _id: string;
      query: string;
      test_id: string;
      type: "MCQ" | "G_OBJ" | "SHORT" | "PARAGRAPH";
      dur_millis: number;
      options?: string[]; // For MCQ, options are processed into an array of strings (option texts)
                           // Original options from fetch can be {text: string, key: string, _id: string}[]
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
      start: string; // HH:MM:SS.sss (e.g., "07:20:00.000")
      stop: string;  // HH:MM:SS.sss (late start time, e.g., "08:20:00.000")
      date: string;  // YYYY-MM-DD or full ISO string (e.g., "2025-05-30T23:00:00.000Z")
      instructions?: string;
      banner?: string; // URL for a banner image
      geolocation?: {
        latitude: number;
        longitude: number;
        description?: string;
      };
      attempts?: number; // Example field from fetched data
      course_id?: string; // Example field from fetched data
    }
    ```
*   **Wix `Member` Object (from Wix SDK, relevant parts)**:
    *   `_id`: Wix Member ID, used as `_owner` in submission.
    *   `profile.nickname`: Used for display in LoginBar.
    *   `contact.firstName`: Fallback for display name.
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
    