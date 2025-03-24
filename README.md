# Library Management System

## 📌 Project Overview
The **Library Management System** is a web-based application built using **Node.js**, **EJS**, and **Tailwind CSS**, with **MySQL** as the database. It allows users to manage books, authors, and members efficiently, providing a seamless way to track library activities.

## 🚀 Features
- **User Authentication**: Register, login, and manage user accounts.
- **Book Management**: Add, edit, delete, and search for books.
- **Member Management**: Add and track members who borrow books.
- **Borrow & Return System**: Manage book lending with due dates.
- **Dashboard**: View system statistics and activities.
- **Responsive UI**: Built with Tailwind CSS for a clean and modern design.

## 🛠️ Tech Stack
- **Backend**: Node.js (Express.js)
- **Frontend**: EJS (Embedded JavaScript)
- **Styling**: Tailwind CSS
- **Database**: MySQL
- **Icons**: Font Awesome

## ⚙️ Installation
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/Sk-technic/library_management.git
cd library_management
```
### 2️⃣ Install Dependencies
```sh
npm install
```
### 3️⃣ Setup MySQL Database
- Create a MySQL database (e.g., `library_db`).
- Run the database initialization script:
```sh
npm run init-db
```
- Update the `.env` file with database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=library_db
```

### 4️⃣ Start the Server
For development mode with **nodemon**:
```sh
npm run dev
```
For production mode:
```sh
npm start
```
The application will run at `http://localhost:3000`

## 📸 Screenshots
(Include screenshots of the UI here)

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).

## 🤝 Contributing
Pull requests are welcome! Feel free to improve the system and submit changes.

---
Made with ❤️ by [Sk-technic](https://github.com/Sk-technic)

