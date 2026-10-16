# 🏠 Property Dealing Website

> **Main application:** `nextjs-app/` includes the website and API. See [LOCAL_SETUP.md](LOCAL_SETUP.md) for the prepared local configuration, startup commands, project map, and verification status. Start the prepared production build with `npm.cmd --prefix nextjs-app run start:local`, then visit `http://localhost:3100`. The older three-app instructions below are retained for reference; their seed step must not be run against the existing live database.

#🌐 **Deployed Link: [pawanbuildhome.vercel.app](https://pawanbuildhome.vercel.app/)** 🌐
---
<div align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" alt="JWT">
</div>

<br>

<div align="center">
  <h3>🌟 A comprehensive real estate platform with modern design and powerful features 🌟</h3>
  <p>
    <strong>Built with React, Node.js, and MongoDB</strong><br>
    Features responsive design, dark mode, and admin panel for complete property management
  </p>
</div>

---

## 📖 Overview

> **Transform your real estate business with our cutting-edge property dealing platform!**

This comprehensive real estate platform provides users with an intuitive interface for exploring properties, viewing detailed society information, and contacting agents. The project consists of three main components working in perfect harmony:

<table align="center">
<tr>
<td align="center">
<img src="https://cdn-icons-png.flaticon.com/512/1055/1055687.png" width="60" height="60"><br>
<strong>🎨 Frontend</strong><br>
Modern React Interface
</td>
<td align="center">
<img src="https://cdn-icons-png.flaticon.com/512/1126/1126012.png" width="60" height="60"><br>
<strong>⚙️ Backend</strong><br>
Robust Node.js API
</td>
<td align="center">
<img src="https://cdn-icons-png.flaticon.com/512/2040/2040946.png" width="60" height="60"><br>
<strong>👨‍💼 Admin Panel</strong><br>
Powerful Management System
</td>
</tr>
</table>

---

## ✨ Features

### 🎨 **Frontend Features**

<div align="center">
<table>
<tr>
<td align="center" width="50%">

#### 📱 **User Experience**
- 🔥 **Responsive Design** - Fluid layouts for all devices
- 🌙 **Dark Mode Support** - System preference detection
- 🎬 **Smooth Animations** - Engaging page transitions
- ⬆️ **Scroll-to-Top** - Easy navigation
- ♿ **Accessibility** - ARIA labels & focus styles

</td>
<td align="center" width="50%">

#### 🏡 **Property Features**
- 🏘️ **Property Listings** - Area-based filtering
- 🏢 **Society Showcase** - Interactive image sliders
- 🔍 **Detailed Views** - Complete property information
- 📧 **Contact Forms** - Inquiry submission
- 🌐 **API Integration** - Real-time data fetching

</td>
</tr>
</table>
</div>

### ⚙️ **Backend Features**

<div align="center">
<table>
<tr>
<td align="center" width="33%">

#### 🔐 **Security & Auth**
- 🔒 **JWT Authentication**
- 🛡️ **CORS Configuration**
- 🚨 **Error Handling**
- 🔑 **Admin Protection**

</td>
<td align="center" width="33%">

#### 🗄️ **Data Management**
- 📊 **MongoDB Schemas**
- 🌱 **Database Seeding**
- 🔄 **Migration Support**
- 📈 **Scalable Architecture**

</td>
<td align="center" width="33%">

#### 🖼️ **Media & API**
- ☁️ **Cloudinary Integration**
- 🌐 **RESTful Endpoints**
- 📤 **File Uploads**
- 🎯 **Image Optimization**

</td>
</tr>
</table>
</div>

### 👨‍💼 **Admin Panel Features**

<div align="center">
<table>
<tr>
<td align="center" width="50%">

#### 📞 **Contact Management**
- 📋 **Inquiry Tracking** - Status & priority management
- 🔍 **Advanced Filtering** - Quick search & sort
- ✏️ **Edit Capabilities** - Update contact details
- 📊 **Status Tracking** - New, contacted, in-progress, closed

</td>
<td align="center" width="50%">

