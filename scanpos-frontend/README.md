# ScanPOS Frontend

AngularJS frontend for the ScanPOS billing system.

## Setup

1. Simply open `index.html` in a web browser, or
2. Use a local web server (recommended):

```bash
# Using Python
python -m http.server 8080

# Or using Node.js http-server
npx http-server -p 8080
```

Then navigate to `http://localhost:8080`

## Configuration

Update the `API_URL` constant in `app.js` to point to your Flask backend:
```javascript
app.constant('API_URL', 'http://localhost:5000');
```

## Routes

- `/login` - Login page
- `/dashboard` - Dashboard with sales statistics
- `/billing` - Billing interface (Phase 5)
- `/products` - Product management (Phase 4)
- `/reports` - Reports and analytics (Phase 8)
