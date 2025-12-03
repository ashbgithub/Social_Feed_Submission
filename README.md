🚀 Social Feed Backend (Node.js + MySQL)
📌 Overview

A backend system for a social feed with:

User signup/login

Create posts

Like posts

Follow users

Block users (blocked user cannot see posts)

Activity feed

Admin & Owner roles (promote, revoke, delete user)

⚙️ Setup
1. Install dependencies
npm install

2. Create .env
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=social_feed
JWT_SECRET=secret123
PORT=4000

3. Import database

Run in MySQL:

SOURCE database.sql;

🧪 API Endpoints (use Postman)
Auth

POST /auth/signup

POST /auth/login → returns token

Use token in headers:

Authorization: Bearer <token>

Posts

POST /posts → create post

POST /posts/:id/like

User Actions

POST /users/:id/follow

POST /users/:id/block

Feed

GET /feed

Admin / Owner

POST /users/:id/make-admin (owner only)

POST /users/:id/revoke-admin (owner only)

DELETE /users/:id (admin/owner)

4. Start server
npm start