#### 🏘️ **Property & Area Management**
- 🔀 **Drag & Drop** - Reorder properties & areas
- 🖼️ **Image Carousels** - Visual property galleries
- 🗺️ **Map Integration** - Location-based organization
- 🔗 **External Links** - 99acres & MagicBricks integration

</td>
</tr>
</table>
</div>

---


## 🗂️ Project Structure

<div align="center">
<img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
<img src="https://img.shields.io/badge/Admin-MUI-007FFF?style=for-the-badge&logo=mui&logoColor=white">
</div>

<br>


🔷 Full Project Structure
```
Property-Dealing/
├── ADMIN-PANEL/
├── BACKEND/
└── PROP_DEALING_FRONTEND/
```

✅ Frontend (PROP_DEALING_FRONTEND)
```
PROP_DEALING_FRONTEND/
├── node_modules/
├── public/
├── src/
│   ├── components/
│   │   ├── Contact.jsx
│   │   ├── Contact.css
│   │   ├── Footer.jsx
│   │   ├── Footer.css
│   │   ├── Header.jsx
│   │   ├── Header.css
│   │   ├── Home.jsx
│   │   ├── Home.css
│   │   ├── ImageSlider.jsx
│   │   ├── ImageSlider.css
│   │   ├── Listings.jsx
│   │   ├── Listings.css
│   │   ├── Modal.jsx
│   │   ├── Modal.css
│   │   ├── PageTransition.jsx
│   │   ├── Properties.jsx
│   │   ├── Properties.css
│   │   ├── PropertyDetail.jsx
│   │   ├── PropertyDetail.css
│   │   ├── ScrollToTop.jsx
│   │   ├── ScrollToTop.css
│   │   ├── Societies.jsx
│   │   ├── Societies.css
│
│   ├── data/
│   │   └── data.js
│
│   ├── fonts/
│   │   └── gilmer-light.otf
│
│   ├── hooks/
│   │   └── useTheme.js
│
│   ├── services/
│   │   └── api.js
│
│   ├── App.js
│   ├── App.css
│   ├── App.test.js
│   ├── index.js
│   ├── index.css
│   ├── logo.svg
│   ├── reportWebVitals.js
│   ├── setupTests.js
│
├── .env.production
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── vercel.json
```
✅ Backend (BACKEND)
```
BACKEND/
├── middleware/
│   ├── auth.js
│   └── upload.js
│
├── models/
│   ├── Area.js
│   ├── Contact.js
│   ├── Property.js
│   └── SliderImage.js
│
├── routes/
│   ├── areas.js
│   ├── auth.js
│   ├── contacts.js
│   ├── properties.js
│   ├── societies.js
│   └── uploads.js
│
├── node_modules/
├── .env
├── .env.production
├── .gitignore
├── migrate-order.js
├── package.json
├── package-lock.json
├── seed.js
├── server.js
└── vercel.json
```
✅ Admin Panel (ADMIN-PANEL)

```
ADMIN-PANEL/
├── public/
├── src/
│   ├── components/
│   │   └── ImageUpload/
│   │       ├── ImageUpload.js
│
│   ├── Layout/
│   │   └── Layout.js
│
│   ├── Login/
│   │   └── Login.js
│
│   ├── ProtectedRoute/
│   │   └── ProtectedRoute.js
│
│   ├── contexts/
│   │   └── AuthContext.js
│
│   ├── pages/
│   │   ├── Areas.js
│   │   ├── Contacts.js
│   │   ├── Dashboard.js
│   │   ├── Images.js
│   │   └── Properties.js
│
│   ├── services/
│   │   └── api.js
│
│   ├── utils/
│   │   └── imageUtils.jsx
│
│   ├── App.js
│   ├── App.css
│   ├── App.test.js
│   ├── index.js
│   ├── index.css
│   ├── logo.svg
│   ├── reportWebVitals.js
│   └── setupTests.js
│
├── .env.production
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

## 🚀 Quick Start

### 🔧 **Prerequisites**

<div align="center">
<table>
<tr>
<td align="center">
<img src="https://nodejs.org/static/images/logo.svg" width="60" height="60"><br>
<strong>Node.js v16+</strong>
</td>
<td align="center">
<img src="https://raw.githubusercontent.com/npm/logos/master/npm%20logo/npm-logo-red.svg" width="60" height="60"><br>
<strong>npm / yarn</strong>
</td>
<td align="center">
<img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mongodb/mongodb.png" width="60" height="60"><br>
<strong>MongoDB</strong>
</td>
</tr>
</table>
</div>

### 📦 **Installation Steps**

#### 1️⃣ **Clone Repository**
```bash
git clone <repository-url>
cd Property-Dealing
```

#### 2️⃣ **Backend Setup**
```bash
cd BACKEND
npm install

