"""
Debug script to check what's in the MongoDB database
"""
from pymongo import MongoClient

try:
    client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("✅ Connected to MongoDB\n")
    
    db = client['eventhub']
    
    # List all collections
    collections = db.list_collection_names()
    print(f"📁 Collections in 'eventhub' database: {len(collections)} found\n")
    for col in collections:
        count = db[col].count_documents({})
        print(f"   - {col}: {count} documents")
    
    print("\n" + "="*60)
    
    # Check RecommendationModel specifically
    print("\n🔍 Checking RecommendationModel collection:\n")
    rec_count = db['RecommendationModel'].count_documents({})
    print(f"   Total documents: {rec_count}")
    
    if rec_count > 0:
        # Get the latest one
        latest = db['RecommendationModel'].find_one(sort=[('trainingDate', -1)])
        print(f"\n   Latest training result:")
        print(f"   - Training Date: {latest.get('trainingDate')}")
        print(f"   - Data Size: {latest.get('dataSize')} users")
        print(f"   - Accuracy: {latest.get('accuracy')}")
        print(f"   - Metrics: {latest.get('metrics')}")
    else:
        print(f"   ❌ No training results found!")
        print(f"\n   Check other collections that might have data:")
        for col in ['RecommendationModels', 'models', 'training', 'recommendations']:
            if col in collections:
                count = db[col].count_documents({})
                print(f"      - {col}: {count} docs")
    
except Exception as e:
    print(f"❌ Error: {e}")
