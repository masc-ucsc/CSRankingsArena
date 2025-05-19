# CS Rankings Arena

CS Rankings Arena is a web application that provides an interactive platform for exploring and comparing academic papers in computer science. The project consists of a React-based frontend and a Node.js backend server.

## Project Overview

The CS Rankings Arena allows users to:
- Browse and search academic papers
- Compare papers through an interactive matching system
- View leaderboards and rankings
- Analyze paper trends and impact

## Project Structure

```
CSRankingsArena/
├── client/                 # React frontend application
├── server/                 # Node.js backend server
├── papers/                 # Paper data storage
├── mock/                   # Mock data for development
├── scripts/               # Utility scripts
└── documentation/         # Project documentation
```

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm (v7 or higher)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/CSRankingsArena.git
cd CSRankingsArena
```

### 2. Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=csrankings_arena
DB_USER=your_username
DB_PASSWORD=your_password
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Set up the database:
```bash
npm run setup-db
```

5. Start the server:
```bash
npm run dev
```

### 3. Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## API Documentation

The backend server provides the following main API endpoints:

### Papers
- `GET /api/v2/papers` - Get papers by category and year
- `GET /api/v2/papers/:id` - Get paper details
- `POST /api/v2/papers` - Add a new paper

### Matches
- `GET /api/v2/matches` - Get recent matches
- `POST /api/v2/matches` - Create a new match
- `GET /api/v2/matches/:id` - Get match details

### Leaderboard
- `GET /api/v2/leaderboard` - Get leaderboard rankings
- `GET /api/v2/leaderboard/years` - Get available years

For detailed API documentation, refer to the Postman collection in the root directory.

## Development

### Backend Development

The backend is built with:
- Node.js
- Hapi.js
- PostgreSQL
- Knex.js for database management

Key features:
- RESTful API architecture
- Database migrations and seeding
- Error handling and logging
- Rate limiting
- AI integration for paper analysis

### Frontend Development

The frontend is built with:
- React
- Modern JavaScript (ES6+)
- CSS/SCSS for styling

Key features:
- Responsive design
- Interactive paper comparison
- Real-time updates
- Data visualization

## Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

## Deployment

### Backend Deployment
1. Build the application:
```bash
cd server
npm run build
```

2. Start the production server:
```bash
npm start
```

### Frontend Deployment
1. Build the application:
```bash
cd client
npm run build
```

2. Deploy the contents of the `build` directory to your hosting service.

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Submit a pull request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- CSRankings for the initial data
- OpenAI and Anthropic for AI capabilities
- All contributors to the project 