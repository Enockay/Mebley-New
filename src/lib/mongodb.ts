import { MongoClient, type Db, type Collection, ObjectId } from 'mongodb'

// ⚠️ SERVER-SIDE ONLY — Never import in client components
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set')
}

const uri = process.env.MONGODB_URI
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

// ─── Database helpers ─────────────────────────────────────────────────────────

export async function getDb(): Promise<Db> {
  const mongoClient = await clientPromise
  return mongoClient.db('crotchet')
}

// ─── Message Types ────────────────────────────────────────────────────────────

export interface IMessage {
  _id?: ObjectId
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  messageType: 'text' | 'image' | 'gif' | 'audio' | 'video_call'
  mediaUrl?: string
  mediaKey?: string
  duration?: number
  callStatus?: 'initiated' | 'accepted' | 'declined' | 'missed' | 'ended'
  callDuration?: number
  isRead: boolean
  isDeleted: boolean
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
  translatedContent?: Record<string, string>
  language?: string
}

export interface IConversationMeta {
  _id?: ObjectId
  conversationId: string
  participantIds: string[]
  lastMessage: {
    content: string
    senderId: string
    createdAt: Date
    messageType: string
  } | null
  unreadCount: Record<string, number>
  createdAt: Date
  updatedAt: Date
}

// ─── Collections ──────────────────────────────────────────────────────────────

export async function getMessagesCollection(): Promise<Collection<IMessage>> {
  const db = await getDb()
  const collection = db.collection<IMessage>('messages')
  await collection.createIndex({ conversationId: 1, createdAt: -1 })
  await collection.createIndex({ senderId: 1 })
  await collection.createIndex({ receiverId: 1 })
  await collection.createIndex({ createdAt: -1 })
  return collection
}

export async function getConversationMetaCollection(): Promise<Collection<IConversationMeta>> {
  const db = await getDb()
  const collection = db.collection<IConversationMeta>('conversation_meta')
  await collection.createIndex({ conversationId: 1 }, { unique: true })
  await collection.createIndex({ participantIds: 1 })
  await collection.createIndex({ updatedAt: -1 })
  return collection
}

// ─── Message Service ──────────────────────────────────────────────────────────

export async function saveMessage(
  message: Omit<IMessage, '_id' | 'createdAt' | 'updatedAt'> & { participantIds?: string[] }
): Promise<IMessage> {
  const collection = await getMessagesCollection()
  const now = new Date()
  const newMessage: IMessage = {
    ...message,
    isRead: false,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  }
  const result = await collection.insertOne(newMessage)
  await updateConversationMeta(
    message.conversationId,
    message.participantIds ?? [message.senderId, message.receiverId],
    newMessage
  )
  return { ...newMessage, _id: result.insertedId }
}

export async function getMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<IMessage[]> {
  const collection = await getMessagesCollection()
  return collection
    .find({ conversationId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray()
}

export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const collection = await getMessagesCollection()
  await collection.updateMany(
    { conversationId, receiverId: userId, isRead: false },
    { $set: { isRead: true, updatedAt: new Date() } }
  )
  const metaCollection = await getConversationMetaCollection()
  await metaCollection.updateOne(
    { conversationId },
    { $set: { [`unreadCount.${userId}`]: 0, updatedAt: new Date() } }
  )
}

export async function softDeleteMessage(
  messageId: string,
  userId: string
): Promise<boolean> {
  const collection = await getMessagesCollection()
  const result = await collection.updateOne(
    { _id: new ObjectId(messageId), senderId: userId },
    { $set: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() } }
  )
  return result.modifiedCount > 0
}

async function updateConversationMeta(
  conversationId: string,
  participantIds: string[],
  lastMessage: IMessage
): Promise<void> {
  const collection = await getConversationMetaCollection()
  await collection.updateOne(
    { conversationId },
    {
      $set: {
        lastMessage: {
          content: lastMessage.isDeleted ? 'Message deleted' : lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
          messageType: lastMessage.messageType,
        },
        updatedAt: new Date(),
      },
      $inc: { [`unreadCount.${lastMessage.receiverId}`]: 1 },
      $setOnInsert: {
        conversationId,
        participantIds,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  )
}