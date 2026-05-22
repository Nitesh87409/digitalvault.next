# DigitalVault — Premium Digital Products E-Commerce Platform

DigitalVault is a state-of-the-art, fully-featured, premium e-commerce platform built for selling digital products, assets, and premium bundle subscriptions. Powered by **Next.js 14 App Router**, **MongoDB**, and modern UI design, it delivers a smooth shopping experience for customers and a comprehensive administrative dashboard for creators.

---

## 🌟 Key Features

### 🛍️ Customer Front-End
- **Premium User Interfaces**: Sleek, modern layouts with vibrant gradients, clean typography, dynamic hover interactions, and micro-animations.
- **Dynamic Product Browsing**: Responsive grid layouts, robust search, and organized product categories.
- **Product Reviews & Ratings**: Customers can submit verified reviews with aggregate rating stats computed in real-time.
- **Flexible Cart & Checkout**: High-fidelity cart management with instant coupon codes and automatic total discounts.
- **Responsive Mobile Layout**: Mobile-first designs, featuring a dedicated Mobile Bottom Navigation and optimized checkout carts that hide unnecessary screen clutter on mobile displays.
- **Dynamic Customer Accounts**: 
  - Real-time profile metrics: "Member Since" (dynamic db-based registration date) and live "Account Status" badges.
  - Interactive profile management: Live background database syncing via `/api/customer` to maintain updated credentials instantly.
  - Quick access to order histories and secure downloadable files.

### 👑 Premium Bundle Subscriptions
- **Premium Dynamic Bundles**: Creators can group digital products into custom mega-packages.
- **Razorpay Payment Gateway**: Completely integrated with secure signatures and automated status validations.
- **Instant Digital Access**: Fast token-secured file downloads upon purchase verification.

### 🛡️ Administrative Control Center
- **Executive Admin Dashboard**: Visualized business statistics (sales volume, active customers, transaction values, and review metrics).
- **Recycle Bin (Trash) System**: 
  - Robust soft-deletion for **Coupons, Reviews, FAQs, and Testimonials** to prevent accidental data loss.
  - **Dynamic Retention Settings**: Configurable auto-delete days, managed directly from the Admin settings dashboard.
  - **Zero-Overhead Automated Cleanup**: Backed by MongoDB's TTL index (`expireAfterSeconds: 0`) on `auto_delete_at` to permanently delete expired data automatically in the background.
  - **Collision-Safe Restores**: Intelligently appends `-restored` or `_RESTORED` suffixes if slug/code conflicts occur.
- **Content & Asset Managers**: Simple CRUD portals for products, categories, coupons, testimonials, and FAQs with seamless **Cloudinary / Local Uploads** fallbacks.

---

## 📁 Project Architecture & Folder Structure

```text
digitalvault-next/
├── app/
│   ├── page.jsx                    ← Front-end landing page
│   ├── login/page.jsx              ← Customer account login
│   ├── register/page.jsx           ← Customer registration
│   ├── account/page.jsx            ← Customer profile dashboard with real-time stats
│   ├── cart/page.jsx               ← Desktop & mobile-responsive shopping cart
│   ├── categories/                 ← Browse products by category
│   │   └── [category]/page.jsx     ← Category detail listing
│   ├── product/[id]/page.jsx       ← Premium product details & customer reviews
│   ├── my-downloads/page.jsx       ← Customer bundle & single product downloads
│   ├── download/page.jsx           ← Secure tokenized download page
│   ├── my-orders/page.jsx          ← Find orders & receipts by email
│   ├── admin/
│   │   ├── login/page.jsx          ← Secure admin login panel
│   │   ├── dashboard/page.jsx      ← Admin analytics & dashboard
│   │   ├── categories/page.jsx     ← Category management
│   │   ├── coupons/page.jsx        ← Coupon manager with Recycle Bin soft-delete
│   │   ├── reviews/page.jsx        ← Customer review moderation with Recycle Bin
│   │   ├── homepage-content/       ← FAQ & Testimonial manager with Recycle Bin
│   │   ├── customers/              ← User control & block/unblock tools
│   │   ├── settings/               ← Configuration panel (Theme, Razorpay, Bin TTL)
│   │   ├── bin/                    ← Recycle Bin control center (Restore, Delete, Settings)
│   │   └── bundle/page.jsx         ← Premium bundles publisher
│   └── api/
│       ├── admin/                  ← Admin core endpoints
│       │   ├── route.js            ← Admin Authentication
│       │   ├── bin/route.js        ← Recycle Bin CRUD & settings manager
│       │   ├── bundle/route.js     ← Admin Bundle Manager
│       │   └── settings/route.js   ← Site configurations GET/POST
│       ├── bundle/                 ← Customer Bundle endpoints
│       │   ├── create-order/       ← Razorpay order initializer
│       │   └── verify-payment/     ← Razorpay signature verification
│       ├── product/route.js        ← Products CRUD
│       ├── categories/route.js     ← Categories CRUD
│       ├── coupon/route.js         ← Coupons CRUD
│       ├── customer/route.js       ← Customer Auth, GET profile, and updates
│       ├── customers/route.js      ← Admin customer fetch & search
│       ├── logout/route.js         ← Session teardown
│       ├── upload/route.js         ← Image / Asset upload (Cloudinary / Local)
│       ├── download/route.js       ← Secured tokenized download delivery
│       └── stats/route.js          ← Dashboard analytical aggregator
├── components/
│   ├── Navbar.jsx                  ← Main responsive header
│   ├── MobileBottomNav.jsx         ← Responsive mobile bottom menu
│   ├── ProductCard.jsx             ← Interactive product preview grid component
│   └── Toast.jsx                   ← Non-blocking notifications system
├── lib/
│   ├── mongodb.js                  ← Database connector
│   ├── auth.js                     ← JWT signing & verification middleware
│   ├── mailer.js                   ← Automated email notification engines
│   ├── security.js                 ← Rate limiter & request safety policies
│   └── cloudinary.js               ← Cloudinary media hosting adapter
├── models/
│   ├── Admin.js                    ← Administrator schemas
│   ├── Customer.js                 ← Customer profiles & credentials schema
│   ├── Product.js                  ← Store products schema
│   ├── Category.js                 ← Categories schema
│   ├── Coupon.js                   ← Promo code schema
│   ├── Review.js                   ← Customer feedback reviews schema
│   ├── BinItem.js                  ← Recycle Bin schema with auto-expire TTL index
│   ├── BundleSubscription.js       ← Premium dynamic bundles order schema
│   └── Setting.js                  ← Dynamic settings schema (Razorpay, bin retention)
├── public/
│   └── uploads/                    ← Asset filesystem fallback
├── .env.local.example              ← Standard workspace environment templates
├── next.config.js                  ← Next.js configurations
├── tailwind.config.js              ← Styling theme setups
└── package.json                    ← Project dependencies
```

