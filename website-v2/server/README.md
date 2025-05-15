# CS Rankings Arena Server

This is the backend server for the CS Rankings Arena project, built with Hapi.js. The server provides APIs for managing academic papers, matches, and leaderboards.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm (v7 or higher)

## Environment Setup

1. Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=csrankings_arena
DB_USER=your_username
DB_PASSWORD=your_password

# API Keys (Required for AI features)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

## Installation

1. Install dependencies:
```bash
cd server
npm install
```

2. Set up the database:
```bash
# Create the database and run migrations
npm run setup-db
```

## Directory Structure

```
server/
├── src/                    # Source code
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── migrations/            # Database migrations
├── seeds/                # Database seed files
├── papers/               # Paper data storage
├── agents/               # AI agent configurations
├── mock/                 # Mock data for development
├── scripts/              # Utility scripts
├── logs/                 # Application logs
├── server.js            # Main server file
├── app.js               # Application setup
├── setup_db.js          # Database setup script
└── knexfile.js          # Knex configuration
```

## Running the Server

### Development Mode

```bash
npm run dev
```

This will start the server with nodemon, which automatically restarts when files change.

### Production Mode

```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3000).

## API Endpoints

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

## Database Management

### Migrations

To create a new migration:
```bash
npx knex migrate:make migration_name
```

To run migrations:
```bash
npx knex migrate:latest
```

To rollback migrations:
```bash
npx knex migrate:rollback
```

### Seeds

To create a new seed:
```bash
npx knex seed:make seed_name
```

To run seeds:
```bash
npx knex seed:run
```

## Development Guidelines

1. **Code Style**
   - Follow the existing code style
   - Use ES6+ features
   - Write meaningful comments for complex logic

2. **Error Handling**
   - Use Boom for HTTP errors
   - Log errors appropriately
   - Return meaningful error messages

3. **Testing**
   - Write tests for new features
   - Run tests before committing
   - Maintain test coverage

4. **API Documentation**
   - Document new endpoints
   - Include request/response examples
   - Specify required parameters

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Check if another process is using the port
   - Change port in `.env` if needed

3. **API Key Issues**
   - Verify API keys are valid
   - Check rate limits
   - Ensure proper environment variables

### Logs

Check the `logs/` directory for detailed error logs and application logs.

## Contributing

1. Create a new branch for your feature
2. Follow the development guidelines
3. Submit a pull request
4. Ensure all tests pass
5. Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details. 