-- Users table for both clients and P4D team
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'client', -- 'client' or 'admin'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Funnel responses table to store interactive briefing data
CREATE TABLE IF NOT EXISTS funnel_responses (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT, -- Nullable if user starts funnel anonymously
    step_data TEXT NOT NULL, -- JSON string of all responses
    current_step INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Projects table to store details of each client project
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    funnel_response_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'briefing_received', -- e.g., 'briefing_received', 'in_development', 'delivered', 'cancelled'
    summary TEXT, -- AI-generated summary for client
    estimated_delivery TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (funnel_response_id) REFERENCES funnel_responses(id) ON DELETE CASCADE
);

-- Subscriptions table to track Asaas subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    asaas_subscription_id TEXT UNIQUE,
    plan_name TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., 'pending', 'active', 'cancelled', 'failed'
    next_due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Internal documents for P4D team (PRD, Prompts, Copy, etc.)
CREATE TABLE IF NOT EXISTS internal_documents (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    document_type TEXT NOT NULL, -- e.g., 'prd', 'system_prompt', 'db_prompt', 'copy', 'deploy_checklist'
    version INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, document_type, version)
);

-- Kanban tasks for project management
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'to_do', -- e.g., 'to_do', 'in_progress', 'done'
    assigned_to TEXT, -- User ID of the assigned team member
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);