---

## ⚙️ Environment Variables

Create `.env.local` in the root folder with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://127.0.0.1:27017/digitalvault

# JWT Auth Keys
JWT_SECRET=your_super_secret_jwt_key_here

# Razorpay E-Commerce
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
BUNDLE_PRICE_PAISE=20700

# Email Engines (Resend / Custom SMTP)
RESEND_API_KEY=your_resend_api_key_here
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=DigitalVault <your@gmail.com>

# SMS Authentication Configuration
SMS_PROVIDER=mock # Options: mock, msg91, twilio, 2factor, firebase
SMS_API_KEY=your_sms_api_key_here
SMS_SENDER_ID=your_sender_id_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DigitalVault
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
TRUST_PROXY_HEADERS=false

# Default Root Admin
ADMIN_EMAIL=admin@digitalvault.in
ADMIN_PASSWORD=replace_with_a_strong_unique_password

# Cloudinary CDN Integrations
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Social OAuth Configs
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret
```

---

## 🚀 Local Development Setup

Follow these steps to run the application locally:

```bash
# 1. Install dependencies
npm install

# 2. Duplicate Environment Template
cp .env.local.example .env.local
# Open .env.local and configure your environment variables

# 3. Spin up the Database
# Ensure MongoDB local server is running on 127.0.0.1:27017

# 4. Start Next.js Development Server
npm run dev

