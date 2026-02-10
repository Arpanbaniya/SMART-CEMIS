# 🎯 ML Recommendation System - Visual Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER REQUEST                            │
│              GET /recommendations/{userId}                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │   Recommendation Service      │
         │  (recommendationService.ts)   │
         └──────────┬───────────────────┘
                    │
        ┌───────────┴───────────┐
        │   Cache Check (5min)  │
        └───┬───────────────┬───┘
            │               │
        CACHE HIT      CACHE MISS
        (50ms)         (500ms)
            │               │
            └───┐   ┌───────┘
                │   │
                │   ├─→ ┌──────────────────────────────┐
                │   │   │  Content-Based Model         │
                │   │   │  (contentBased.ts)           │
                │   │   │                              │
                │   │   │ • Create user vectors        │
                │   │   │ • Create event vectors       │
                │   │   │ • Cosine similarity          │
                │   │   │ • Confidence scoring         │
                │   │   │ • Return top-N events        │
                │   │   └──────────────────────────────┘
                │   │
                │   ├─→ ┌──────────────────────────────┐
                │   │   │  Collaborative Model         │
                │   │   │  (collaborative.ts)          │
                │   │   │                              │
                │   │   │ • Find similar users         │
                │   │   │ • Get their events           │
                │   │   │ • Weight by similarity       │
                │   │   │ • Filter registered events   │
                │   │   │ • Return top-N events        │
                │   │   └──────────────────────────────┘
                │   │
                │   └─→ ┌──────────────────────────────┐
                │       │   Score Blending (50-50)     │
                │       │                              │
                │       │ • Merge results              │
                │       │ • Weight equally             │
                │       │ • Sort by score              │
                │       │ • Add to cache               │
                │       └──────────────────────────────┘
                │
                └─────────────┬──────────────────┐
                              │                  │
                              ▼                  ▼
                         Return JSON         Cache Entry
                    (with recommendations)  (5 min TTL)
```

## Data Flow During Training

```
┌────────────────────────────────────────┐
│   trainRecommendationModels()          │
│   (trainer.ts)                         │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  1. PREPARE DATA                       │
│     • Load all users from DB           │
│     • Load all events from DB          │
│     • Get interaction history          │
│     • Total: 500+ interactions         │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  2. SPLIT DATA                         │
│     • Shuffle users randomly           │
│     • Train: 70% (175 users)           │
│     • Val:   15% (37 users)            │
│     • Test:  15% (38 users) ⚠️ UNSEEN  │
└─────────┬──────────────────────────────┘
          │
          ▼
        ┌─┴──────────────────────────────────┐
        │                                    │
        ▼                                    ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│ CONTENT-BASED MODEL      │    │ COLLABORATIVE MODEL      │
│ (contentBased.ts)        │    │ (collaborative.ts)       │
│                          │    │                          │
│ For each user:           │    │ For each user:           │
│ • Create 16D vector      │    │ • Find similar users     │
│ • Store features:        │    │ • Get their events       │
│  - Preferences           │    │ • Calculate similarities │
│  - Interests (10)        │    │ • Weight interactions    │
│  - Engagement            │    │ • Filter already-reg     │
│  - Ratings               │    │ • Top events             │
│  - Participation         │    │                          │
│  - Recency               │    │ Test Precision@3: 69.5%  │
│                          │    │ Test Recall@3: 65%       │
│ Test Precision@3: 72.5%  │    │ Test MAP: 67.5%          │
│ Test Recall@3: 68%       │    │ Test RMSE: 0.92          │
│ Test MAP: 71%            │    │                          │
│ Test RMSE: 0.85          │    │                          │
└──────────────┬───────────┘    └──────────────┬───────────┘
               │                              │
               └──────────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Compare Results     │
                    │                     │
                    │ Content-Based wins  │
                    │ (72.5% > 69.5%)     │
                    │                     │
                    │ Score: 71%          │
                    └────────┬────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ Store in MongoDB             │
              │ RecommendationModel          │
              │                              │
              │ • trainDate: Now             │
              │ • dataSize: 250 users        │
              │ • cbMetrics: {...}           │
              │ • cfMetrics: {...}           │
              │ • bestModel: content-based   │
              │ • accuracy: 0.725            │
              │ • isActive: true             │
              └──────────────────────────────┘
