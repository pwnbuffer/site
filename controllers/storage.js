import { File } from "./db.js";
import multer from 'multer';
import sharp from "sharp";
import { fileTypeFromBuffer } from 'file-type';
import slugify from 'slugify';
import errorPage from "../modules/error.js";

const storage = multer.memoryStorage(); // Armazena o arquivo em memória para processamento
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Aceita text/markdown e arquivos com extensão .md (alguns clientes usam text/plain)
        const allowedMimes = ['text/markdown', 'text/x-markdown', 'text/plain', 'image/svg+xml', 'image/webp', 'image/png', 'image/jpeg'];
        const filename = (file.originalname || '').toLowerCase();
        const hasAllowedExt = /\.(md|svg|webp|png|jpeg|jpg|txt)$/i.test(filename);
        if (allowedMimes.includes(file.mimetype) || hasAllowedExt) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não suportado. Apenas arquivos Markdown (.md), texto (.txt) ou imagens (svg, webp, png, jpeg) são permitidos.'), false);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 64 // Limita o tamanho do arquivo a 64MB
    }
}).single('newFile'); // 'newFile' é o nome do input type="file" no HTML

async function getFromStorage(req, res) {
    const { f: fileKey } = req.params
    const file = await File.findOne({
        where: {
            slug: fileKey

        }
    })

    if (!file) {
        return res.status(404).send(errorPage(404, "File not found"))

    }

    res.contentType(file.mime)
    res.status(200).send(Buffer.from(file.buff))
    
};

const resizeFile = async (buffer, quality = 1024) => {
    return await sharp(buffer)
        .resize({ width: quality })
        .toBuffer();

};

function insertIntoStorage(req, res) {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file || !req.body.title) {
            return res.status(400).json({ error: 'Both file and title are required.' });
        }

        const { title } = req.body;
        // Ensure a reasonably unique slug; append timestamp if collision
        let baseSlug = slugify(title, { lower: true, strict: true, locale: 'pt' });
        let slug = baseSlug;

        try {
            // If slug exists, append timestamp
            const existing = await File.findOne({ where: { slug } });
            if (existing) {
                slug = `${baseSlug}-${Date.now()}`;
            }
            let mimeFromFile = (await fileTypeFromBuffer(req.file.buffer))?.mime ?? 'unknown';

            const created = await File.create({
                slug,
                title,
                buff: mimeFromFile.startsWith('image/') ? await resizeFile(req.file.buffer, title.startsWith("wallpaper") ? 2048 : 1024) : req.file.buffer,
                mime: req.file.mimetype || 'application/octet-stream'
            });

            return res.status(201).json({ message: 'File uploaded successfully', file: { slug: created.slug, title: created.title, mime: created.mime, createdAt: created.createdAt } });

        } catch (e) {
            console.error('Error saving file to DB:', e);
            return res.status(500).json({ error: 'Internal server error while saving file.' });
        }
    });
};

export { getFromStorage, insertIntoStorage };