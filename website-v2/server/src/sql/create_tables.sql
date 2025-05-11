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

-- Create indexes for better performance
CREATE INDEX papers_published_year_idx ON papers(published_year);
CREATE INDEX papers_title_trgm_idx ON papers USING GIN(title gin_trgm_ops);
CREATE INDEX papers_abstract_trgm_idx ON papers USING GIN(abstract gin_trgm_ops);