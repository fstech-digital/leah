// API para listar orçamentos da Leah (sincronizar com a nuvem)
const { MongoClient } = require('mongodb');

// Conexão MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://contato:tCJ0QBFwkZK3MsNW@leahcluster.0bwwwt1.mongodb.net/leahcostura?retryWrites=true&w=majority&appName=LeahCluster';
const client = new MongoClient(MONGODB_URI);

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // Conectar ao MongoDB
        await client.connect();
        const db = client.db('leahcostura');
        const collection = db.collection('orcamentos_locais');

        // Buscar todos os orçamentos da Leah
        const orcamentos = await collection.find({})
            .sort({ data_criacao: -1 })
            .toArray();

        // Fechar conexão
        await client.close();

        // Remover campos internos do MongoDB
        const orcamentosLimpos = orcamentos.map(orc => {
            const { _id, data_importacao, fonte, ...orcamentoLimpo } = orc;
            return orcamentoLimpo;
        });

        return res.status(200).json({
            success: true,
            orcamentos: orcamentosLimpos,
            total: orcamentosLimpos.length
        });

    } catch (error) {
        console.error('Erro ao listar orçamentos:', error);
        
        try {
            await client.close();
        } catch (closeError) {
            console.error('Erro ao fechar conexão:', closeError);
        }

        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}