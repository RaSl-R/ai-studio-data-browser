# Data Browser - React + PostgreSQL

Modern data browser application with authentication and schema management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon.tech recommended)

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create \`.env\` file:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Update database credentials in \`.env\`

5. Run the application:
   \`\`\`bash
   npm run dev:all
   \`\`\`

6. Open http://localhost:3000

## 📝 Features

✅ Schema and table browsing
✅ Data pagination (50 rows per page)
✅ WHERE clause filtering
✅ CSV export
✅ Responsive design

🚧 Coming soon:
- Full authentication system
- Permission management
- Data editing
- CSV import

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express, Node.js, PostgreSQL (pg)
- **Database**: PostgreSQL (Neon.tech)
- **Icons**: Lucide React

## 📦 Project Structure

\`\`\`
src/
├── components/     # React components
├── services/       # API services
├── types.ts        # TypeScript types
├── utils.ts        # Utility functions
└── App.tsx         # Main app component

server/
└── index.ts        # Express API server
\`\`\`

## 🔒 Security Notes

⚠️ This is a development version. Before production:

1. Implement proper JWT authentication
2. Add rate limiting
3. Enhance SQL injection protection
4. Set up HTTPS
5. Configure CORS properly
6. Add audit logging

## 📖 API Endpoints

- \`GET /api/schemas\` - List all schemas
- \`GET /api/schemas/:schema/tables\` - List tables in schema
- \`GET /api/schemas/:schema/tables/:table/info\` - Get table metadata
- \`POST /api/schemas/:schema/tables/:table/data\` - Get table data with pagination

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines first.

## 📄 License

MIT License - see LICENSE file for details
\`\`\`

---

## 🚀 Deployment Instructions

### For GitHub Codespaces:

1. **Create repository on GitHub**
   - Upload all files
   - Push to GitHub

2. **Open in Codespaces**
   - Click "Code" → "Codespaces" → "Create codespace on main"

3. **Set environment variables**
```bash
   cp .env.example .env
   # Edit .env with your credentials
```

4. **Install and run**
```bash
   npm install
   npm run dev:all
```

5. **Access the app**
   - Codespaces will provide a URL
   - Click "Open in Browser" when prompted

### For Cloudflare Pages:

**Note**: Cloudflare Pages supports static sites. You'll need to deploy the backend separately (Cloudflare Workers or external service).

**Frontend only:**
```bash
npm run build
# Deploy the 'dist' folder to Cloudflare Pages
```

**Full stack with Cloudflare Workers:**
- Convert Express backend to Cloudflare Workers
- Use Cloudflare D1 or connect to external PostgreSQL
- Deploy frontend to Pages, backend to Workers

### Alternative: Deploy to Vercel/Netlify

Both support full-stack deployment with serverless functions.

## 📞 Support

For issues or questions, please open a GitHub issue.