```

## Vector Structure (16 Dimensions)

### User Vector
```
User Vector = [p₁, p₂, c₁, c₂, c₃, c₄, c₅, c₆, c₇, c₈, c₉, c₁₀, e, r, p, s]

Index  Meaning                    Range      Example (Sports Fan)
────────────────────────────────────────────────────────────────
0      Preference: Physical       [0, 1]     0.9 (sports = physical)
1      Preference: Innovative     [0, 1]     0.1 (not tech-oriented)
2-11   Category Interests (10)    [0, 1]     [0.9, 0.2, 0.8, 0.1, ...]
       Sports, Tech, Arts, Food...
12     Engagement Score           [0, 1]     0.75 (active participant)
13     Avg Rating (0-1)          [0, 1]     0.85 (tends to rate 4-5)
14     Participation Rate         [0, 1]     0.60 (60% of events)
15     Recency Score              [0, 1]     0.95 (recently active)

Magnitude: √(0.9² + 0.1² + 0.9² + 0.2² + ...) ≈ 3.5
(Normalized in cosine similarity)
```

### Event Vector
```
Event Vector = [t₁, t₂, c₁, c₂, c₃, c₄, c₅, c₆, c₇, c₈, c₉, c₁₀, p, pr, tm, s]

Index  Meaning                    Range      Example (Sports Event)
────────────────────────────────────────────────────────────────
0      Type: Physical             [0, 1]     1.0 (sports = physical)
1      Type: Innovative           [0, 1]     0.0 (not tech)
2-11   Category (one-hot)        [0, 1]     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0]
       Only one is 1.0 (sports)
12     Popularity Score           [0, 1]     0.72 (avg registrations)
13     Price Factor               [0, 1]     0.50 (medium price)
14     Team-based Factor          [0, 1]     0.80 (team sport)
15     Recency Score              [0, 1]     0.65 (created 2 weeks ago)

Magnitude: √(1² + 0² + 1² + 0.72² + ...) ≈ 2.1
```

## Cosine Similarity Calculation

```
User Vector: [0.9, 0.1, 0.9, 0.2, 0.1, ...]
Event Vector: [1.0, 0.0, 1.0, 0.0, 0.0, ...]

Dot Product = (0.9×1.0) + (0.1×0.0) + (0.9×1.0) + (0.2×0.0) + ...
            = 0.9 + 0 + 0.9 + 0 + ...
            = 1.8

Magnitude User = 3.5
Magnitude Event = 2.1

Cosine Similarity = 1.8 / (3.5 × 2.1) = 1.8 / 7.35 ≈ 0.245

Score = (0.245 × 0.7) + (0.60 × 0.3) = 0.172 + 0.18 = 0.352 (35.2%)
```

## Metrics Explained Visually

### Precision@3
```
User engaged with: A B C D E F G H I J
Model recommends:  A B Z (top 3)
                   ✓ ✓ ✗

Precision@3 = 2/3 = 66.7%
"Of top 3, 2 were correct"
```

### Recall@3
```
User engaged with: A B C D E F G H I J (10 total)
Model recommends: A B Z (top 3)
                  ✓ ✓ ✗ (found 2 out of 10)

Recall@3 = 2/10 = 20%
"Captured 20% of user's engagements in top 3"
```

### MAP (Mean Average Precision)
```
Position 1: A (correct)    → Precision@1 = 1/1 = 1.0
Position 2: B (correct)    → Precision@2 = 2/2 = 1.0
Position 3: Z (incorrect)  → Precision@3 = 2/3 = 0.67
Position 4: C (correct)    → Precision@4 = 3/4 = 0.75
Position 5: D (correct)    → Precision@5 = 4/5 = 0.8

MAP = (1.0 + 1.0 + 0.67 + 0.75 + 0.8) / 5 = 0.844
"Average precision across ranks"
```

### RMSE
```
Prediction:  [4.2 stars, 3.8 stars, 4.5 stars]
Actual:      [4.0 stars, 4.0 stars, 4.0 stars]
Errors:      [0.2,      -0.2,     0.5]

