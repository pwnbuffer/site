import { User } from './db.js'

// GET /api/worms
export async function getWorms(req, res) {
  try {
    const worms = await User.findAll({ where: { worm: true }, attributes: ['id', 'userName', 'createdAt'] })
    res.json({ worms: worms.map(w => ({ id: w.id, userName: w.userName, createdAt: w.createdAt })) })
  } catch (err) {
    console.error('getWorms error', err)
    res.status(500).json({ error: 'Could not fetch worms' })
  }
}
