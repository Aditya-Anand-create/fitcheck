const { MongoClient, ObjectId } = require('mongodb');

// Uses MongoDB when MONGODB_URI is set, otherwise keeps records in memory
// so the app still runs with zero setup.
async function createStore(uri) {
  if (!uri) return memoryStore();
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const col = client.db(process.env.MONGODB_DB || 'fitcheck').collection('analyses');
    await col.createIndex({ createdAt: -1 });
    return {
      kind: 'mongodb',
      async save(doc) {
        const r = await col.insertOne({ ...doc, createdAt: new Date() });
        return String(r.insertedId);
      },
      async get(id) {
        if (!ObjectId.isValid(id)) return null;
        const d = await col.findOne({ _id: new ObjectId(id) });
        return d ? { ...d, id: String(d._id), _id: undefined } : null;
      },
      async recent(limit = 10) {
        const rows = await col.find({}, { projection: { result: 0 } }).sort({ createdAt: -1 }).limit(limit).toArray();
        return rows.map((d) => ({ ...d, id: String(d._id), _id: undefined }));
      },
    };
  } catch (err) {
    console.error('MongoDB unavailable, falling back to memory:', err.message);
    return memoryStore();
  }
}

function memoryStore() {
  const rows = [];
  return {
    kind: 'memory',
    async save(doc) {
      const id = String(rows.length + 1);
      rows.push({ ...doc, id, createdAt: new Date() });
      return id;
    },
    async get(id) {
      return rows.find((r) => r.id === id) || null;
    },
    async recent(limit = 10) {
      return rows.slice(-limit).reverse().map(({ result, ...rest }) => rest);
    },
  };
}

module.exports = { createStore };
