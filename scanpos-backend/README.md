# ScanPOS Backend

Flask backend API for the ScanPOS billing system.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python run.py
```

The server will start on `http://localhost:5000`

## API Endpoints

- `GET /health` - Health check endpoint
