# BiteSpeed Identity Reconciliation Frontend

A modern React dashboard for visualizing and testing the BiteSpeed Identity Reconciliation system. This frontend provides real-time visualization of contact relationships, API testing capabilities, and live log monitoring.

## Features

🎯 **Real-time Contact Visualization**

- Interactive graph showing contact relationships
- Visual distinction between primary and secondary contacts
- Animated connection lines showing linked relationships
- Real-time updates when new contacts are added

🔧 **API Testing Interface**

- Test the `/identify` endpoint directly from the UI
- Form validation and error handling
- Response time monitoring
- Detailed response visualization

📊 **Live Log Monitoring**

- Real-time log streaming via WebSocket
- Log filtering by level (info, warn, error, debug)
- Auto-scroll with manual override
- Expandable log data inspection

🎨 **Modern BiteSpeed Design**

- Dark theme matching BiteSpeed branding
- Smooth animations with Framer Motion
- Responsive layout with Tailwind CSS
- Professional dashboard interface

## Tech Stack

- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **React Flow** for graph visualization
- **Framer Motion** for animations
- **Lucide React** for icons
- **Socket.IO Client** for real-time updates
- **Axios** for API communication

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on port 3001

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy the environment variables:

   ```bash
   cp frontend.env .env.local
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

### Environment Variables

Create a `.env.local` file with:

```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
PORT=3000
```

## Usage

### 1. API Testing

- **Left Panel**: Use the API test form to send requests to the `/identify` endpoint
- Enter email and/or phone number
- Click "Identify Contact" to see the response
- View detailed response data including:
  - Primary contact ID
  - All linked emails and phone numbers
  - Secondary contact IDs

### 2. Contact Visualization

- **Center Panel**: Interactive graph of contact relationships
- **Primary contacts** appear in blue with crown icons
- **Secondary contacts** appear in gray with user icons
- **Connection lines** show linked relationships
- Use controls to zoom, pan, and fit the view
- Mini-map for navigation in large datasets

### 3. Real-time Logs

- **Right Panel**: Live log monitoring
- Filter logs by level using the dropdown
- Toggle auto-scroll on/off
- Click "Show data" on log entries to see detailed information
- Clear logs with the trash button

## Components

### Core Components

- **`App.tsx`** - Main application component with state management
- **`ApiTestForm.tsx`** - Form for testing API endpoints
- **`ContactNode.tsx`** - Custom node component for React Flow
- **`LogPanel.tsx`** - Real-time log display with filtering

### Services

- **`api.ts`** - API service with request/response logging
- **`websocket.ts`** - WebSocket service for real-time updates

### Types

- **`types/index.ts`** - TypeScript interfaces for all data models

## Features in Detail

### Contact Relationships Visualization

The graph automatically layouts contacts showing:

- Primary contacts as the main nodes
- Secondary contacts connected to their primary
- Email and phone number information on each node
- Creation and update timestamps
- Visual indicators for recently added contacts

### Real-time Updates

When API calls are made:

1. New contacts appear in the graph with animation
2. Relationship lines are drawn automatically
3. Logs are updated in real-time
4. Connection status is monitored

### Responsive Design

- Three-panel layout: API testing | Visualization | Logs
- Panels are sized appropriately for different screen sizes
- Modern dark theme with blue accents
- Smooth transitions and hover effects

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Project Structure

```
src/
├── components/          # React components
│   ├── ApiTestForm.tsx
│   ├── ContactNode.tsx
│   └── LogPanel.tsx
├── services/           # API and WebSocket services
│   ├── api.ts
│   └── websocket.ts
├── types/              # TypeScript definitions
│   └── index.ts
├── App.tsx             # Main application
├── index.tsx           # Entry point
└── index.css           # Global styles with Tailwind
```

## Integration with Backend

This frontend is designed to work with the BiteSpeed Identity Reconciliation backend:

- **API Endpoint**: `POST /api/identify`
- **WebSocket**: For real-time log streaming (optional)
- **Health Check**: `GET /api/health`

The frontend gracefully handles backend unavailability and provides appropriate feedback.

## Styling

The application uses a custom Tailwind configuration with:

- BiteSpeed blue color palette
- Dark theme as default
- Custom animations and transitions
- Professional spacing and typography

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test API integration thoroughly
4. Ensure responsive design principles
5. Add appropriate animations for new interactions

## License

MIT License - see LICENSE file for details
