# DigitalVault — Next.js Full Stack App

## 📁 Folder Structure
```
digitalvault-next/
├── app/
│   ├── page.jsx                    ← Landing page
│   ├── login/page.jsx              ← Customer login
│   ├── register/page.jsx           ← Customer register
│   ├── account/page.jsx            ← Customer account + downloads
│   ├── cart/page.jsx               ← Cart page
│   ├── product/[id]/page.jsx       ← Product detail page
│   ├── download/page.jsx           ← Download page
│   ├── my-orders/page.jsx          ← Find orders by email
│   ├── admin/
│   │   ├── login/page.jsx          ← Admin login
│   │   └── dashboard/page.jsx      ← Admin dashboard
│   └── api/
│       ├── product/route.js        ← Product CRUD
│       ├── product/[id]/route.js   ← Product by ID
│       ├── order/route.js          ← Order + payment + downloads
│       ├── customer/route.js       ← Auth (register/login/update)
│       ├── admin/route.js          ← Admin auth
│       ├── upload/route.js         ← Image upload
│       ├── download/route.js       ← File download
│       └── stats/route.js          ← Admin stats
├── components/
│   ├── Navbar.jsx
│   ├── ProductCard.jsx
│   └── Toast.jsx
├── lib/
│   ├── mongodb.js                  ← DB connection
│   ├── auth.js                     ← JWT utilities
│   └── mailer.js                   ← Email utility
├── models/
│   ├── Product.js
│   ├── Order.js
│   ├── Customer.js
│   └── Admin.js
├── public/
│   └── uploads/products/           ← Uploaded product images
├── .env.local.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## ⚙️ Environment Variables

Create `.env.local` file:

```env
# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/digitalvault

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx

# Email (Gmail)
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=DigitalVault <your@gmail.com>

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DigitalVault

# Admin
ADMIN_EMAIL=admin@digitalvault.in
ADMIN_PASSWORD=Admin@123
```

---

## 🚀 Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local from example
cp .env.local.example .env.local
# Edit .env.local with your values

# 3. Start development server
npm run dev

# 4. Open browser
http://localhost:3000
```

---

## 🌐 Vercel Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Add environment variables in Vercel Dashboard
#    Settings → Environment Variables → Add all from .env.local
```

**Important for Vercel:**
- Use MongoDB Atlas (not localhost)
- Add all env variables in Vercel Dashboard
- `NEXT_PUBLIC_APP_URL` = your Vercel domain

---

## 📋 Pages & Routes

| Page | URL |
|------|-----|
| Landing Page | `/` |
| Login | `/login` |
| Register | `/register` |
| My Account | `/account` |
| Cart | `/cart` |
| Product Detail | `/product/[id]` |
| Download | `/download?token=xxx` |
| My Orders | `/my-orders` |
| Admin Login | `/admin/login` |
| Admin Dashboard | `/admin/dashboard` |

## 🔌 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/product` | GET | All products |
| `/api/product` | POST | Create product (admin) |
| `/api/product/[id]` | PUT | Update product |
| `/api/product/[id]` | DELETE | Delete product |
| `/api/customer` | POST | Register/Login |
| `/api/customer` | PUT | Update profile/password |
| `/api/admin` | POST | Admin login |
| `/api/order` | POST | Create/checkout/payment |
| `/api/order` | GET | All orders (admin) |
| `/api/upload` | POST | Upload image |
| `/api/download` | GET | Download file |
| `/api/stats` | GET | Admin stats |

---

## 🔑 Default Admin

After first `npm run dev`:
- Email: `admin@digitalvault.in` (from .env)
- Password: `Admin@123` (from .env)
