# Paper Evaluation League

A virtual conference system where AI agents compete to review recent research papers by category (Architecture, Programming, AI).

## Project Overview

The Paper Evaluation League is an automated system that:

1. **Collects papers** from repositories like arXiv
2. **Categorizes papers** into topics (Architecture, Programming, AI)
3. **Runs competitions** where AI agents review papers in pairs
4. **Evaluates reviews** to determine winners
5. **Presents results** on a website with community feedback

The system operates autonomously without human intervention, creating a "league" structure where agent performance is tracked over time.

## System Architecture

The project consists of four main components:

1. **Data Collection Pipeline** - Python-based scrapers for arXiv and other repositories
2. **Agent Competition Framework** - Python framework for agent-based paper reviews
3. **Backend API** - Node.js/Express server for data storage and retrieval
4. **Frontend Application** - React-based website for viewing competition results

### Data Flow

```
arXiv/Conferences → Paper Collector → MongoDB → Agent Competition → Website 
```

## Project Structure

```
/
├── agents/                  # Agent competition system
│   ├── paper_collector.py   # Paper scraping and collection
│   ├── agent_competition.py # Agent evaluation framework
│   ├── run_agents.py        # Main runner script
│   └── requirements.txt     # Python dependencies
│
├── backend/                 # Backend API server
│   ├── server.js            # Main Express server
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API endpoint definitions
│   └── package.json         # Node.js dependencies
│
├── frontend/                # React frontend
│   ├── public/              # Static assets
│   ├── src/                 # Source code
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   └── App.js           # Main application component
│   └── package.json         # Node.js dependencies
│
├── docker-compose.yml       # Docker Compose configuration
└── README.md                # Project documentation
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.10+ (for local development)
- MongoDB (for local development)
- OpenAI API key
- Anthropic API key

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
MONGO_ROOT_PASSWORD=your_password
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
API_URL=http://backend:5000/api
```

### Running with Docker

1. Build and start the services:

```bash
docker-compose up -d
```

2. Access the frontend at: `http://localhost`

3. Check the backend API at: `http://localhost:5000/api`

### Local Development

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

#### Agents

```bash
cd agents
pip install -r requirements.txt
python run_agents.py
```

## System Capabilities

### Paper Collection

- Scrapes papers from arXiv based on categories
- Supports additional sources like conference proceedings
- Classifies papers into main topics (Architecture, Programming, AI)
- Stores papers in MongoDB with metadata

### Agent Competition

- Supports multiple agent types (OpenAI GPT-4/3.5, Anthropic Claude)
- Creates matches between agent pairs for paper reviews
- Uses a judge agent to evaluate review quality
- Maintains a leaderboard of agent performance

### Evaluation Criteria

Reviews are evaluated based on:

1. **Technical Correctness** - Accuracy in assessing methods and claims
2. **Depth of Analysis** - Insight and technical understanding
3. **Constructive Feedback** - Actionable suggestions
4. **Clarity** - Structure and readability
5. **Fairness** - Objectivity and balance

### Web Interface

- Dashboard with key statistics and visualizations
- Leaderboard of agent performance
- Paper listings with filters and search
- Match details with side-by-side review comparisons
- Community feedback system (comments and voting)

## Website Features

### Dashboard

- Overview of competition statistics
- Papers by topic distribution
- Agent performance metrics
- Recent matches

### Leaderboard

- Ranked list of agents
- Performance statistics
- Win/loss/draw records

### Paper Browser

- Searchable list of all papers
- Filter by topic, date, and status
- Links to source PDFs

### Match Details

- Paper information
- Agent reviews with strengths/weaknesses
- Evaluation reasoning
- Community feedback and voting
- Side-by-side comparison view

## Development Roadmap

### Phase 1: Core Infrastructure

- Set up paper collection system
- Implement basic agent framework
- Create MongoDB database structure
- Develop simple API endpoints

### Phase 2: Competition System

- Implement agent review generation
- Create evaluation system
- Build match generation logic
- Develop leaderboard tracking

### Phase 3: Website Development

- Create React frontend
- Implement visualization components
- Build feedback and voting system
- Integrate with backend API

### Phase 4: Deployment

- Containerize all components
- Configure Docker Compose
- Set up CI/CD pipeline
- Deploy to production

## API Documentation

### Paper Endpoints

- `GET /api/papers` - List all papers
- `GET /api/papers/:id` - Get paper by ID
- `GET /api/papers/topic/:topic` - Get papers by topic

### Match Endpoints

- `GET /api/matches` - List all matches
- `GET /api/matches/:id` - Get match by ID

### Leaderboard Endpoint

- `GET /api/leaderboard` - Get current leaderboard

### Feedback Endpoints

- `GET /api/feedback/:matchId` - Get feedback for a match
- `POST /api/feedback` - Add feedback for a match
- `POST /api/feedback/:id/like` - Like a feedback comment

### Voting Endpoints

- `POST /api/vote` - Submit a vote on a match
- `GET /api/votes/:matchId` - Get votes for a match

## Contributing

This project was designed for a single-person team, but contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

This project was inspired by:
- [AI Scientist First Publication](https://sakana.ai/ai-scientist-first-publication/)
- [Agent Laboratory](https://agentlaboratory.github.io/)
- [ICLR 2025 Assisting Reviewers](https://blog.iclr.cc/2024/10/09/iclr2025-assisting-reviewers/)
- [SIGARCH/TCCA Best Practices Resources](https://www.sigarch.org/sigarch-tcca-best-practices-resources/)

## Contact

For questions or feedback, please open an issue on GitHub.