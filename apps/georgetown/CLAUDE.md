# Georgetown Rotary Club Management System Documentation

## Overview
This document outlines the comprehensive details for the Georgetown Rotary Club management system, serving to facilitate effective management and operations for the club.

## Tech Stack
- **Front-end:** React.js
- **Back-end:** Node.js with Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **Hosting:** Heroku
- **Version Control:** Git/GitHub

## Development Setup
1. **Clone the Repository**:  
   ```bash
   git clone https://github.com/brandomy/clubs.git
   cd clubs
   ```  
2. **Install Dependencies**:  
   ```bash
   npm install
   ```  
3. **Environment Variables**:  
   Create a `.env` file in the root directory with the following variables:
   ```bash
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```  
4. **Run the Application**:  
   ```bash
   npm start
   ```  
   The server will start on `http://localhost:5000`.

## Architecture Patterns
- **MVC (Model-View-Controller)**: The application follows the MVC pattern to separate concerns, making the codebase more organized and maintainable.  
- **RESTful API**: The backend is designed as a RESTful API, allowing for easy interaction with the front-end.  

## Key Features
1. **User Authentication**: Secure user sign-up and login using JWT.  
2. **Event Management**: Create, update, and delete events for the club.  
3. **Member Management**: Manage member information, including roles and responsibilities.
4. **Notifications**: Send notifications for upcoming events and meetings.
5. **Analytics Dashboard**: Overview of club performance and engagement metrics.

## Conclusion
This documentation serves as a guideline for developers and contributors in understanding the Georgetown Rotary Club management system's architecture and functionalities. For any issues or contributions, please refer to the project's GitHub repository and contribute accordingly.