// API para buscar orçamento no MongoDB
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
        const { id } = req.query;
        
        if (!id || id.length !== 6) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        // Conectar ao MongoDB
        await client.connect();
        const db = client.db('leahcostura');
        const collection = db.collection('orcamentos');

        // Buscar orçamento
        const documento = await collection.findOne({ 
            shortId: id,
            expires_at: { $gt: new Date() } // Verificar se não expirou
        });

        // Fechar conexão
        await client.close();

        if (!documento) {
            return res.status(404).json({ 
                error: 'Orçamento não encontrado ou expirado',
                expired: true 
            });
        }

        // Retornar dados do orçamento
        const orcamento = {
            id: documento.orcamentoId,
            cliente: documento.cliente,
            itens: documento.itens,
            total: documento.total,
            prazo: documento.prazo,
            observacoes: documento.observacoes,
            data_criacao: documento.data_criacao,
            data_compartilhamento: documento.data_compartilhamento
        };

        return res.status(200).json({ 
            success: true, 
            orcamento 
        });

    } catch (error) {
        console.error('Erro ao buscar orçamento:', error);
        
        try {
            await client.close();
        } catch (closeError) {
            console.error('Erro ao fechar conexão:', closeError);
        }

        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}