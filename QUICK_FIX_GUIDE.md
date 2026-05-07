# 🚀 Quick Fix: Clear and Re-seed Production D1 Database

## The Problem

Your signup system works fine (the password hash `$2b$10$2qHlWZArjFdPJjxxScPCBOqbnNf8./ddM07bNgoGsFd.yDXUnfHJS` is actually **valid**), but:
- Your **D1 production database was never seeded** with the correct users
- OR the database has **old/incorrect data**

## The Solution - One Command Reset ✅

Deploy the updated code to production, then run this **single command** in your browser console (F12 → Console):

```javascript
fetch('https://scommerce.demo-web.workers.dev/api/seed/reset', {
  method: 'POST'
}).then(r => r.json()).then(console.log)
```

**That's it!** This command will:
1. ✅ Delete ALL existing data from all 16 tables
2. ✅ Re-seed with fresh, correct data
3. ✅ Give you a clean database with 9 working users

---

## What the Reset Endpoint Does

### Step 1: Clear Database
Deletes data from these tables (in correct order):
- admin_logs
- inventory_alerts
- cart_items
- wishlist_items
- order_items
- orders
- product_reviews
- addresses
- posts
- promotions
- banners
- homepage_settings
- reels
- stories
- products
- categories
- **users**

### Step 2: Execute Seed SQL
Runs the entire `db/seed.sql` file with:
- 7 categories
- 35 products
- 9 users (with correct password hashes)
- 3 addresses
- 4 orders
- 6 order items
- 3 cart items
- 5 wishlist items
- 7 product reviews
- 5 stories
- 5 reels
- 3 promotions
- 3 banners
- 7 homepage settings
- 3 inventory alerts
- 5 admin logs
- 3 posts

---

## After Reset - Verify and Test

### 1. Check Users Exist
```javascript
fetch('https://scommerce.demo-web.workers.dev/api/debug/users')
  .then(r => r.json())
  .then(data => {
    console.log('User count:', data.count);
    console.log('Users:', data.users);
  })
```

You should see **9 users** listed.

### 2. Test Login with These Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@scommerce.com | admin123 |
| **Staff** | rahul@scommerce.com | staff123 |
| **Staff** | priya@scommerce.com | staff123 |
| **Staff** | amit@scommerce.com | staff123 |
| **Customer** | fatema@example.com | user123 |
| **Customer** | noor@example.com | user123 |
| **Customer** | sara@example.com | user123 |
| **Customer** | zara@example.com | user123 |
| **Customer** | hana@example.com | user123 |

### 3. Check Production Logs
If login still fails, check:
1. Browser console (F12) - Login route now logs detailed info
2. Cloudflare Dashboard → Workers → Your Worker → Logs

---

## Alternative Methods

### Method A: Two Steps (Clear, then Seed)

**Step 1 - Clear:**
```javascript
fetch('https://scommerce.demo-web.workers.dev/api/seed/clear', {
  method: 'POST'
}).then(r => r.json()).then(console.log)
```

**Step 2 - Seed:**
```javascript
fetch('https://scommerce.demo-web.workers.dev/api/seed/d1', {
  method: 'POST'
}).then(r => r.json()).then(console.log)
```

### Method B: Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Workers & Pages → Your project → D1
3. Open your D1 database
4. Click "Console"
5. Run `DELETE FROM users;` (and repeat for all tables)
6. Paste the entire `db/seed.sql` file
7. Execute all statements

---

## Important: Security Warning

⚠️ **After confirming login works, remove these endpoints:**

```bash
rm -rf /home/z/my-project/src/app/api/debug
rm -rf /home/z/my-project/src/app/api/seed
```

Then redeploy your application.

---

## Troubleshooting

### "Database not available" error
→ Check Cloudflare Worker has D1 binding configured correctly

### "Invalid email or password" error
→ Check browser console for detailed logs from `/api/auth/login`
→ Verify users exist via `/api/debug/users`

### Users don't appear after reset
→ Check response from `/api/seed/reset` for any errors
→ Verify D1 database exists and is accessible

---

## Summary

1. ✅ Deploy updated code (includes 3 new API endpoints)
2. ✅ Run: `fetch('.../api/seed/reset', { method: 'POST' }).then(r => r.json()).then(console.log)`
3. ✅ Verify: `fetch('.../api/debug/users')` shows 9 users
4. ✅ Test login with: `admin@scommerce.com` / `admin123`
5. ✅ Remove API endpoints and redeploy

**That's all you need to do!**
