import express from "express";
import cors from "cors";

const app = express();

// CORS middleware - MUST be first
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

// Handle preflight requests
app.options('*', cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LeadDial MCP Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Main MCP endpoint - handles all MCP protocol requests
app.post('/mcp', async (req, res) => {
  try {
    const request = req.body;
    console.log('=== MCP Request ===');
    console.log(JSON.stringify(request, null, 2));

    // Validate request
    if (!request || !request.method) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: request?.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request: method is required'
        }
      });
    }

    let result;

    switch (request.method) {
      
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {}
          },
          serverInfo: {
            name: 'leaddial-mcp-server',
            version: '1.0.0'
          }
        };
        break;

      case 'tools/list':
        result = {
          tools: [
            {
              name: 'health_check',
              description: 'Check if the MCP server is healthy and responsive',
              inputSchema: {
                type: 'object',
                properties: {},
                required: []
              }
            },
            {
              name: 'get_lead_info',
              description: 'Get information about a specific lead',
              inputSchema: {
                type: 'object',
                properties: {
                  lead_id: {
                    type: 'string',
                    description: 'The ID of the lead'
                  }
                },
                required: ['lead_id']
              }
            },
            {
              name: 'create_call',
              description: 'Create a new call in the system',
              inputSchema: {
                type: 'object',
                properties: {
                  phone_number: {
                    type: 'string',
                    description: 'Phone number to call'
                  },
                  lead_id: {
                    type: 'string',
                    description: 'Associated lead ID'
                  }
                },
                required: ['phone_number']
              }
            },
            {
              name: 'get_call_status',
              description: 'Get the status of a call',
              inputSchema: {
                type: 'object',
                properties: {
                  call_id: {
                    type: 'string',
                    description: 'The ID of the call'
                  }
                },
                required: ['call_id']
              }
            },
            {
              name: 'list_recent_calls',
              description: 'List recent calls with optional filters',
              inputSchema: {
                type: 'object',
                properties: {
                  limit: {
                    type: 'number',
                    description: 'Number of calls to return (default: 10)'
                  },
                  status: {
                    type: 'string',
                    description: 'Filter by call status (completed, in-progress, failed)'
                  }
                }
              }
            }
          ]
        };
        break;

      case 'tools/call':
        const { name, arguments: args } = request.params || {};

        if (!name) {
          return res.status(400).json({
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32602,
              message: 'Invalid params: tool name is required'
            }
          });
        }

        switch (name) {
          
          case 'health_check':
            result = {
              content: [{
                type: 'text',
                text: '✅ LeadDial MCP Server is healthy and running!\n\nServer Status:\n- Version: 1.0.0\n- Uptime: Active\n- Timestamp: ' + new Date().toISOString()
              }]
            };
            break;

          case 'get_lead_info':
            // Mock data - replace with actual database query
            result = {
              content: [{
                type: 'text',
                text: `Lead Information:\n\nLead ID: ${args.lead_id}\nName: John Doe\nPhone: +1-555-0123\nEmail: john.doe@example.com\nStatus: Active\nLast Contact: ${new Date().toISOString()}\nNotes: Interested in premium package`
              }]
            };
            break;

          case 'create_call':
            // Mock response - replace with actual call creation logic
            const callId = `CALL-${Date.now()}`;
            result = {
              content: [{
                type: 'text',
                text: `✅ Call Created Successfully!\n\nCall ID: ${callId}\nPhone Number: ${args.phone_number}\nLead ID: ${args.lead_id || 'N/A'}\nStatus: Initiated\nCreated: ${new Date().toISOString()}`
              }]
            };
            break;

          case 'get_call_status':
            // Mock data - replace with actual database query
            result = {
              content: [{
                type: 'text',
                text: `Call Status:\n\nCall ID: ${args.call_id}\nStatus: Completed\nDuration: 5m 32s\nOutcome: Successful\nNotes: Lead showed interest\nTimestamp: ${new Date().toISOString()}`
              }]
            };
            break;

          case 'list_recent_calls':
            const limit = args?.limit || 10;
            const status = args?.status || 'all';
            
            // Mock data - replace with actual database query
            const calls = [
              { id: 'CALL-001', phone: '+1-555-0123', status: 'completed', duration: '3m 45s' },
              { id: 'CALL-002', phone: '+1-555-0124', status: 'in-progress', duration: '1m 12s' },
              { id: 'CALL-003', phone: '+1-555-0125', status: 'completed', duration: '5m 20s' },
            ];

            result = {
              content: [{
                type: 'text',
                text: `Recent Calls (Limit: ${limit}, Status: ${status}):\n\n` + 
                  calls.map(call => 
                    `📞 ${call.id}\n   Phone: ${call.phone}\n   Status: ${call.status}\n   Duration: ${call.duration}`
                  ).join('\n\n')
              }]
            };
            break;

          default:
            return res.status(400).json({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32601,
                message: `Unknown tool: ${name}`
              }
            });
        }
        break;

      case 'resources/list':
        result = {
          resources: [
            {
              uri: 'leaddial://calls',
              name: 'Recent Calls',
              description: 'List of recent calls',
              mimeType: 'application/json'
            },
            {
              uri: 'leaddial://leads',
              name: 'Lead Database',
              description: 'Access to lead information',
              mimeType: 'application/json'
            }
          ]
        };
        break;

      default:
        return res.status(400).json({
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`
          }
        });
    }

    // Return successful JSON-RPC 2.0 response
    const response = {
      jsonrpc: '2.0',
      id: request.id,
      result: result
    };

    console.log('=== MCP Response ===');
    console.log(JSON.stringify(response, null, 2));
    
    return res.json(response);

  } catch (error) {
    console.error('MCP Error:', error);
    return res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    });
  }
});

// Legacy endpoint for backward compatibility (optional)
app.get('/mcp', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LeadDial MCP Server',
    version: '1.0.0',
    message: 'Use POST request to interact with MCP protocol',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
const PORT = 2000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 LeadDial MCP Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Server running on port ${PORT}
✓ Health check: http://localhost:${PORT}/
✓ MCP endpoint: http://localhost:${PORT}/mcp
✓ Time: ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});