import multer from 'multer';
import slugify from 'slugify'; // Pra gerar slugs maneiros
import { Article, User } from './db.js'; // Seu modelo de artigo
import fs from 'fs/promises'; // Pra ler o arquivo upado

const storage = multer.memoryStorage(); // Armazena o arquivo em memória para processamento
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Aceita text/markdown e arquivos com extensão .md (alguns clientes usam text/plain)
        const allowedMimes = ['text/markdown', 'text/x-markdown', 'text/plain'];
        const filename = (file.originalname || '').toLowerCase();
        const hasMdExt = filename.endsWith('.md');
        if (allowedMimes.includes(file.mimetype) || hasMdExt) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos Markdown (.md) são permitidos!'), false);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 10 // Limita o tamanho do arquivo a 10MB
    }
}).single('file'); // 'articleFile' é o nome do input type="file" no HTML

async function uploadArticle(req, res) {
    upload(req, res, async (err) => {
        console.log(err)
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Erro no upload: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        // Verifique se o arquivo, o título e o autor são obrigatórios.
        if (!req.file || !req.body.title) {
            return res.status(400).json({ error: 'Título e o arquivo do artigo são obrigatórios!' });
        }

        // short_description pode ser opcional.
        const { title, short_description } = req.body;
        // Use authenticated user id from middleware
        const authorId = req.user?.id
        if (!authorId) {
            return res.status(401).json({ error: 'Unauthenticated: missing user' })
        }

        const userRow = await User.findOne({ where: { id: authorId } })
        if (!userRow) return res.status(400).json({ error: 'Author not found' })
        const author = userRow.userName

        const markdownContent = req.file.buffer.toString('utf8');
        
        const generatedSlug = slugify(title, {
            lower: true,
            strict: true,
            locale: 'pt',
        });

        try {
            const existingArticle = await Article.findOne({ where: { slug: generatedSlug } });
            if (existingArticle) {
                return res.status(409).json({ error: `Já existe um artigo com o slug "${generatedSlug}". Por favor, escolha um título diferente.` });
            }

            // Salvar no banco de dados. O modelo não possui 'tags', e usa timestamps.
            const newArticle = await Article.create({
                title: title,
                slug: generatedSlug,
                content: markdownContent,
                short_description: short_description || null,
                author: authorId,
            });

            console.log('Artigo salvo com sucesso:', newArticle.toJSON());
            res.status(201).json({ message: 'Artigo enviado e salvo com sucesso!', article: newArticle.toJSON() });

        } catch (error) {
            console.error('Erro ao salvar artigo no DB:', error);
            res.status(500).json({ error: 'Erro interno do servidor ao salvar o artigo.' });
        }
    });
}

export { uploadArticle };