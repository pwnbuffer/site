import 'dotenv/config.js'
import { Sequelize, DataTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const sequelize = new Sequelize(process.env.PG_DB, process.env.PG_USER, process.env.PG_PASS, {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    dialect: "postgres",
    logging: false,
    ssl: false,
    pool: {
        max: 10,
        min: 0,
        idle: 10000,
        acquire: 30000

    },

    define: {
        schema: process.env.PG_SCHEMA

    }

});

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false

    },
    userName: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false

    },
    pass: {
        type: DataTypes.TEXT,
        unique: false,
        allowNull: false
    
    },
    worm: {
        type: DataTypes.BOOLEAN,
        allowNull: false

    }
}, {
    timestamps: true,
    schema: process.env.PG_SCHEMA,
    tableName: 'User'

})

const Article = sequelize.define('Article', {
    slug: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,

    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,

    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,

    },
    short_description: {
        type: DataTypes.STRING,
        allowNull: true,

    },
    author: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: {
                tableName: 'User',
                schema: process.env.PG_SCHEMA
            },
            key: 'id'
        }
    }
}, {
    timestamps: true,
    schema: process.env.PG_SCHEMA,
    tableName: 'Article'

});

Article.belongsTo(User, {
    foreignKey: { name: 'author', allowNull: false },
    targetKey: 'id',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'

})

User.hasMany(Article, {
    foreignKey: { name: 'author', allowNull: false },
    sourceKey: 'id',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'

})

const File = sequelize.define('File', {
    slug: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
        
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false

    },
    buff: {
        type: DataTypes.BLOB,
        allowNull: false

    },
    mime: {
        type: DataTypes.STRING,
        allowNull: false
        
    }
}, {
    timestamps: true,
    schema: process.env.PG_SCHEMA,
    tableName: 'File'

})

export const initDb = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to DB has been established successfully.');
        await sequelize.sync({ alter: true });
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

export { Article, File, User };