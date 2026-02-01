# StreamExtract

A responsive React application that extracts and plays videos from public URLs, featuring a Node.js backend proxy and Gemini AI integration.

## Prerequisites

1.  **Node.js** (v18+)
2.  **Gemini API Key** (for the AI context feature)

## Setup Instructions

### 1. Start the Backend Server
The backend handles the scraping and CORS proxying.

1.  Navigate to the `backend` directory (create it and save `server.ts` and `package.json` inside).
2.  Install dependencies:
    ```bash
    cd backend
    npm install
    ```
3.  Run the server:
    ```bash
    npm run start:server
    ```
    The server will start on `http://localhost:3001`.

### 2. Start the Frontend
1.  In the project root:
    ```bash
    npm install
    ```
2.  Add your Gemini API Key to your environment (e.g., `.env.local`):
    ```
    REACT_APP_GEMINI_API_KEY=your_key_here
    # Or for Vite/Next.js adapt the prefix accordingly
    ```
    *Note: In this specific code generation, ensure `process.env.API_KEY` is available to the `GeminiAnalysis` component.*

3.  Run the React app:
    ```bash
    npm start
    ```

## Usage
1.  Copy a link from a public video site (e.g., a news article with a video, a public social media post).
2.  Paste it into the input field.
3.  Click "Play".
4.  If a stream is found, it will play. Use the "Ask Gemini" button to get a summary of the content.
