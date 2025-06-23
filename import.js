// Sistema de importação de orçamentos JSON
class ImportManager {
    constructor() {
        this.fileData = null;
        this.parsedData = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botão de importar
        const btnImportar = document.getElementById('btn-importar-json');
        if (btnImportar) {
            btnImportar.addEventListener('click', () => this.showImportModal());
        }

        // Modal controls
        const modalClose = document.getElementById('modal-importar-close');
        const btnCancelar = document.getElementById('btn-cancelar-import');
        const btnConfirmar = document.getElementById('btn-confirmar-import');
        const fileInput = document.getElementById('file-input');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeImportModal());
        }

        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => this.closeImportModal());
        }

        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', () => this.importOrcamentos());
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Fechar modal clicando fora
        const modal = document.getElementById('modal-importar');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeImportModal();
            });
        }
    }

    showImportModal() {
        const modal = document.getElementById('modal-importar');
        if (modal) {
            modal.classList.add('active');
            this.resetModal();
        }
    }

    closeImportModal() {
        const modal = document.getElementById('modal-importar');
        if (modal) {
            modal.classList.remove('active');
            this.resetModal();
        }
    }

    resetModal() {
        // Limpar dados
        this.fileData = null;
        this.parsedData = null;

        // Resetar elementos
        const fileInput = document.getElementById('file-input');
        const fileInfo = document.getElementById('file-info');
        const preview = document.getElementById('import-preview');
        const btnConfirmar = document.getElementById('btn-confirmar-import');

        if (fileInput) fileInput.value = '';
        if (fileInfo) fileInfo.style.display = 'none';
        if (preview) preview.style.display = 'none';
        if (btnConfirmar) btnConfirmar.disabled = true;
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.name.toLowerCase().endsWith('.json')) {
            Utils.showToast('Por favor, selecione um arquivo JSON válido', 'error');
            return;
        }

        // Mostrar informações do arquivo
        this.showFileInfo(file);

        try {
            // Ler arquivo
            const text = await this.readFile(file);
            this.fileData = text;

            // Parse JSON
            this.parsedData = JSON.parse(text);

            // Validar estrutura
            if (this.validateJsonStructure(this.parsedData)) {
                this.showPreview(this.parsedData);
                document.getElementById('btn-confirmar-import').disabled = false;
            } else {
                Utils.showToast('Formato do arquivo JSON inválido', 'error');
            }

        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            Utils.showToast('Erro ao ler arquivo JSON. Verifique a formatação.', 'error');
        }
    }

    showFileInfo(file) {
        const fileInfo = document.getElementById('file-info');
        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');

        if (fileInfo && fileName && fileSize) {
            fileName.textContent = file.name;
            fileSize.textContent = this.formatFileSize(file.size);
            fileInfo.style.display = 'block';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    validateJsonStructure(data) {
        try {
            // Verificar se tem a estrutura esperada
            if (!data.orcamentos || !Array.isArray(data.orcamentos)) {
                return false;
            }

            // Verificar se cada orçamento tem a estrutura mínima
            for (const orcamento of data.orcamentos) {
                if (!orcamento.cliente || !orcamento.cliente.nome) {
                    return false;
                }
                
                if (!orcamento.itens || !Array.isArray(orcamento.itens)) {
                    return false;
                }

                // Verificar estrutura dos itens
                for (const item of orcamento.itens) {
                    if (!item.peca || !item.servico || typeof item.valor !== 'number') {
                        return false;
                    }
                }
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    showPreview(data) {
        const preview = document.getElementById('import-preview');
        const content = document.getElementById('preview-content');

        if (!preview || !content) return;

        const orcamentos = data.orcamentos;
        let html = `
            <div class="preview-summary">
                <p><strong>Orçamentos encontrados:</strong> ${orcamentos.length}</p>
                <p><strong>Valor total:</strong> ${Utils.formatCurrency(
                    orcamentos.reduce((total, orc) => total + (orc.resumo?.total || this.calculateTotal(orc.itens)), 0)
                )}</p>
            </div>
        `;

        html += '<div class="preview-list">';
        orcamentos.forEach(orcamento => {
            const total = orcamento.resumo?.total || this.calculateTotal(orcamento.itens);
            html += `
                <div class="preview-item">
                    <div>
                        <strong>${Utils.sanitizeHtml(orcamento.cliente.nome)}</strong>
                        <br>
                        <small>${orcamento.itens.length} itens - ${Utils.formatDate(orcamento.data_criacao)}</small>
                    </div>
                    <div>${Utils.formatCurrency(total)}</div>
                </div>
            `;
        });
        html += '</div>';

        content.innerHTML = html;
        preview.style.display = 'block';
    }

    calculateTotal(itens) {
        if (!Array.isArray(itens)) return 0;
        return itens.reduce((total, item) => total + (item.valor || 0), 0);
    }

    async importOrcamentos() {
        if (!this.parsedData) {
            Utils.showToast('Nenhum dado para importar', 'error');
            return;
        }

        try {
            const orcamentos = this.parsedData.orcamentos;
            
            // Converter para formato interno
            const orcamentosConvertidos = orcamentos.map(orc => this.convertToInternalFormat(orc));
            
            // Tentar importar via MongoDB primeiro
            const resultadoMongo = await this.importViaAPI(orcamentosConvertidos);
            
            if (resultadoMongo.success) {
                // Sucesso via MongoDB
                Utils.showToast(
                    `${resultadoMongo.sucessos} orçamento(s) importado(s) na nuvem!` + 
                    (resultadoMongo.erros > 0 ? ` (${resultadoMongo.erros} erro(s))` : ''), 
                    'success'
                );
                
                // Também salvar localmente como backup
                this.saveLocalBackup(orcamentosConvertidos);
                
            } else {
                // Fallback para localStorage
                let importados = 0;
                let erros = 0;

                for (const orcamento of orcamentosConvertidos) {
                    try {
                        storageManager.saveOrcamento(orcamento);
                        importados++;
                    } catch (error) {
                        console.error('Erro ao importar orçamento:', error);
                        erros++;
                    }
                }

                Utils.showToast(
                    `${importados} orçamento(s) importado(s) localmente!` + 
                    (erros > 0 ? ` (${erros} erro(s))` : '') +
                    ' (Salvo apenas no seu dispositivo)', 
                    'success'
                );
            }

            // Fechar modal e recarregar dashboard
            this.closeImportModal();
            setTimeout(() => {
                if (window.app && window.app.loadDashboard) {
                    window.app.loadDashboard();
                }
            }, 1000);

        } catch (error) {
            console.error('Erro durante importação:', error);
            Utils.showToast('Erro durante a importação. Tente novamente.', 'error');
        }
    }

    async importViaAPI(orcamentos) {
        try {
            const apiUrl = this.getApiUrl();
            const response = await fetch(`${apiUrl}/api/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orcamentos })
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                console.error('Erro na API:', response.statusText);
                return { success: false };
            }

        } catch (error) {
            console.error('Erro ao conectar com API:', error);
            return { success: false };
        }
    }

    saveLocalBackup(orcamentos) {
        try {
            for (const orcamento of orcamentos) {
                storageManager.saveOrcamento(orcamento);
            }
        } catch (error) {
            console.error('Erro ao salvar backup local:', error);
        }
    }

    getApiUrl() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        } else if (window.location.hostname.includes('vercel.app')) {
            return window.location.origin;
        } else if (window.location.hostname.includes('github.io')) {
            return 'https://leah-costura.vercel.app';
        }
        return window.location.origin;
    }

    convertToInternalFormat(jsonOrcamento) {
        // Converter formato do JSON para formato interno da aplicação
        const orcamento = {
            cliente: {
                nome: jsonOrcamento.cliente.nome,
                telefone: jsonOrcamento.cliente.telefone || '',
                email: jsonOrcamento.cliente.email || ''
            },
            itens: [],
            prazo: jsonOrcamento.prazo || '',
            observacoes: jsonOrcamento.observacoes || '',
            status: jsonOrcamento.status || 'pendente'
        };

        // Converter itens
        jsonOrcamento.itens.forEach(item => {
            const itemInterno = {
                numero: item.numero,
                peca: item.peca,
                servico: item.servico,
                valor: item.valor
            };

            // Adicionar valor alternativo se existir
            if (item.valor_alternativo) {
                itemInterno.valor_alternativo = item.valor_alternativo;
            }

            orcamento.itens.push(itemInterno);
        });

        // Calcular total
        orcamento.total = jsonOrcamento.resumo?.total || this.calculateTotal(orcamento.itens);

        // Usar ID existente se disponível, senão será gerado automaticamente
        if (jsonOrcamento.id) {
            orcamento.id = jsonOrcamento.id;
        }

        // Usar data de criação se disponível
        if (jsonOrcamento.data_criacao) {
            orcamento.data_criacao = jsonOrcamento.data_criacao;
        }

        return orcamento;
    }

    // Método para exportar orçamentos atuais (funcionalidade extra)
    exportCurrentOrcamentos() {
        try {
            const orcamentos = storageManager.getAllOrcamentos();
            const config = storageManager.getConfig();
            
            const exportData = {
                orcamentos: orcamentos.map(orc => this.convertToExportFormat(orc)),
                metadata: {
                    data_exportacao: new Date().toISOString().split('T')[0],
                    total_orcamentos: orcamentos.length,
                    valor_total_geral: orcamentos.reduce((total, orc) => total + (orc.total || 0), 0),
                    profissional: config.profissional || {}
                }
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const filename = `orcamentos-leah-${new Date().toISOString().split('T')[0]}.json`;
            
            Utils.downloadFile(jsonString, filename, 'application/json');
            Utils.showToast('Orçamentos exportados com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao exportar:', error);
            Utils.showToast('Erro ao exportar orçamentos', 'error');
        }
    }

    convertToExportFormat(orcamento) {
        // Converter formato interno para formato de exportação
        return {
            id: orcamento.id,
            data_criacao: orcamento.data_criacao?.split('T')[0] || new Date().toISOString().split('T')[0],
            profissional: {
                nome: "Leah Karina",
                telefone: "(11) 95606-1906",
                localizacao: "Tábata"
            },
            cliente: orcamento.cliente,
            itens: orcamento.itens,
            resumo: {
                total_itens: orcamento.itens.length,
                subtotal: orcamento.total,
                total: orcamento.total
            },
            observacoes: orcamento.observacoes,
            prazo: orcamento.prazo,
            status: orcamento.status
        };
    }
}

// Instanciar globalmente
window.importManager = new ImportManager();