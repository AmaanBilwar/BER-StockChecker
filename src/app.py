from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
import certifi
import base64
from PIL import Image
import io
from google import genai
from google.genai import types
ca = certifi.where()

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI')
client = MongoClient(MONGO_URI, tlsAllowInvalidCertificates=True, tlsCAFile=ca)
db = client['ber_stock_checker']
items_collection = db['items']

# Initialize Gemini
genai_client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

def extract_text_from_image(image):
    try:
        # Create the prompt for Gemini
        prompt = """Extract and return only the text shown in this image. 
        If there are multiple lines of text, return them separated by newlines.
        Do not include any additional description or context, just the text itself."""

        # Generate content with Gemini Vision
        response = genai_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt, image]  # Pass PIL Image directly
        )
        
        # Get the response text
        extracted_text = response.text.strip()
        print("Extracted text:", extracted_text)  # Debug print
        
        return extracted_text

    except Exception as e:
        print("Error in extract_text_from_image:", str(e))
        raise

@app.route('/')
def home():
    return 'Hello, World!'

@app.route('/api/items', methods=['GET'])
def get_items():
    items = list(items_collection.find())
    # Convert ObjectId to string and format dates for JSON serialization
    for item in items:
        item['_id'] = str(item['_id'])
        # Ensure created_at is properly formatted
        if 'created_at' in item and item['created_at']:
            item['created_at'] = item['created_at'].isoformat()
    return jsonify(items)

@app.route('/api/items', methods=['POST'])
def create_item():
    data = request.json
    
    # Validate required fields
    if not data.get('name') or not data.get('category') or not data.get('quantity'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Create new item document
    new_item = {
        'name': data['name'],
        'category': data['category'],
        'quantity': data['quantity'],
        'image_url': data.get('image_url'),
        'created_at': datetime.now()
    }
    
    # Insert into MongoDB
    result = items_collection.insert_one(new_item)
    
    # Get the inserted document
    inserted_item = items_collection.find_one({'_id': result.inserted_id})
    inserted_item['_id'] = str(inserted_item['_id'])
    inserted_item['created_at'] = inserted_item['created_at'].isoformat()
    
    return jsonify(inserted_item), 201

@app.route('/api/items/<item_id>', methods=['PUT'])
def update_item(item_id):
    try:
        # Convert string ID to ObjectId
        object_id = ObjectId(item_id)
    except:
        return jsonify({'error': 'Invalid item ID'}), 400
    
    data = request.json
    
    # Validate required fields
    if 'quantity' not in data:
        return jsonify({'error': 'Quantity is required'}), 400
    
    # Update the item
    result = items_collection.update_one(
        {'_id': object_id},
        {'$set': {'quantity': data['quantity']}}
    )
    
    if result.matched_count == 0:
        return jsonify({'error': 'Item not found'}), 404
    
    # Get the updated document
    updated_item = items_collection.find_one({'_id': object_id})
    updated_item['_id'] = str(updated_item['_id'])
    updated_item['created_at'] = updated_item['created_at'].isoformat()
    
    return jsonify(updated_item)

@app.route('/api/scan', methods=['POST'])
def scan_image():
    try:
        # Get base64 image data from request
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400

        try:
            # Decode base64 image
            image_data = base64.b64decode(data['image'].split(',')[1])
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            print(f"Image size: {image.size}, mode: {image.mode}")  # Debug print
            
            # Extract text from image
            text = extract_text_from_image(image)
            
            # Return the extracted text
            return jsonify({
                'name': text,  # Use the extracted text as the name
                'quantity': 1,  # Default quantity
                'raw_text': text
            })

        except Exception as e:
            print("Error processing image:", str(e))
            return jsonify({'error': 'Invalid image data'}), 400

    except Exception as e:
        print("Error in scan_image:", str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)