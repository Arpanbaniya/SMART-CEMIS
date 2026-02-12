"""
Check all databases in MongoDB
"""
from pymongo import MongoClient

try:
    client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("✅ Connected to MongoDB\n")
    
    # List all databases
    admin_db = client.admin
    databases = list(admin_db.command('listDatabases')['databases'])
    
    print(f"📊 Databases found: {len(databases)}\n")
    for db_info in sorted(databases, key=lambda x: x['name']):
        db_name = db_info['name']
        if not db_name.startswith('admin') and not db_name.startswith('local') and not db_name.startswith('config'):
            db = client[db_name]
            try:
                collections = db.list_collection_names()
                print(f"\n📁 Database: {db_name}")
                print(f"   Collections: {len(collections)}")
                for col in collections[:10]:  # Show first 10 collections
                    count = db[col].count_documents({})
                    print(f"      - {col}: {count} documents")
            except Exception as e:
                print(f"\n📁 Database: {db_name} (error checking collections: {e})")
    
except Exception as e:
    print(f"❌ Error: {e}")
