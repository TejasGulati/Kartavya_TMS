# Kartavya - Task Management System

A full-stack task management application with user authentication, task assignment, and file attachments.

---

## 🚀 Features

- ✅ User authentication (register/login)
- 📋 Task management (create, read, update, delete)
- 📎 File attachments (PDF only)
- 👥 User roles (admin/user)
- 📱 Responsive UI

---

## 🛠️ Tech Stack

### Frontend:
- React.js
- React Router
- Tailwind CSS
- Axios
- React Hot Toast

### Backend:
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Multer for file uploads

---

## ⚙️ Setup

### 🔧 Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/kartavya.git
````

2. Navigate to the server directory:

   ```bash
   cd server
   ```
3. Install dependencies:

   ```bash
   npm install
   ```
4. Create a `.env` file based on `.env.example`
5. Start the server:

   ```bash
   npm start
   ```

### 🎨 Frontend Setup

1. Navigate to the client directory:

   ```bash
   cd client
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the development server:

   ```bash
   npm start
   ```

---

## 🔐 Environment Variables

### 📁 Backend (`server/.env`)

```env
NODE_ENV=development
PORT=5001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads
```

### 🌐 Frontend (`client/.env`)

```env
REACT_APP_API_URL=http://localhost:5001/api
```

---

## 🚀 Deployment

### Vercel Deployment

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and import both the frontend and backend projects
3. For the backend, set up the environment variables from `.env`
4. For the frontend, set:

   ```env
   REACT_APP_API_URL=https://your-backend-url.vercel.app/api
   ```

---

## 📡 API Endpoints

### 🔑 Authentication

* `POST /api/auth/register` – Register a new user
* `POST /api/auth/login` – User login
* `GET /api/auth/me` – Get current user profile

### 📌 Tasks

* `GET /api/tasks` – Get all tasks
* `POST /api/tasks` – Create a new task
* `GET /api/tasks/:id` – Get task by ID
* `PUT /api/tasks/:id` – Update task
* `DELETE /api/tasks/:id` – Delete task

### 📎 Attachments

* `POST /api/tasks/:id/attachments` – Upload attachment (PDF)
* `GET /api/tasks/:id/attachments/:filename` – Download attachment
* `DELETE /api/tasks/:id/attachments/:filename` – Delete attachment

### 👤 Users

* `GET /api/users` – Get all users (admin only)
* `GET /api/users/:id` – Get user by ID
* `PUT /api/users/:id` – Update user
* `DELETE /api/users/:id` – Delete user (admin only)

---

## 📄 License

This project is licensed under the MIT License.

```

