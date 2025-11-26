const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');
const router = express.Router();

// Get all workflows
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM workflows ORDER BY updated_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get workflow by ID (including nodes and edges)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch workflow details
        const workflowResult = await db.query(
            'SELECT * FROM workflows WHERE id = $1',
            [id]
        );

        if (workflowResult.rows.length === 0) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // Fetch nodes
        const nodesResult = await db.query(
            'SELECT * FROM workflow_nodes WHERE workflow_id = $1',
            [id]
        );

        // Fetch edges
        const edgesResult = await db.query(
            'SELECT * FROM workflow_edges WHERE workflow_id = $1',
            [id]
        );

        res.json({
            ...workflowResult.rows[0],
            nodes: nodesResult.rows,
            edges: edgesResult.rows
        });
    } catch (error) {
        console.error('Error fetching workflow:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new workflow
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const result = await db.query(
            `INSERT INTO workflows (name, description, is_active)
             VALUES ($1, $2, false)
             RETURNING *`,
            [name, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update workflow metadata
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;

        const result = await db.query(
            `UPDATE workflows 
             SET name = COALESCE($1, name), 
                 description = COALESCE($2, description),
                 is_active = COALESCE($3, is_active)
             WHERE id = $4
             RETURNING *`,
            [name, description, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete workflow
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM workflows WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        res.json({ message: 'Workflow deleted successfully' });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Save workflow graph (nodes and edges)
router.put('/:id/graph', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;
        const { nodes, edges } = req.body;

        await client.query('BEGIN');

        // Verify workflow exists
        const workflowCheck = await client.query(
            'SELECT id FROM workflows WHERE id = $1',
            [id]
        );
        if (workflowCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // Delete existing nodes and edges (cascade will handle edges if we delete nodes, but let's be explicit)
        await client.query('DELETE FROM workflow_edges WHERE workflow_id = $1', [id]);
        await client.query('DELETE FROM workflow_nodes WHERE workflow_id = $1', [id]);

        // Insert new nodes
        if (nodes && nodes.length > 0) {
            for (const node of nodes) {
                await client.query(
                    `INSERT INTO workflow_nodes (id, workflow_id, type, label, properties, position)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [node.id, id, node.type, node.label, node.properties || {}, node.position || { x: 0, y: 0 }]
                );
            }
        }

        // Insert new edges
        if (edges && edges.length > 0) {
            for (const edge of edges) {
                await client.query(
                    `INSERT INTO workflow_edges (id, workflow_id, source_node_id, target_node_id, label, condition)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [edge.id, id, edge.source_node_id, edge.target_node_id, edge.label, edge.condition || {}]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Graph saved successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving workflow graph:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
