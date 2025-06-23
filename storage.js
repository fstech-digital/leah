// Sistema de armazenamento local para orçamentos
class StorageManager {
    constructor() {
        this.storageKey = 'leah_orcamentos';
        this.configKey = 'leah_config';
        this.init();
    }

    init() {
        // Inicializa o storage se não existir
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(this.configKey)) {
            localStorage.setItem(this.configKey, JSON.stringify({
                nextId: 1,
                profissional: {
                    nome: 'Leah Karina',
                    telefone: '(11) 95606-1906',
                    endereco: 'Tábata, São Paulo',
                    email: 'leah@karina.com'
                }
            }));
        }
    }

    // Gerar ID único para orçamento
    generateId() {
        const config = this.getConfig();
        const year = new Date().getFullYear();
        const id = `${year}-${String(config.nextId).padStart(3, '0')}`;
        
        config.nextId++;
        this.saveConfig(config);
        
        return id;
    }

    // Salvar orçamento
    saveOrcamento(orcamento) {
        const orcamentos = this.getAllOrcamentos();
        
        if (orcamento.id) {
            // Atualizar existente
            const index = orcamentos.findIndex(o => o.id === orcamento.id);
            if (index !== -1) {
                orcamentos[index] = { ...orcamento, data_modificacao: new Date().toISOString() };
            } else {
                orcamentos.push({ ...orcamento, data_criacao: new Date().toISOString() });
            }
        } else {
            // Novo orçamento
            orcamento.id = this.generateId();
            orcamento.data_criacao = new Date().toISOString();
            orcamento.data_modificacao = new Date().toISOString();
            orcamento.status = orcamento.status || 'pendente';
            orcamentos.push(orcamento);
        }

        localStorage.setItem(this.storageKey, JSON.stringify(orcamentos));
        return orcamento;
    }

    // Obter todos os orçamentos
    getAllOrcamentos() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erro ao carregar orçamentos:', error);
            return [];
        }
    }

    // Obter orçamento por ID
    getOrcamento(id) {
        const orcamentos = this.getAllOrcamentos();
        return orcamentos.find(o => o.id === id);
    }

    // Deletar orçamento
    deleteOrcamento(id) {
        const orcamentos = this.getAllOrcamentos();
        const filtered = orcamentos.filter(o => o.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
        return true;
    }

    // Duplicar orçamento
    duplicateOrcamento(id) {
        const orcamento = this.getOrcamento(id);
        if (!orcamento) return null;

        const duplicate = {
            ...orcamento,
            id: null,
            status: 'rascunho',
            cliente: {
                ...orcamento.cliente,
                nome: `${orcamento.cliente.nome} (Cópia)`
            }
        };

        return this.saveOrcamento(duplicate);
    }

    // Buscar orçamentos
    searchOrcamentos(query) {
        const orcamentos = this.getAllOrcamentos();
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) return orcamentos;

        return orcamentos.filter(orcamento => {
            const cliente = orcamento.cliente.nome.toLowerCase();
            const id = orcamento.id.toLowerCase();
            const data = new Date(orcamento.data_criacao).toLocaleDateString('pt-BR');
            
            return cliente.includes(searchTerm) || 
                   id.includes(searchTerm) || 
                   data.includes(searchTerm);
        });
    }

    // Filtrar por status
    filterByStatus(status) {
        const orcamentos = this.getAllOrcamentos();
        return orcamentos.filter(o => o.status === status);
    }

    // Ordenar orçamentos
    sortOrcamentos(orcamentos, field = 'data_criacao', order = 'desc') {
        return [...orcamentos].sort((a, b) => {
            let valueA = a[field];
            let valueB = b[field];

            if (field === 'data_criacao' || field === 'data_modificacao') {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            }

            if (field === 'total') {
                valueA = Number(valueA) || 0;
                valueB = Number(valueB) || 0;
            }

            if (field === 'cliente.nome') {
                valueA = a.cliente.nome.toLowerCase();
                valueB = b.cliente.nome.toLowerCase();
            }

            if (order === 'asc') {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            } else {
                return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
            }
        });
    }

    // Atualizar status do orçamento
    updateStatus(id, status) {
        const orcamento = this.getOrcamento(id);
        if (orcamento) {
            orcamento.status = status;
            orcamento.data_modificacao = new Date().toISOString();
            return this.saveOrcamento(orcamento);
        }
        return null;
    }

    // Configurações
    getConfig() {
        try {
            const data = localStorage.getItem(this.configKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            return {};
        }
    }

    saveConfig(config) {
        localStorage.setItem(this.configKey, JSON.stringify(config));
    }

    // Estatísticas
    getEstatisticas() {
        const orcamentos = this.getAllOrcamentos();
        const agora = new Date();
        const mesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const anoAtual = new Date(agora.getFullYear(), 0, 1);

        const stats = {
            total: orcamentos.length,
            pendentes: orcamentos.filter(o => o.status === 'pendente').length,
            enviados: orcamentos.filter(o => o.status === 'enviado').length,
            rascunhos: orcamentos.filter(o => o.status === 'rascunho').length,
            
            valorTotal: orcamentos.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
            
            mesAtual: orcamentos.filter(o => 
                new Date(o.data_criacao) >= mesAtual
            ).length,
            
            anoAtual: orcamentos.filter(o => 
                new Date(o.data_criacao) >= anoAtual
            ).length,

            mediaValor: 0
        };

        if (stats.total > 0) {
            stats.mediaValor = stats.valorTotal / stats.total;
        }

        return stats;
    }

    // Exportar dados
    exportData() {
        const data = {
            orcamentos: this.getAllOrcamentos(),
            config: this.getConfig(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return JSON.stringify(data, null, 2);
    }

    // Importar dados
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.orcamentos && Array.isArray(data.orcamentos)) {
                localStorage.setItem(this.storageKey, JSON.stringify(data.orcamentos));
            }
            
            if (data.config && typeof data.config === 'object') {
                localStorage.setItem(this.configKey, JSON.stringify(data.config));
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }

    // Limpar todos os dados
    clearAll() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.configKey);
        this.init();
    }

    // Backup automático (salvar no sessionStorage)
    createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            data: this.exportData()
        };
        
        sessionStorage.setItem('leah_backup', JSON.stringify(backup));
        return backup;
    }

    // Restaurar backup
    restoreBackup() {
        try {
            const backup = sessionStorage.getItem('leah_backup');
            if (backup) {
                const backupData = JSON.parse(backup);
                return this.importData(backupData.data);
            }
            return false;
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            return false;
        }
    }
}

// Instância global do gerenciador de storage
window.storageManager = new StorageManager();