# **App Name**: TestLock

## Core Features:

- Disable Copy/Paste: Disable copy/paste functionality for all input fields and the main content area to prevent unauthorized content extraction or insertion.
- Message Listener: Receive the test questions and timer settings via the `window.onMessage` listener, ensuring secure and isolated data transfer from the parent application. The data will consist of question objects with fields like `_id`, `_owner`, `query`, `test_id`, `type`, and `dur_millis`
- Timed Question Display: Display one question at a time with a countdown timer based on the question's `dur_millis` data, automatically advancing to the next question when the timer expires. Randomize the order of questions before the test begins.
- Answer Capture: Capture and store user responses for each question submitted via the answer input field. Ensure the answers are properly saved before moving to the next question.
- Student Info Fields: Add permanent input fields for "Student email" and "Matriculation number".
- Page Security Features: Implement page security features to either deduct test points, erase previous answers or immediately collect and submit answers given thus far whenever the page get a visibilityChange or page resize events (excluding device auto-rotation and keyboard popups) that indicates the user attempted to split screens or switch tabs or applications.
- Fullscreen Accept Button: Add an accept button after the instructions that triggers a switch to fullscreen mode when clicked. The change to full screen should preceed setting of the resize listeners and display of the questions and timers. User should only get the questions if they click the accept button.
- Question Progress Bar: Add an annotated progress bar to show how many questions have been completed and how many questions there are in total. If there are penalty questions, it should display those in parenthesis following the count annotation.
- Auto-Focus Textarea: Automatically set focus to the textarea whenever a new question is displayed so the user can start typing right away

## Style Guidelines:

- Primary color: White or light grey for a clean, distraction-free background.
- Secondary color: Dark grey for text to ensure high readability.
- Accent: #38C68B for the timer display and submit button to draw attention.
- Split the screen into two columns with a 40:60 ratio. The left column contains "Student email", "Matriculation number", and test instructions. The right column displays the questions.
- A subtle fade-in animation for each new question to provide a smooth transition.
- Use a minimalist design interface that's elegant and uses pointilism colour shading and glass translucency effects