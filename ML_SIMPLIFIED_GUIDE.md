# ML Training - Quick Start Guide

## 🚀 TRAINING AFTER DATA UPDATES

When you add new users, events, or registrations, retrain the models to improve recommendations:

### STEP 1: Start Backend (If Not Running)

**Open PowerShell and run**:
```powershell
cd backend
npm run dev
```

**Wait for**:
```
✅ Server is ready and accepting connections
📡 Port: 3101
```

### STEP 2: Get Your Admin Token

**In browser console (Press F12)**:
```javascript
console.log(localStorage.getItem('token'));
```

Copy the token that appears.

---

### STEP 3: Train Models

**In PowerShell terminal**:
```powershell
$token = "PASTE_YOUR_TOKEN_HERE"

Invoke-WebRequest `
  -Uri "http://localhost:3101/api/recommendations/admin/train" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"}
```

**Training takes**: 30-60 seconds (or faster with less data)

**You'll see output**:
```
Precision@3: 0.725
Recall@3: 0.680
MAP: 0.710
RMSE: 0.850
```

✅ Models trained! Recommendations are now updated.

---

### STEP 4: Test Recommendations

**In browser console or PowerShell**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3101/api/recommendations/USER_ID?limit=3"
```

Replace `USER_ID` with an actual user ID from your app.

**Result**: You'll see 3 personalized recommendations for that user.

---

## 📝 WORKFLOW: How to Use

### After Adding New Data:

1. **Add users, events, or registrations** in the app
2. **Run training command** (Step 3 above)
3. **Wait for "Models trained"** message
4. **Refresh the app** - Users will see updated recommendations

### That's It!

The frontend automatically fetches recommendations from the trained models.

---

## ❓ QUICK FIXES

### "Unauthorized" Error
```
Solution: Use admin token, not regular user token
Get token from: Browser console → localStorage.getItem('token')
```

### "No recommendations returned"
```
Solution: Make sure training completed successfully
Check: Look for "Models trained" message in terminal
```

### Backend not responding
```
Solution: 
1. Check: Is terminal still showing "✅ Server ready"?
2. Restart: npm run dev
3. Wait: Give it 5 seconds to start
```

---

## 🎯 When to Retrain

✅ **DO retrain when:**
- You add 5+ new events
- You add 3+ new users
- Users register for events
- You want fresh recommendations

❌ **Don't need to retrain for:**
- Just viewing recommendations
- Users just browsing
- Simple UI changes

---

## 📊 What's Happening Behind the Scenes

The system:
1. Loads all users, events, and registrations from database
2. Creates 16-dimensional vectors for each user and event
3. Calculates similarity using two algorithms (Content-Based + Collaborative)
4. Combines results and picks top 3 recommendations per user
5. Stores metrics: Precision, Recall, Map, RMSE
6. Caches results for fast retrieval

All done in 30-60 seconds on your laptop CPU ✅

---

## ✅ THAT'S ALL YOU NEED

Keep your app running, add data, run the training command, and recommendations update automatically!
