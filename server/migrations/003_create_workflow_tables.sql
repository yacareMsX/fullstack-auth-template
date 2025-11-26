-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create workflow_nodes table
CREATE TABLE IF NOT EXISTS workflow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    -- 'START', 'TASK', 'DECISION', 'END'
    label VARCHAR(255) NOT NULL,
    properties JSONB DEFAULT '{}',
    -- Configuration (approver, timeout, etc.)
    position JSONB DEFAULT '{"x": 0, "y": 0}',
    -- UI coordinates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create workflow_edges table
CREATE TABLE IF NOT EXISTS workflow_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    label VARCHAR(255),
    condition JSONB DEFAULT '{}',
    -- Logic for traversal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_workflow_id ON workflow_edges(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_source ON workflow_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_target ON workflow_edges(target_node_id);
-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_workflows_updated_at BEFORE
UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();