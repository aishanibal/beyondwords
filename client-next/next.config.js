module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/analyze',
        destination: 'http://localhost:4000/api/analyze', // Express backend
      },
      {
        source: '/api/conversations/:id/messages',
        destination: 'http://localhost:4000/api/conversations/:id/messages', // Express backend
      },
      {
        source: '/api/suggestions',
        destination: 'http://localhost:4000/api/suggestions', // Express backend
      },
      {
        source: '/api/short_feedback',
        destination: 'http://localhost:4000/api/short_feedback', // Express backend
      },
      {
        source: '/api/feedback',
        destination: 'http://localhost:4000/api/feedback', // Express backend
      },
      {
        source: '/api/detailed_breakdown',
        destination: 'http://localhost:4000/api/detailed_breakdown', // Express backend
      },
      {
        source: '/api/translate',
        destination: 'http://localhost:4000/api/translate', // Express backend
      },
      {
        source: '/api/health',
        destination: 'http://localhost:4000/api/health', // Express backend
      },
      {
        source: '/api/conversations',
        destination: 'http://localhost:4000/api/conversations', // Express backend
      },
      {
        source: '/api/conversations/:id',
        destination: 'http://localhost:4000/api/conversations/:id', // Express backend
      },
      {
        source: '/api/conversations/:id/messages',
        destination: 'http://localhost:4000/api/conversations/:id/messages', // Express backend
      },
      {
        source: '/api/messages/feedback',
        destination: 'http://localhost:4000/api/messages/feedback', // Express backend
      },
      {
        source: '/api/short_feedback',
        destination: 'http://localhost:4000/api/short_feedback', // Express backend
      }
    ];
  },
}; 