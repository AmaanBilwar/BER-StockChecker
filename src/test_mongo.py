from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URI)
db = client['ber_stock_checker']
items_collection = db['items']

def test_mongodb_connection():
    try:
        # Test connection
        client.server_info()
        print("✅ MongoDB connection successful!")
        
        # Test database and collection
        print(f"✅ Database '{db.name}' exists")
        print(f"✅ Collection '{items_collection.name}' exists")
        
        # Test insert and retrieve
        test_item = {
            'name': 'Test Item',
            'category': 'test',
            'quantity': 1,
            'image_url': None
        }
        
        # Insert test item
        result = items_collection.insert_one(test_item)
        print(f"✅ Inserted test item with ID: {result.inserted_id}")
        
        # Retrieve test item
        retrieved_item = items_collection.find_one({'_id': result.inserted_id})
        print(f"✅ Retrieved test item: {retrieved_item}")
        
        # Clean up test item
        items_collection.delete_one({'_id': result.inserted_id})
        print("✅ Deleted test item")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_mongodb_connection() 