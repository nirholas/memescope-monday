CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at timestamptz,
    nickname VARCHAR(255),
    avatar_url VARCHAR(255),
    locale VARCHAR(50),
    signin_type VARCHAR(50),
    signin_ip VARCHAR(255),
    signin_provider VARCHAR(50),
    signin_openid VARCHAR(255),
    UNIQUE (email, signin_provider)
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    ticker VARCHAR(50),
    description TEXT,
    avatar_url VARCHAR(255),
    created_at timestamptz,
    updated_at timestamptz,
    status VARCHAR(50) DEFAULT 'pending',
    author_name VARCHAR(255),
    author_avatar_url VARCHAR(255),
    tags TEXT,
    category VARCHAR(50),
    is_featured BOOLEAN DEFAULT FALSE,
    sort INTEGER DEFAULT 0,
    url VARCHAR(255),
    target VARCHAR(50),
    content TEXT,
    summary TEXT,
    img_url TEXT,
    chain VARCHAR(20) DEFAULT 'solana',
    coin_type VARCHAR(20) DEFAULT 'existing',
    contract_address VARCHAR(255),
    website_url VARCHAR(255),
    twitter_url VARCHAR(255),
    telegram_url VARCHAR(255),
    pumpfun_url VARCHAR(255),
    dexscreener_url VARCHAR(255),
    market_cap VARCHAR(50),
    votes INTEGER DEFAULT 0,
    launch_date timestamptz,
    trending BOOLEAN DEFAULT FALSE,
    paid_expedited BOOLEAN DEFAULT FALSE,
    paid_trending BOOLEAN DEFAULT FALSE,
    week_label VARCHAR(100),
    submitter_email VARCHAR(255)
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    created_at timestamptz
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    coin_slug VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at timestamptz DEFAULT NOW()
);

CREATE INDEX idx_projects_category_query ON projects(category, status, sort DESC, created_at DESC);
CREATE INDEX idx_projects_featured_query ON projects(is_featured, status, sort DESC, created_at DESC);
CREATE INDEX idx_projects_chain_query ON projects(chain, status, sort DESC, created_at DESC);
CREATE INDEX idx_projects_votes ON projects(votes DESC);
CREATE INDEX idx_projects_trending ON projects(trending, status, votes DESC);
CREATE INDEX idx_chat_messages_coin ON chat_messages(coin_slug, created_at DESC);
