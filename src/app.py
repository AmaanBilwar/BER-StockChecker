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

# Valid location values
VALID_LOCATIONS = ['ice_electronics', 'electronics_drawer', 'powertrain_drawer', 'ev_shelf']

def format_location(location):
    if not location:
        return ''
    return ' '.join(word.capitalize() for word in location.split('_'))

def extract_text_from_image(image):
    try:
        # Create the prompt for Gemini
        prompt = """Extract and return only the text shown in this image. 
        If there are multiple lines of text, determine the most important / title of the product."""

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
    try:
        items = list(items_collection.find())
        print("Raw items from MongoDB:", items)

        # Process items for response
        processed_items = []
        for item in items:
            processed_item = {
                '_id': str(item['_id']),
                'name': item['name'],
                'category': item['category'],
                'quantity': item['quantity'],
                'location': format_location(item.get('location', '')),
                'image_url': item.get('image_url'),
                'created_at': item['created_at'].isoformat() if item.get('created_at') else None
            }
            processed_items.append(processed_item)
        
        print("Processed items for response (with location):", processed_items)
        return jsonify(processed_items)
    except Exception as e:
        print("Error in get_items:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/items', methods=['POST'])
def create_item():
    try:
        data = request.json
        print("Received data in backend:", data)
        
        # Validate required fields
        if not data.get('name') or not data.get('category') or not data.get('quantity'):
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Validate location
        location = data.get('location', '')
        if location and location not in VALID_LOCATIONS:
            return jsonify({'error': 'Invalid location value'}), 400
        
        # Create new item document with explicit fields
        new_item = {
            'name': str(data['name']),
            'category': str(data['category']),
            'quantity': int(data['quantity']),
            'location': location,
            'image_url': data.get('image_url'),
            'created_at': datetime.now()
        }
        print("New item to be saved (with location):", new_item)
        
        # Insert into MongoDB
        result = items_collection.insert_one(new_item)
        print("MongoDB insert result:", result.inserted_id)
        
        # Fetch and return the created item
        created_item = items_collection.find_one({'_id': result.inserted_id})
        if created_item:
            response_item = {
                '_id': str(created_item['_id']),
                'name': created_item['name'],
                'category': created_item['category'],
                'quantity': created_item['quantity'],
                'location': format_location(created_item.get('location', '')),
                'image_url': created_item.get('image_url'),
                'created_at': created_item['created_at'].isoformat()
            }
            print("Created item response:", response_item)
            return jsonify(response_item)

        return jsonify({'error': 'Failed to create item'}), 500

    except Exception as e:
        print("Error in create_item:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/items/<item_id>', methods=['PUT'])
def update_item(item_id):
    try:
        # Convert string ID to ObjectId
        object_id = ObjectId(item_id)
        
        data = request.json
        print("Received data for item update:", data)
        
        # Validate required fields
        if 'quantity' not in data:
            return jsonify({'error': 'Quantity is required'}), 400
        
        # Build update data
        update_data = {
            'quantity': int(data['quantity'])
        }
        
        # Add location to update data if provided and valid
        if 'location' in data:
            location = data['location']
            if location not in VALID_LOCATIONS:
                return jsonify({'error': 'Invalid location value'}), 400
            update_data['location'] = location
        
        print("Update data to be applied:", update_data)
        
        # Update in MongoDB
        result = items_collection.update_one(
            {'_id': object_id},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Item not found'}), 404
        
        # Get updated document
        updated_item = items_collection.find_one({'_id': object_id})
        print("Raw updated item from MongoDB:", updated_item)
        
        # Process item for response
        response_item = {
            '_id': str(updated_item['_id']),
            'name': updated_item['name'],
            'category': updated_item['category'],
            'quantity': updated_item['quantity'],
            'location': format_location(updated_item.get('location', '')),
            'image_url': updated_item.get('image_url'),
            'created_at': updated_item['created_at'].isoformat()
        }
        print("Processed item for response:", response_item)
        
        return jsonify(response_item)
    except Exception as e:
        print("Error in update_item:", str(e))
        return jsonify({'error': str(e)}), 500

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
            print("Extracted text from image:", text)  # Debug print
            
            # Return the extracted text and default values
            response_data = {
                'name': text,  
                'quantity': 1,  
                'location': '',  # Default empty location
                'raw_text': text
            }
            print("Scan response data:", response_data)  # Debug print
            return jsonify(response_data)

        except Exception as e:
            print("Error processing image:", str(e))
            return jsonify({'error': 'Invalid image data'}), 400

    except Exception as e:
        print("Error in scan_image:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/items/<item_id>', methods=['GET'])
def get_item(item_id):
    try:
        # Convert string ID to ObjectId
        object_id = ObjectId(item_id)
        
        # Find the item in the database
        item = items_collection.find_one({'_id': object_id})
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
            
        # Convert ObjectId to string for JSON serialization
        item['_id'] = str(item['_id'])
        
        # Convert datetime to ISO format string
        if 'created_at' in item:
            item['created_at'] = item['created_at'].isoformat()
            
        # Ensure location field exists
        if 'location' not in item:
            item['location'] = ''
            
        return jsonify(item)
        
    except Exception as e:
        print("Error in get_item:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Verify MongoDB connection
        db.command('ping')
        collections = db.list_collection_names()
        print("Available collections:", collections)
        
        return jsonify({
            'status': 'healthy',
            'mongodb_connected': True,
            'collections': collections,
            'items': items_collection.count_documents({})
        })

    except Exception as e:
        print("Health check failed:", str(e))
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)