-- Enable trigram extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop tables if they exist
DROP TABLE IF EXISTS paper_authors CASCADE;
DROP TABLE IF EXISTS paper_subcategories CASCADE;
DROP TABLE IF EXISTS paper_arxiv_categories CASCADE;
DROP TABLE IF EXISTS papers CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS arxiv_categories CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS community_feedback CASCADE;
DROP TABLE IF EXISTS agent_performance CASCADE;

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create subcategories table
CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(category_id, slug)
);

-- Create arxiv_categories table
CREATE TABLE arxiv_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    subcategory_id INTEGER NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(name, subcategory_id)
);

-- Create authors table
CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create papers table
CREATE TABLE papers (
    id SERIAL PRIMARY KEY,
    arxiv_id VARCHAR(50) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    published TIMESTAMP NOT NULL,
    updated TIMESTAMP NOT NULL,
    url VARCHAR(255) NOT NULL,
    pdf_url VARCHAR(255) NOT NULL,
    journal VARCHAR(255),
    doi VARCHAR(255),
    comments TEXT,
    published_year INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create junction table for papers and arxiv_categories
CREATE TABLE paper_arxiv_categories (
    paper_id INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    arxiv_category_id INTEGER NOT NULL REFERENCES arxiv_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (paper_id, arxiv_category_id)
);

-- Create junction table for papers and subcategories
CREATE TABLE paper_subcategories (
    paper_id INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    subcategory_id INTEGER NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (paper_id, subcategory_id)
);

-- Create junction table for papers and authors
CREATE TABLE paper_authors (
    paper_id INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (paper_id, author_id)
);

-- Create agents table
CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- e.g., 'gpt-4', 'claude-3-opus'
    provider VARCHAR(50) NOT NULL, -- e.g., 'openai', 'anthropic'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(name, model_type, provider)
);

-- Create matches table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    paper_id INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    agent1_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    agent2_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    judge_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (agent1_id != agent2_id),
    CHECK (judge_id != agent1_id AND judge_id != agent2_id)
);

-- Create reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    technical_score DECIMAL(3,2), -- 0-5 scale
    depth_score DECIMAL(3,2),
    feedback_score DECIMAL(3,2),
    clarity_score DECIMAL(3,2),
    fairness_score DECIMAL(3,2),
    overall_score DECIMAL(3,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(match_id, agent_id)
);

-- Create community_feedback table
CREATE TABLE community_feedback (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER, -- NULL for anonymous feedback
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create agent_performance table for leaderboard
CREATE TABLE agent_performance (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    total_matches INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    draws INTEGER NOT NULL DEFAULT 0,
    avg_technical_score DECIMAL(3,2),
    avg_depth_score DECIMAL(3,2),
    avg_feedback_score DECIMAL(3,2),
    avg_clarity_score DECIMAL(3,2),
    avg_fairness_score DECIMAL(3,2),
    avg_overall_score DECIMAL(3,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(agent_id)
);

-- Create indexes for better performance
CREATE INDEX papers_published_year_idx ON papers(published_year);
CREATE INDEX papers_title_trgm_idx ON papers USING GIN(title gin_trgm_ops);
CREATE INDEX papers_abstract_trgm_idx ON papers USING GIN(abstract gin_trgm_ops);
CREATE INDEX matches_paper_id_idx ON matches(paper_id);
CREATE INDEX matches_status_idx ON matches(status);
CREATE INDEX reviews_match_id_idx ON reviews(match_id);
CREATE INDEX reviews_agent_id_idx ON reviews(agent_id);
CREATE INDEX community_feedback_review_id_idx ON community_feedback(review_id);
CREATE INDEX agent_performance_agent_id_idx ON agent_performance(agent_id);