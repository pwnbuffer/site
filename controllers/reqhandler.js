import path from 'path';
import fs from 'fs';
import { __dirname } from '../server.js';
import renderMarkdown from './parsemd.js';
import { Article, User } from './db.js';
import { Op } from 'sequelize';
import errPage from '../modules/error.js';

const renderFullHtmlPage = (title, renderedMarkdownHtml, author, date) => {
    return (fs.readFileSync(path.join(__dirname, "pages", "paper.html")).toString("utf8"))
        .replaceAll("__insert_the_title_here", title)
        .replaceAll("__insert_author_here", author)
        .replaceAll("__insert_date_here", date)
        .replaceAll("__insert_content_here", renderedMarkdownHtml);
};

async function articleViewer(req, res) {
    const { slug: articleName } = req.params;
    const articleSlug = articleName.toLowerCase().replaceAll(" ", "-");

    try {
        const article = await Article.findOne({
            where: { slug: articleSlug },
            attributes: ['title', 'slug', 'content', 'createdAt'],
            include: [{
                model: User,
                attributes: ['userName'],
                as: 'User' // usa o alias do relacionamento (se não definiu, o Sequelize usa o nome do model)
            }]
        });

        if (!article) {
            return res.status(404).send(errPage(404, `Paper ${articleName} was not found.`));
        }

        const renderedMarkdownHtml = await renderMarkdown(article.content);
        // Use createdAt timestamp from Sequelize model for the date
        const dateStr = article.createdAt ? (new Date(article.createdAt)).toISOString() : '';

        const content = renderFullHtmlPage(article.title, renderedMarkdownHtml, article.User.userName, dateStr);
        res.status(200).send(content);

    } catch (err) {
        console.error("Erro ao buscar artigo ou renderizar:", err);
        return res.status(500).send(errPage(500, `Some error occurred.`));

    }
}

export { articleViewer };
