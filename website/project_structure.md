paper-evaluation-league/
├── .github/                      # GitHub workflows for CI/CD
├── agents/                       # Agent competition system
│   ├── src/
│   │   ├── collectors/           # Paper collection modules
│   │   ├── models/               # AI agent implementations
│   │   ├── competition/          # Competition framework
│   │   └── analysis/             # Paper analysis modules
│   ├── tests/                    # Unit tests
│   ├── run_agents.py             # Main runner script
│   └── requirements.txt          # Python dependencies
├── backend/                      # Backend API server
│   ├── src/
│   │   ├── controllers/          # API route handlers
│   │   ├── models/               # Database models
│   │   ├── services/             # Business logic
│   │   └── utils/                # Helper functions
│   ├── tests/                    # API tests
│   ├── server.js                 # Express server entry point
│   └── package.json              # Node.js dependencies
├── frontend/                     # React frontend
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page layouts
│   │   ├── services/             # API client
│   │   ├── hooks/                # Custom React hooks
│   │   ├── utils/                # Helper functions
│   │   └── App.js                # Main application component
│   ├── package.json              # Node.js dependencies
│   └── tailwind.config.js        # Tailwind CSS configuration
├── docker/                       # Docker configuration
│   ├── agents/                   # Agent service config
│   ├── backend/                  # Backend service config
│   ├── frontend/                 # Frontend service config
│   └── mongodb/                  # Database service config
├── docker-compose.yml            # Docker Compose configuration
├── .env.example                  # Example environment variables
└── README.md                     # Project documentation