# Create .env file
echo "MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-cloudinary-key>
CLOUDINARY_API_SECRET=<your-cloudinary-secret>
ADMIN_USERNAME=<admin-username>
ADMIN_PASSWORD=<admin-password>
PORT=5000" > .env

# Seed database
node seed.js

# Start server
npm start
```

#### 3️⃣ **Frontend Setup**
```bash
cd ../PROP_DEALING_FRONTEND
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start frontend
npm start
```

#### 4️⃣ **Admin Panel Setup**
```bash
cd ../ADMIN-PANEL
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start admin panel
npm start
```

<div align="center">
<img src="https://img.shields.io/badge/Frontend-localhost:3000-4CAF50?style=for-the-badge&logo=react&logoColor=white">
<img src="https://img.shields.io/badge/Backend-localhost:5000-FF6B6B?style=for-the-badge&logo=nodedotjs&logoColor=white">
<img src="https://img.shields.io/badge/Admin-localhost:3001-9C27B0?style=for-the-badge&logo=material-ui&logoColor=white">
</div>

---

## 🎯 Usage Guide

### 🌐 **Frontend Navigation**

<div align="center">
<table>
<tr>
<td align="center" width="20%">
<strong>🏠 Home</strong><br>
Hero & Featured Properties
</td>
<td align="center" width="20%">
<strong>🏘️ Properties</strong><br>
Browse All Listings
</td>
<td align="center" width="20%">
<strong>📍 Listings</strong><br>
Filter by Area
</td>
<td align="center" width="20%">
<strong>🏢 Societies</strong><br>
Interactive Galleries
</td>
<td align="center" width="20%">
<strong>📧 Contact</strong><br>
Submit Inquiries
</td>
</tr>
</table>
</div>

### 🔐 **Admin Panel Features**

<div align="center">
<table>
<tr>
<td align="center" width="33%">
<img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" width="60" height="60"><br>
<strong>📞 Contact Management</strong><br>
<small>Track inquiries, set priorities, update status</small>
</td>
<td align="center" width="33%">
<img src="https://cdn-icons-png.flaticon.com/512/1946/1946488.png" width="60" height="60"><br>
<strong>🏘️ Property Management</strong><br>
<small>Add, edit, reorder properties with images</small>
</td>
<td align="center" width="33%">
<img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" width="60" height="60"><br>
<strong>🗺️ Area Management</strong><br>
<small>Organize locations, societies, and maps</small>
</td>
</tr>
</table>
</div>

---

## 🛠️ Technology Stack

### Frontend Technologies
<div align="center">
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white">
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white">
<img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white">
<img src="https://img.shields.io/badge/Font_Awesome-339AF0?style=for-the-badge&logo=fontawesome&logoColor=white">
</div>

### Backend Technologies
<div align="center">
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white">
<img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white">
<img src="https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white">
<img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white">
<img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white">
</div>

### Admin Panel Technologies
<div align="center">
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/Material--UI-0081CB?style=for-the-badge&logo=material-ui&logoColor=white">
<img src="https://img.shields.io/badge/DnD_Kit-FF6B6B?style=for-the-badge&logo=dnd&logoColor=white">
<img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white">
</div>

---

## 🌟 Key Highlights

<div align="center">
<table>
<tr>
<td align="center" width="25%">
<img src="https://cdn-icons-png.flaticon.com/512/1055/1055687.png" width="60" height="60"><br>
<strong>🎨 Modern UI/UX</strong><br>
<small>Responsive design with dark mode support</small>
</td>
<td align="center" width="25%">
<img src="https://cdn-icons-png.flaticon.com/512/2040/2040946.png" width="60" height="60"><br>
<strong>🔐 Secure Admin</strong><br>
<small>JWT authentication & role-based access</small>
</td>
<td align="center" width="25%">
<img src="https://cdn-icons-png.flaticon.com/512/1828/1828490.png" width="60" height="60"><br>
<strong>☁️ Cloud Storage</strong><br>
<small>Cloudinary integration for images</small>
</td>
<td align="center" width="25%">
<img src="https://cdn-icons-png.flaticon.com/512/2040/2040520.png" width="60" height="60"><br>
<strong>🔀 Drag & Drop</strong><br>
<small>Reorder properties & areas easily</small>
</td>
</tr>
</table>
</div>

---

## 📊 API Endpoints

### 🌐 **Public Endpoints**
| Method | Endpoint | Description |
|--------|----------|-------------|
| 🟢 GET | `/api/health` | ✅ Server health check |
| 🟢 GET | `/api/areas` | 🗺️ Get all areas |
| 🟢 GET | `/api/properties` | 🏘️ Get all properties |
| 🟢 GET | `/api/properties/area/:areaKey` | 📍 Properties by area |
| 🟢 GET | `/api/societies/:areaKey/:subAreaId` | 🏢 Get societies |
| 🟢 GET | `/api/uploads/slider` | 🖼️ Get slider images |
| 🟡 POST | `/api/contacts` | 📧 Submit inquiry |

### 🔐 **Protected Endpoints**
| Method | Endpoint | Description |
|--------|----------|-------------|
| 🟡 POST | `/api/auth/login` | 🔑 Admin login |
| 🟡 POST | `/api/properties` | ➕ Create property |
| 🟠 PUT | `/api/properties/:id` | ✏️ Update property |
| 🔴 DELETE | `/api/properties/:id` | 🗑️ Delete property |
| 🟠 PUT | `/api/properties/reorder` | 🔀 Reorder properties |


---

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Backend Deployment (Render/Heroku)
```bash
# Set environment variables
# Deploy using platform-specific instructions
```

<div align="center">
<img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white">
<img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white">
<img src="https://img.shields.io/badge/Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white">
</div>

---

## 📋 Future Enhancements

<div align="center">
<table>
<tr>
<td align="center" width="25%">
<img src="https://cdn-icons-png.flaticon.com/512/1055/1055687.png" width="50" height="50"><br>
<strong>🔍 Advanced Search</strong><br>
<small>Multi-criteria filtering</small>
</td>
<td align="center" width="25%">
<img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" width="50" height="50"><br>
<strong>👤 User Authentication</strong><br>
<small>Save favorite properties</small>
</td>
<td align="center" width="25%">
<img src="https://cdn-icons-png.flaticon.com/512/2040/2040946.png" width="50" height="50"><br>
<strong>📊 Analytics Dashboard</strong><br>
<small>Track user engagement</small>
</td>
<td align="center" width="25%">
<img src="https://cdn-icons-png.flaticon.com/512/1828/1828490.png" width="50" height="50"><br>
<strong>📱 Mobile App</strong><br>
<small>React Native version</small>
</td>
</tr>
</table>
</div>

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:



### 📝 **Contribution Steps**

1. 🍴 **Fork** the repository
2. 🌿 **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. 📤 **Push** to the branch (`git push origin feature/amazing-feature`)
5. 🔄 **Create** a Pull Request

---

## 📄 License

<div align="center">
<img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge">
</div>

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

<div align="center">
<h3>Built with ❤️ by <strong>Tejas Jaiswal</strong></h3>


<p><em>🚀 Turning ideas into reality, one line of code at a time</em></p>
</div>

---

<div align="center">
<h3>⭐ Star this repository if you found it helpful!</h3>

<div align="center">

## Current website and admin release

The production website and API are in `nextjs-app/`; the redesigned admin is in `admin-panel/`. Both deploy from this repository to their existing Vercel projects. See [DEPLOYMENT.md](DEPLOYMENT.md) for production environment variables, free MongoDB/Cloudinary setup, data management, plan limits and verification.
