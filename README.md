# DigitalVault — Next.js Full Stack App

## 🌟 Features
- **Next.js 14 App Router** for fast & modern routing.
- **MongoDB & Mongoose** for database management.
- **JWT Authentication** for secure login and sessions.
- **Cloudinary Integration** for fast and reliable image hosting.
- **Razorpay Integration** for seamless payments.
- **Dynamic Categories** for organizing products.
- **Discount Coupons** for applying offers during checkout.
- **Admin Dashboard** for managing products, categories, coupons, customers, and orders.
- **Mobile Responsive** with a dedicated Mobile Bottom Navigation.

## 📁 Folder Structure
```text
digitalvault-next/
├── app/
│   ├── page.jsx                    ← Landing page
│   ├── login/page.jsx              ← Customer login
│   ├── register/page.jsx           ← Customer register
│   ├── account/page.jsx            ← Customer account + downloads
│   ├── cart/page.jsx               ← Cart page
│   ├── categories/                 ← Browse all categories
│   ├── product/[id]/page.jsx       ← Product detail page
│   ├── download/page.jsx           ← Download page
│   ├── my-orders/page.jsx          ← Find orders by email
│   ├── admin/
│   │   ├── login/page.jsx          ← Admin login
│   │   ├── dashboard/page.jsx      ← Admin dashboard
│   │   ├── categories/page.jsx     ← Admin manage categories
│   │   ├── coupons/page.jsx        ← Admin manage coupons
│   │   └── customers/              ← Admin manage customers
│   └── api/
│       ├── product/route.js        ← Product CRUD
│       ├── categories/route.js     ← Category CRUD
│       ├── coupon/route.js         ← Coupon CRUD
│       ├── order/route.js          ← Order + payment + downloads
│       ├── customer/route.js       ← Auth (register/login/update)
│       ├── customers/route.js      ← Admin fetch all customers
│       ├── admin/route.js          ← Admin auth
│       ├── logout/route.js         ← Logout functionality
│       ├── upload/route.js         ← Image upload
│       ├── download/route.js       ← File download
│       └── stats/route.js          ← Admin stats
├── components/
│   ├── Navbar.jsx
│   ├── MobileBottomNav.jsx         ← Mobile responsive navigation
│   ├── ProductCard.jsx
│   └── Toast.jsx
├── lib/
│   ├── mongodb.js                  ← DB connection
│   ├── auth.js                     ← JWT utilities
│   ├── mailer.js                   ← Email utility
│   ├── cloudinary.js               ← Cloudinary config
│   └── cloudinary-image.js         ← Cloudinary upload utilities
├── models/
│   ├── Product.js
│   ├── Category.js
│   ├── Coupon.js
│   ├── Order.js
│   ├── Customer.js
│   └── Admin.js
├── public/
│   └── uploads/                    ← Local uploads fallback
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
JWT_SECRET=your_super_secret_jwt_key_here

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# Email
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=DigitalVault <your@gmail.com>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DigitalVault
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx

# Admin default
ADMIN_EMAIL=admin@digitalvault.in
ADMIN_PASSWORD=Admin@123

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
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
| Categories | `/categories` |
| Category Detail | `/categories/[category]` |
| Login | `/login` |
| Register | `/register` |
| My Account | `/account` |
| Cart | `/cart` |
| Product Detail | `/product/[id]` |
| Download | `/download?token=xxx` |
| My Orders | `/my-orders` |
| Admin Login | `/admin/login` |
| Admin Dashboard | `/admin/dashboard` |
| Admin Categories | `/admin/categories` |
| Admin Coupons | `/admin/coupons` |
| Admin Customers | `/admin/customers` |

## 🔌 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/product` | GET/POST | Get all / Create product (admin) |
| `/api/product/[id]` | PUT/DELETE | Update / Delete product |
| `/api/categories` | GET/POST | Get all / Create category |
| `/api/categories/[id]` | PUT/DELETE | Update / Delete category |
| `/api/coupon` | GET/POST/PUT/DEL | Coupon CRUD operations |
| `/api/customer` | POST/PUT | Auth / Update profile |
| `/api/customers` | GET | Fetch all customers (admin) |
| `/api/admin` | POST | Admin login |
| `/api/logout` | GET | Logout endpoint |
| `/api/order` | POST/GET | Create order / Get orders |
| `/api/upload` | POST | Upload image (Cloudinary/Local) |
| `/api/download` | GET | Download file |
| `/api/stats` | GET | Admin stats |

---

## 🔑 Default Admin

After first `npm run dev`:
- Email: `admin@digitalvault.in` (from .env)
- Password: `Admin@123` (from .env)
