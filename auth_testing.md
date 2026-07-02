# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session via mongosh
```
use test_database
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  role: 'user',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
```

To create an ADMIN user, set role: 'admin' and use email 'ari@realratings.live'.

## Step 2: Test Backend API
curl -X GET "$URL/api/auth/me" -H "Authorization: Bearer $TOKEN"

## Step 3: Browser Testing
Set cookie `session_token`; then goto app.
