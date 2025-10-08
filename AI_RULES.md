# AI Rules for P4D Mídia Application

This document outlines the core technologies and best practices for developing this application.

## Tech Stack

*   **React 19**: The primary JavaScript library for building user interfaces.
*   **TypeScript**: Used for type safety and improved developer experience across the entire codebase.
*   **Tailwind CSS**: A utility-first CSS framework for styling, ensuring responsive and consistent designs.
*   **Vite**: The build tool and development server, providing a fast development experience.
*   **Hono**: A lightweight, fast, and edge-optimized web framework used for serverless functions (Cloudflare Workers).
*   **React Router**: For declarative routing within the React application.
*   **Lucide React**: A collection of beautiful and customizable open-source icons.
*   **Zod**: A TypeScript-first schema declaration and validation library, used for data validation.
*   **Cloudflare Workers**: The deployment platform for both the frontend assets and backend serverless functions.
*   **shadcn/ui**: A collection of re-usable components built with Radix UI and Tailwind CSS.

## Library Usage Rules

*   **UI Components**:
    *   **Prioritize shadcn/ui**: Always try to use components from the `shadcn/ui` library for common UI elements (buttons, forms, cards, etc.).
    *   **Custom Components**: If a `shadcn/ui` component doesn't fit the exact need, create a new, small, and focused custom component using Tailwind CSS for styling.
    *   **No direct Radix UI usage**: `shadcn/ui` components already abstract Radix UI. Do not import or use Radix UI components directly.
*   **Styling**:
    *   **Tailwind CSS Only**: All styling must be done using Tailwind CSS utility classes. Avoid writing custom CSS files or inline styles unless absolutely necessary for dynamic values.
    *   **Responsive Design**: Always ensure designs are responsive across different screen sizes using Tailwind's responsive prefixes (e.g., `sm:`, `md:`, `lg:`).
*   **Icons**:
    *   **Lucide React**: Use icons exclusively from the `lucide-react` library.
*   **Routing**:
    *   **React Router**: Use `react-router` for all client-side navigation. Keep the main routes defined in `src/react-app/App.tsx`.
*   **State Management**:
    *   **React Hooks/Context**: For most application-level state, prefer React's built-in `useState` and `useContext` hooks. Avoid external state management libraries unless the complexity explicitly demands it.
*   **Backend/API**:
    *   **Hono**: Use Hono for defining and handling API endpoints in `src/worker`.
*   **Data Validation**:
    *   **Zod**: Use Zod for defining schemas and validating data, especially for API request bodies and responses.
*   **File Structure**:
    *   `src/pages/`: For top-level page components.
    *   `src/components/`: For reusable UI components.
    *   `src/react-app/`: Contains the main React application entry point and related files.
    *   `src/worker/`: Contains the Hono serverless function code.
    *   `src/shared/`: For types or utilities shared between client and server.
*   **Code Quality**:
    *   **TypeScript**: Ensure all new code is written in TypeScript, leveraging types for clarity and error prevention.
    *   **Readability**: Write clean, readable, and well-commented code.
    *   **Modularity**: Create small, focused files and components. Refactor large files when necessary.