# 5. Connect via your Browser
http://localhost:3000
```

---

## 📋 Route Inventory & User Pages

### 🛍️ Client / Customer Pages
| Page Title | Route Path | Description |
| :--- | :--- | :--- |
| **Landing Storefront** | `/` | Grid of premium products, reviews & testimonials. |
| **Store Categories** | `/categories` | Comprehensive browse list of all tags & groupings. |
| **Single Category** | `/categories/[category]` | Filtered products belonging to a specific category. |
| **Customer Register** | `/register` | Secure registration portal. |
| **Customer Login** | `/login` | Secure login panel. |
| **My Profile** | `/account` | Real-time profile metrics, dynamic Member badge, downloads. |
| **Shopping Cart** | `/cart` | Checkout area optimized for desktop & mobile devices. |
| **Product Detail** | `/product/[id]` | Real-time feedback, reviews, and dynamic purchase paths. |
| **Bundle Downloads** | `/my-downloads` | Purchased digital bundle inventory catalog. |
| **Get Downloads** | `/download?token=xxx` | Premium link verification and delivery handler. |
| **Orders Lookup** | `/my-orders` | Search order receipts. |

### 👑 Administrative Control Pages
| Page Title | Route Path | Description |
| :--- | :--- | :--- |
| **Admin Login** | `/admin/login` | Secure executive credential login page. |
| **Admin Analytics** | `/admin/dashboard` | Visual metrics on revenue, signups, and store operations. |
| **Manage Categories** | `/admin/categories` | Manage core navigation groupings. |
| **Manage Coupons** | `/admin/coupons` | Issue/Revoke promo codes (supports soft-deletes). |
| **Moderation Hub** | `/admin/reviews` | Check and filter reviews (supports soft-deletes). |
| **Manage CMS** | `/admin/homepage-content` | Manage dynamic FAQs & Testimonials (supports soft-deletes). |
| **Manage Users** | `/admin/customers` | Admin command console to view and block/unblock users. |
| **App Settings** | `/admin/settings` | Configure Payment keys, SMTP, and Trash Bin TTL limits. |
| **Recycle Bin** | `/admin/bin` | Restore soft-deleted items, change settings, empty trash. |
| **Bundles Console** | `/admin/bundle` | Build and edit digital mega-bundle subscription details. |

---

## 🔌 API Endpoints Reference

| Category | Endpoint URI | Methods | Description |
| :--- | :--- | :--- | :--- |
| **Store Auth** | `/api/customer` | `GET` | Fetches authentic live customer profile metrics |
| **Store Auth** | `/api/customer` | `POST` | Registers or Logins customer via password |
| **Store Auth** | `/api/customer` | `PUT` | Updates profile name/phone or Changes password |
| **Store Auth** | `/api/admin` | `POST` | Admin authentication & session cookies |
| **Store Auth** | `/api/logout` | `GET` | Clear all session cookies |
| **Recycle Bin** | `/api/admin/bin` | `GET` | Lists all soft-deleted items with metadata |
| **Recycle Bin** | `/api/admin/bin` | `POST` | Soft-deletes items, restores them, or updates auto-delete settings |
| **Recycle Bin** | `/api/admin/bin` | `DELETE`| Permanent deletion (individual or purge all) |
| **Bundles** | `/api/admin/bundle` | `GET/POST`| Create, edit, and list premium package bundles |
| **Bundles** | `/api/bundle/create-order`| `POST` | Initiates Razorpay Order for package bundle purchases |
| **Bundles** | `/api/bundle/verify-payment`| `POST` | Validates signatures & grants bundle subscriptions |
| **Catalog** | `/api/product` | `GET/POST`| Fetch products list / Add new product (admin) |
| **Catalog** | `/api/product/[id]`| `PUT/DELETE`| Modify product details / Delete product |
| **Catalog** | `/api/categories` | `GET/POST`| Fetch all categories / Create category |
| **Catalog** | `/api/categories/[id]`| `PUT/DELETE`| Edit category details / Delete category |
| **Coupons** | `/api/coupon` | `GET/POST/PUT/DELETE`| Complete coupons setup CRUD (supports soft-delete) |
| **Reviews** | `/api/reviews` | `GET/POST/DELETE`| Customer reviews handling |
| **CMS** | `/api/faqs` | `GET/POST` | Dynamic FAQ endpoints |
| **CMS** | `/api/homepage-reviews` | `GET/POST` | Homepage testimonials endpoints |
| **Settings** | `/api/settings` | `GET/POST`| Dynamic site setups, theme, and payment integrations |
| **Core Delivery**| `/api/upload` | `POST` | Cloudinary or local multipart image upload |
| **Core Delivery**| `/api/download` | `GET` | Secured, token-verified local file downloads |
| **Executive** | `/api/stats` | `GET` | Aggregated dashboard stats |

---

## 🗑️ Recycle Bin (Trash) Architecture

The Recycle Bin is designed to prevent accidental data losses across vital tables.

1. **Soft-deletion Flow**:
   When an admin deletes a Coupon, Review, FAQ, or Testimonial, it is not erased immediately. Instead, a `POST` request moves the document payload into the `BinItem` collection, retaining full attributes under the `data` field, before removing it from its active model.
2. **Automated Purging**:
   Every `BinItem` document is saved with an `auto_delete_at` timestamp. MongoDB automatically prunes these documents when this time is reached via a native background TTL index:
   ```javascript
   BinItemSchema.index({ auto_delete_at: 1 }, { expireAfterSeconds: 0 });
   ```
3. **Collision Safety**:
   When a deleted item (e.g., category slug or coupon code) is restored, names or unique identifiers are automatically protected:
   - Duplicate unique categories get appended with ` (restored)` and `-restored` slug suffixes.
   - Duplicate coupons receive `_RESTORED` code suffixes.
4. **Administrative Console**:
   Located at `/admin/bin`, admins can instantly:
   - Search & Filter by collection type.
   - Restore items immediately.
   - Permanently delete individual items or execute a complete trash purge.
   - Dynamically adjust retention days (e.g., setting it to 15, 30, or `0` for manual cleaning).

---

## 🔑 Default Credentials

After running `npm run dev` for the first time:
- **Admin Panel Access**: Go to `/admin/login`.
  - **Email**: `admin@digitalvault.in`
  - **Password**: The `ADMIN_PASSWORD` value you specified in `.env.local`