RMSE = √((0.2² + 0.2² + 0.5²) / 3)
     = √((0.04 + 0.04 + 0.25) / 3)
     = √(0.11)
     = 0.332 stars error (lower is better)
```

## Cache Structure

```
Cache Map:
┌────────────────────────────────────────────┐
│ userId₁ → {                                │
│   data: [                                  │
│     { eventId, score, source, confidence } │
│   ],                                       │
│   timestamp: 1705315800000                 │
│ }                                          │
│                                            │
│ userId₂ → { data: [...], timestamp: ... } │
│                                            │
│ userId₃ → { data: [...], timestamp: ... } │
│                                            │
│ ... (up to 5000 entries)                   │
└────────────────────────────────────────────┘

Cache Lifecycle:
Current Time: 10:00:00 AM

Entry for userId₁ created: 9:57:00 AM
Time alive: 3 minutes (< 5 min)
Status: ✓ VALID - Return cached

Entry for userId₂ created: 9:54:00 AM
Time alive: 6 minutes (> 5 min)
Status: ✗ EXPIRED - Compute fresh
```

## Response Structure

### User Endpoint
```
GET /api/recommendations/{userId}?limit=3

HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "userId": "user123",
    "recommendations": [
      {
        "eventId": "evt_001",
        "eventTitle": "Marathon 2024",
        "score": 0.875,           ← 87.5% match
        "source": "content-based", ← Which model
        "confidence": 0.92        ← Our confidence
      },
      {
        "eventId": "evt_003",
        "eventTitle": "Trail Run",
        "score": 0.765,
        "source": "hybrid",
        "confidence": 0.88
      },
      {
        "eventId": "evt_002",
        "eventTitle": "Fitness Class",
        "score": 0.698,
        "source": "collaborative",
        "confidence": 0.75
      }
    ],
    "timestamp": "2024-01-15T10:00:00Z",
    "source": "cache"             ← From cache or computed
  }
}
```

### Training Results
```
{
  "success": true,
  "data": {
    "trainingTime": 45000,        ← 45 seconds
    "timestamp": "2024-01-15T09:00:00Z",
    "dataSize": 250,              ← 250 users
    
    "contentBasedMetrics": {
      "precision3": "0.725",      ← 72.5%
      "recall3": "0.680",         ← 68%
      "map": "0.710",             ← 71%
      "rmse": "0.850"             ← 0.85 stars error
    },
    
    "collaborativeMetrics": {
      "precision3": "0.695",      ← 69.5%
      "recall3": "0.650",         ← 65%
      "map": "0.675",             ← 67.5%
      "rmse": "0.920"             ← 0.92 stars error
    },
    
    "bestModel": "content-based",
    "score": "0.705"              ← 70.5% average
  }
}
```

## File Dependency Graph

```
recommendationRoutes.ts
├── recommendationService.ts
│   ├── contentBased.ts
│   │   └── vectorizer.ts
│   │       ├── Event (model)
│   │       └── User (model)
│   ├── collaborative.ts
│   │   ├── vectorizer.ts
│   │   ├── Registration (model)
│   │   └── Event (model)
│   └── trainer.ts
│       ├── contentBased.ts
│       ├── collaborative.ts
│       ├── RecommendationModel
│       ├── Event (model)
│       ├── User (model)
│       └── Registration (model)
└── requireAuth (middleware)
```

## Performance Timeline

```
Operation Timeline:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│ Request → Check Cache → Compute → Store → Return           │
│   0ms      10ms         500ms    20ms    520ms  (1st call)  │
│   0ms      10ms         -        -       10ms   (cached)    │
│                                                             │
│ Training:                                                   │
│   Load Data → Split → Model1 → Model2 → Compare → Store    │
│     5s        1s      20s      18s       2s       2s        │
│              ◄─────────── ~45 seconds total ──────────────► │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

This visual representation shows how the ML recommendation system works end-to-end, from vectors to recommendations to caching to training.
