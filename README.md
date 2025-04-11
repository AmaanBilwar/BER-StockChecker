
# BER Stock Checker

you can test the app (here)[https://ber-stock-checker.vercel.app/]

A web application for managing inventory items with a React frontend and Flask/MongoDB backend.

## Features

- Add items manually or via scanning
- Categorize items
- Track quantities
- Upload item images
- MongoDB database for persistent storage
- Real-time inventory dashboard
- Update item quantities directly from the dashboard
- Search and filter inventory items
- Low stock alerts

## Prerequisites

- Node.js and npm
- Python 3.8+
- MongoDB (local or Atlas)

## Setup

### Backend Setup

1. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Configure MongoDB connection:
   - For local MongoDB, make sure MongoDB is running on your machine
   - For MongoDB Atlas, update the MONGO_URI in the .env file

3. Test MongoDB connection:
   ```
   python src/test_mongo.py
   ```

4. Start the Flask backend:
   ```
   python src/app.py
   ```

### Frontend Setup

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Use the form to add items manually or via scanning
3. View and manage your inventory on the dashboard
4. Update item quantities using the + and - buttons
5. Search for items using the search bar

## API Endpoints

- `GET /api/items` - Get all items
- `POST /api/items` - Create a new item
- `PUT /api/items/<item_id>` - Update an item's quantity

## MongoDB Schema

Items collection:
```json
{
  "_id": "ObjectId",
  "name": "String",
  "category": "String",
  "quantity": "Number",
  "image_url": "String (optional)",
  "created_at": "DateTime"
}
```




# Helpful Resources

1. [ocr model 1](https://huggingface.co/microsoft/trocr-large-printed)
