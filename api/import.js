// API para importar múltiplos orçamentos do JSON
const { MongoClient } = require('mongodb');

// Conexão MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://contato:tCJ0QBFwkZK3MsNW@leahcluster.0bwwwt1.mongodb.net/leahcostura?retryWrites=true&w=majority&appName=LeahCluster';
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
        const { orcamentos } = req.body;
        
        if (!orcamentos || !Array.isArray(orcamentos)) {
            return res.status(400).json({ error: 'Array de orçamentos é obrigatório' });
        }

        // Conectar ao MongoDB
        await client.connect();
        const db = client.db('leahcostura');
        const orcamentosCollection = db.collection('orcamentos');
        const localCollection = db.collection('orcamentos_locais');

        let sucessos = 0;
        let erros = 0;
        const resultados = [];

        for (const orcamentoJson of orcamentos) {
            try {
                // Converter formato JSON para formato interno
                const orcamento = convertJsonToInternal(orcamentoJson);
                
                // Salvar no collection local (para a Leah)
                await localCollection.replaceOne(
                    { orcamentoId: orcamento.id }, 
                    {
                        orcamentoId: orcamento.id,
                        ...orcamento,
                        data_importacao: new Date().toISOString(),
                        fonte: 'json_upload'
                    },
                    { upsert: true }
                );

                // Gerar link de compartilhamento também
                const shortId = generateShortId();
                await orcamentosCollection.insertOne({
                    shortId,
                    orcamentoId: orcamento.id,
                    cliente: orcamento.cliente,
                    itens: orcamento.itens,
                    total: orcamento.total,
                    prazo: orcamento.prazo,
                    observacoes: orcamento.observacoes,
                    data_criacao: orcamento.data_criacao,
                    data_compartilhamento: new Date().toISOString(),
                    expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
                });

                resultados.push({
                    id: orcamento.id,
                    cliente: orcamento.cliente.nome,
                    status: 'sucesso',
                    shareLink: `${process.env.SITE_URL || 'https://leah-costura.vercel.app'}#m/${shortId}`
                });

                sucessos++;

            } catch (error) {
                console.error(`Erro ao importar orçamento ${orcamentoJson.id}:`, error);
                resultados.push({
                    id: orcamentoJson.id || 'ID inválido',
                    status: 'erro',
                    erro: error.message
                });
                erros++;
            }
        }

        // Fechar conexão
        await client.close();

        return res.status(200).json({
            success: true,
            total: orcamentos.length,
            sucessos,
            erros,
            resultados
        });

    } catch (error) {
        console.error('Erro ao importar orçamentos:', error);
        
        try {
            await client.close();
        } catch (closeError) {
            console.error('Erro ao fechar conexão:', closeError);
        }

        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

function convertJsonToInternal(jsonOrcamento) {
    return {
        id: jsonOrcamento.id,
        cliente: {
            nome: jsonOrcamento.cliente.nome,
            telefone: jsonOrcamento.cliente.telefone || '',
            email: jsonOrcamento.cliente.email || ''
        },
        itens: jsonOrcamento.itens.map(item => ({
            numero: item.numero,
            peca: item.peca,
            servico: item.servico,
            valor: item.valor,
            ...(item.valor_alternativo && { valor_alternativo: item.valor_alternativo })
        })),
        total: jsonOrcamento.resumo?.total || jsonOrcamento.itens.reduce((sum, item) => sum + item.valor, 0),
        prazo: jsonOrcamento.prazo || '',
        observacoes: jsonOrcamento.observacoes || '',
        data_criacao: jsonOrcamento.data_criacao || new Date().toISOString(),
        status: jsonOrcamento.status || 'pendente'
    };
}

function generateShortId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}