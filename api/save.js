// API para salvar orçamento no MongoDB
const { MongoClient } = require('mongodb');

// Conexão MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://contato:tCJ0QBFwkZK3MsNW@cluster0.mongodb.net/leahcostura?retryWrites=true&w=majority';
const client = new MongoClient(MONGODB_URI);

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const orcamento = req.body;
        
        if (!orcamento || !orcamento.id || !orcamento.cliente) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        // Conectar ao MongoDB
        await client.connect();
        const db = client.db('leahcostura');
        const collection = db.collection('orcamentos');

        // Gerar ID curto único
        let shortId = generateShortId();
        
        // Verificar se ID já existe
        const exists = await collection.findOne({ shortId });
        if (exists) {
            // Gerar novo ID se já existir
            shortId = generateShortId();
        }

        // Preparar dados para salvar
        const documento = {
            shortId,
            orcamentoId: orcamento.id,
            cliente: orcamento.cliente,
            itens: orcamento.itens,
            total: orcamento.total,
            prazo: orcamento.prazo,
            observacoes: orcamento.observacoes,
            data_criacao: orcamento.data_criacao || new Date().toISOString(),
            data_compartilhamento: new Date().toISOString(),
            expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 dias
        };

        // Salvar no MongoDB
        await collection.insertOne(documento);

        // Fechar conexão
        await client.close();

        return res.status(200).json({ 
            success: true, 
            shortId,
            link: `${process.env.SITE_URL || 'https://fstech-digital.github.io/leah'}#v/${shortId}`
        });

    } catch (error) {
        console.error('Erro ao salvar orçamento:', error);
        
        try {
            await client.close();
        } catch (closeError) {
            console.error('Erro ao fechar conexão:', closeError);
        }

        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

function generateShortId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}