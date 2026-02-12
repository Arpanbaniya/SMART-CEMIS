"""
Debug: Check exact structure of training results in database
"""
from pymongo import MongoClient
import json

try:
    client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
    db = client['myevent_db']
    
    # Get latest training result
    result = db['recommendationmodels'].find_one(sort=[('trainingDate', -1)])
    
    if result:
        print("✅ Found training result\n")
        print("="*60)
        print("RAW DATABASE STRUCTURE:")
        print("="*60)
        
        # Pretty print the entire document
        print(json.dumps(result, indent=2, default=str))
        
        print("\n" + "="*60)
        print("KEY FIELDS ANALYSIS:")
        print("="*60)
        
        print(f"\ntrainingDate: {result.get('trainingDate')}")
        print(f"dataSize: {result.get('dataSize')}")
        print(f"accuracy: {result.get('accuracy')}")
        
        metrics = result.get('metrics', {})
        print(f"\nmetrics keys: {list(metrics.keys())}")
        
        cb = metrics.get('contentBased', metrics.get('ContentBased', {}))
        print(f"\ncontentBased keys: {list(cb.keys())}")
        print(f"contentBased content: {cb}")
        
        cf = metrics.get('collaborative', metrics.get('Collaborative', {}))
        print(f"\ncollaborative keys: {list(cf.keys())}")
        print(f"collaborative content: {cf}")
        
    else:
        print("❌ No training results found!")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
