export function buildOpenApiSpec(): Record<string, unknown> {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Mastery League Classroom API',
      version: '1.0.0',
      description:
        'Agent-Ready API for Mastery League: AI-Adaptive Classroom Gaming (Speed Sprints, Last-Student-Standing, BKT Ontology Handicap, and Teacher Misconception Radar).'
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Service health and verified engine status',
          responses: { '200': { description: 'Healthy service response' } }
        }
      },
      '/api/curricula': {
        get: {
          summary: 'List K-12 curriculum prerequisite ontology graphs',
          responses: { '200': { description: 'Array of curriculum ontology graphs' } }
        }
      },
      '/api/safety/check': {
        post: {
          summary: 'Evaluate student handle or classroom text via ConvoGuard AI policy',
          responses: { '200': { description: 'Safety evaluation verdict' } }
        }
      },
      '/api/sessions': {
        post: {
          summary: 'Create a live 4-digit PIN classroom session',
          responses: { '201': { description: 'Created classroom session state' } }
        }
      },
      '/api/sessions/{pin}': {
        get: {
          summary: 'Fetch live classroom state and Teacher Mastery Radar',
          responses: {
            '200': { description: 'Classroom session snapshot' },
            '404': { description: 'Classroom PIN not found' }
          }
        }
      },
      '/api/sessions/{pin}/join': {
        post: {
          summary: 'Join a student into a classroom session with ConvoGuard AI check',
          responses: {
            '200': { description: 'Updated session and joined student participant' },
            '400': { description: 'Blocked by child-safety policy or invalid input' }
          }
        }
      },
      '/api/sessions/{pin}/rounds/next': {
        post: {
          summary: 'Advance classroom round and assign ZPD-calibrated questions per student',
          responses: { '200': { description: 'Active round classroom state' } }
        }
      },
      '/api/sessions/{pin}/answers': {
        post: {
          summary: 'Submit student answer, update BKT mastery posterior, and diagnose misconceptions',
          responses: { '200': { description: 'Updated standings, shields, and Teacher Radar' } }
        }
      }
    }
  };
}

export function renderSwaggerHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mastery League API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({ url: '/api/openapi.json', dom_id: '#swagger-ui' });
    };
  </script>
</body>
</html>`;
}
