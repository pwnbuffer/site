import { Article, File, User } from "./db.js";
import { Op } from "sequelize";

export const lastest = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5; // Pega o limite da query string, padrão 5
        const articles = await Article.findAll({
            order: [['createdAt', 'DESC']],
            limit: limit,
            attributes: ['title', 'slug', 'short_description', 'createdAt'],
            include: [{
                model: User,
                attributes: ['userName'],
                as: 'User'
            }]
        });
        res.json(articles);
    } catch (error) {
        console.error('Erro ao buscar artigos para API:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar artigos.' });
    }
};

export const all = async (req, res) => {
    try {
        const articles = await Article.findAll({
            order: [['createdAt', 'DESC']],
            attributes: ['title', 'slug', 'short_description', 'createdAt'],
            include: [{
                model: User,
                attributes: ['userName'],
                as: 'User'
            }]
        });
        res.json(articles);
    } catch (error) {
        console.error('Erro ao buscar todos os artigos para API:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar artigos.' });
    }
};

export const wallpapers = async (req, res) => {
    try {
        // Return files that look like wallpapers. Use File model and do not include the BLOB.
        const wallpapers = await File.findAll({
            where: {
                [Op.or]: [
                    { slug: { [Op.like]: 'wallpaper-%' } },
                ]
            },
            order: [['createdAt', 'DESC']],
            attributes: ['slug', 'title', 'mime', 'createdAt']
        });

        res.json(wallpapers);
    } catch (error) {
        console.error("Wallpapers,", error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar wallpapers' });
    }
};