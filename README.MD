# AI Expense Tracker - Backend API Server

This is the backend API server for the **AI Expense Tracker** web and mobile application. The server is built using **Node.js**, **Express**, and **MongoDB** (via Mongoose), and integrates with **Google Gemini AI** (for automated receipt and voice parsing), **Razorpay** (for subscription billing payments), and **UPI Deep Linking** (for instant split bill payments).

---

## 📂 Project Structure & Architecture

The application adopts a **Modular Architecture**. Instead of separating the project strictly by layers (controllers folder, routes folder, etc.), the codebase is grouped by domain modules inside `src/modules/`. This design makes it highly maintainable and easy to scale.

```text
├── server.js                   # Application runner (starts connections and background schedulers)
├── app.js                      # Express setup, middleware pipelines, and core routing mounts
├── src/
│   ├── config/                 # Third-party configurations (Cloudinary, Mongoose DB, Gemini Client)
│   └── modules/                # Feature modules
│       ├── auth/               # User registration, JWT login, OTP password resets, upiId profile updates
│       ├── transaction/        # Expense & income tracking, category budget allocations
│       ├── groups/             # Group management, member management, owner/admin validation
│       ├── splitRequests/      # Bill splitting, payment status tracking, automatic transaction creation
│       ├── upi/                # NPCI compliant UPI Deep Link generation for instant settlements
│       ├── ai/                 # Gemini API wrapper for receipt scanning, voice parsing, chatbot
│       ├── payment/            # Razorpay orders, payments processing, signature verification
│       ├── plan/               # Subscription plans creation, version histories, admin drafts
│       ├── subscription/       # State validation, extend dates, auto-expiry cron schedulers
│       ├── notification/       # Internal in-app notification events & daily scheduler alerts
│       └── ...                 # Other modules (dashboard, analytics, upload, calendar, export)
```

### Module Blueprint
Each module typically exposes the following files:
1. `routes.js`: Defines Express router paths, securing them with middlewares (`authenticate`, `requireAdmin`).
2. `controller.js`: Receives requests, validates payload parameters, triggers services, and responds with JSON.
3. `service.js`: Holds core business logic.
4. `repository.js` (optional): Encapsulates Mongoose query structures, separating database logic from services.
5. `model.js`: Declares MongoDB database schemas.
6. `validation.js` / `middleware.js`: Custom validation validators (Zod/express-validator) and role rules.

---

## ⚡ UPI Deep Link & Group Payment Rules

### 1. UPI Deep Link Generation (`POST /api/upi/deeplink`)
Generates NPCI compliant standard UPI payment links for split expenses:
- **Endpoint**: `POST /api/upi/deeplink`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**: `{ "splitRequestId": "<splitRequestId>" }`
- **Response**:
  ```json
  {
    "success": true,
    "message": "UPI Deep Link generated successfully.",
    "data": {
      "deepLink": "upi://pay?pa=laxman@dcdf&pn=Laxman&am=150.00&cu=INR&tn=Dinner&tr=TR172215...&mode=00",
      "amount": 150,
      "receiver": "Laxman Raut",
      "upiId": "laxman@dnc"
    }
  }
  ```

### 2. Group Admin & Creator Authorization Rules
- **Group Creator / Admin & Split Creator**: Authorized to change any participant's status to `paid` or `pending`.
- **Regular Members**: Restricted to marking ONLY their own payment share. Attempts to change another member's status throw a 403 Forbidden error: `"Only group admin or creator can mark other members as paid"`.

---

## 💳 Subscription Management Engine

The backend implements a hybrid subscription check model designed for high performance, database statistics consistency, and transaction audit trails:

### 1. The Core Lifecycle States
A user's subscription tier can change between four states:
- `active`: Subscription is active, granting access to premium Pro features.
- `cancelled`: Auto-renewal is turned off, but access remains active until the subscription end date.
- `expired`: Subscription duration has completed.
- `inactive`: Free tier user who has not initiated a Pro subscription.

### 2. The Hybrid Sync System (How it Works under the hood)
To ensure the subscription state is always accurate, the system operates on two parallel tracks:

* **On-Demand Validation (`syncUserSubscription`)**:
  - Whenever a user logs in or hits a route requiring Pro access, the backend runs a quick validation sweep in `src/modules/subscription/service.js`.
  - It checks if the current time has surpassed the subscription `endDate`.
  - It validates **payment integrity** (for Razorpay/Google Play providers) by confirming that a matching successful Payment record exists, preventing database spoofing.
  - If a change is detected, it updates the database and publishes an audit log to `SubscriptionHistory` exactly once.

* **Proactive Background Scheduler (`scheduler.js`)**:
  - A background scheduler is registered on server start (`server.js`). It scans the database every 60 seconds.
  - **Auto-Expiration**: It sweeps the DB, detects expired users who haven't logged in recently, marks them `"expired"`, creates a `SubscriptionHistory` audit, and generates an in-app notification.
  - **Warning Notices**: It flags users whose subscriptions expire in **3 days** and sends them a `"Subscription Expiring Soon"` warning notification exactly once per subscription period.

---

## 🛠️ Getting Started & Installation

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB database (local or Mongo Atlas cluster URI)
- Google Gemini API Key
- Razorpay API developer keys

### Installation Steps

1. **Clone and Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory (or use the pre-configured keys):
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your_secret_key
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   GEMINI_API_KEY=...
   EMAIL_USER=...
   EMAIL_PASS=...
   RAZORPAY_KEY_ID=...
   RAZORPAY_KEY_SECRET=...
   ```

3. **Start the Application:**
   * **Development Mode (with auto-reload):**
     ```bash
     npm run dev
     ```
   * **Production Mode:**
     ```bash
     npm start
     ```
