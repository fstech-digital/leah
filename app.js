// Aplicação principal do sistema de orçamentos
class App {
    constructor() {
        this.currentOrcamento = null;
        this.editMode = false;
        this.searchDebounce = null;
        
        this.init();
    }

    init() {
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Configurar event listeners
        this.setupEventListeners();
        
        // Carregar dados iniciais
        this.loadInitialData();
        
        console.log('App inicializada com sucesso');
    }

    setupEventListeners() {
        // Navegação
        const navDashboard = document.getElementById('nav-dashboard');
        const navNovo = document.getElementById('nav-novo');
        
        if (navDashboard) {
            navDashboard.addEventListener('click', () => router.navigateTo('dashboard'));
        }
        
        if (navNovo) {
            navNovo.addEventListener('click', () => router.navigateTo('novo'));
        }

        // Dashboard
        const btnNovoOrcamento = document.getElementById('btn-novo-orcamento');
        const searchInput = document.getElementById('search-input');
        
        if (btnNovoOrcamento) {
            btnNovoOrcamento.addEventListener('click', () => router.navigateTo('novo'));
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Formulário de orçamento
        const formOrcamento = document.getElementById('form-orcamento');
        const btnAdicionarItem = document.getElementById('btn-adicionar-item');
        const btnVoltarForm = document.getElementById('btn-voltar');
        const btnSalvarRascunho = document.getElementById('btn-salvar-rascunho');

        if (formOrcamento) {
            formOrcamento.addEventListener('submit', (e) => this.handleSubmitOrcamento(e));
        }
        
        if (btnAdicionarItem) {
            btnAdicionarItem.addEventListener('click', () => this.adicionarItem());
        }
        
        if (btnVoltarForm) {
            btnVoltarForm.addEventListener('click', () => router.navigateTo('dashboard'));
        }
        
        if (btnSalvarRascunho) {
            btnSalvarRascunho.addEventListener('click', () => this.salvarRascunho());
        }

        // Visualização de orçamento
        const btnEditarOrc = document.getElementById('btn-editar');
        const btnDuplicarOrc = document.getElementById('btn-duplicar');
        const btnCompartilharOrc = document.getElementById('btn-compartilhar');
        const btnVoltarVis = document.getElementById('btn-voltar-vis');

        if (btnEditarOrc) {
            btnEditarOrc.addEventListener('click', () => this.editarOrcamento());
        }
        
        if (btnDuplicarOrc) {
            btnDuplicarOrc.addEventListener('click', () => this.duplicarOrcamento());
        }
        
        if (btnCompartilharOrc) {
            btnCompartilharOrc.addEventListener('click', () => this.mostrarModalCompartilhar());
        }
        
        if (btnVoltarVis) {
            btnVoltarVis.addEventListener('click', () => router.navigateTo('dashboard'));
        }

        // Modal de compartilhamento
        this.setupModalCompartilhar();
    }

    setupModalCompartilhar() {
        const modal = document.getElementById('modal-compartilhar');
        const closeBtn = modal?.querySelector('.modal-close');
        const btnCopiarLink = document.getElementById('btn-copiar-link');
        const btnWhatsapp = document.getElementById('btn-whatsapp');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.fecharModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.fecharModal();
            });
        }

        if (btnCopiarLink) {
            btnCopiarLink.addEventListener('click', () => this.copiarLink());
        }

        if (btnWhatsapp) {
            btnWhatsapp.addEventListener('click', () => this.compartilharWhatsApp());
        }
    }

    loadInitialData() {
        // Carregar configurações ou dados iniciais se necessário
        const stats = storageManager.getEstatisticas();
        console.log('Estatísticas do sistema:', stats);
    }

    // Dashboard
    loadDashboard() {
        this.renderOrcamentos();
    }

    renderOrcamentos(orcamentos = null) {
        const container = document.getElementById('orcamentos-list');
        const emptyState = document.getElementById('empty-state');
        
        if (!container) return;

        const lista = orcamentos || storageManager.getAllOrcamentos();
        const orcamentosOrdenados = storageManager.sortOrcamentos(lista);

        if (orcamentosOrdenados.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = orcamentosOrdenados.map(orcamento => this.createOrcamentoCard(orcamento)).join('');

        // Adicionar event listeners para os cards
        container.querySelectorAll('.orcamento-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.orcamentoId;
                router.navigateTo('orcamento/:id', { id });
            });
        });
    }

    createOrcamentoCard(orcamento) {
        const statusClass = `status-${orcamento.status}`;
        const statusText = Utils.formatStatus(orcamento.status);
        
        return `
            <div class="orcamento-card" data-orcamento-id="${orcamento.id}">
                <div class="orcamento-header">
                    <div class="orcamento-id">#${orcamento.id}</div>
                    <span class="orcamento-status ${statusClass}">${statusText}</span>
                </div>
                <div class="orcamento-cliente">${Utils.sanitizeHtml(orcamento.cliente.nome)}</div>
                <div class="orcamento-info">
                    <div>Criado: ${Utils.formatDate(orcamento.data_criacao)}</div>
                    <div>Itens: ${orcamento.itens.length}</div>
                </div>
                <div class="orcamento-total">${Utils.formatCurrency(orcamento.total)}</div>
            </div>
        `;
    }

    handleSearch(query) {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => {
            const resultados = storageManager.searchOrcamentos(query);
            this.renderOrcamentos(resultados);
        }, 300);
    }

    // Novo/Editar Orçamento
    loadNovoOrcamento(orcamentoData = null) {
        this.currentOrcamento = orcamentoData;
        this.editMode = !!orcamentoData;

        // Limpar formulário
        const form = document.getElementById('form-orcamento');
        if (form) {
            Utils.clearForm(form);
        }

        // Limpar container de itens
        const container = document.getElementById('itens-container');
        if (container) {
            container.innerHTML = '';
        }

        if (orcamentoData) {
            // Modo de edição
            this.preencherFormulario(orcamentoData);
            
            // Atualizar título da página
            const pageHeader = document.querySelector('#novo-orcamento .page-header h2');
            if (pageHeader) {
                pageHeader.textContent = `Editar Orçamento #${orcamentoData.id}`;
            }
        } else {
            // Novo orçamento
            const pageHeader = document.querySelector('#novo-orcamento .page-header h2');
            if (pageHeader) {
                pageHeader.textContent = 'Novo Orçamento';
            }
            
            // Adicionar primeiro item
            this.adicionarItem();
        }

        this.atualizarTotal();
    }

    preencherFormulario(orcamento) {
        // Dados do cliente
        document.getElementById('cliente-nome').value = orcamento.cliente.nome || '';
        document.getElementById('cliente-telefone').value = orcamento.cliente.telefone || '';
        document.getElementById('cliente-email').value = orcamento.cliente.email || '';

        // Informações adicionais
        document.getElementById('prazo').value = orcamento.prazo || '';
        document.getElementById('observacoes').value = orcamento.observacoes || '';

        // Itens
        orcamento.itens.forEach(item => {
            this.adicionarItem(item);
        });
    }

    adicionarItem(itemData = null) {
        const container = document.getElementById('itens-container');
        if (!container) return;

        const itensAtuais = container.querySelectorAll('.item-orcamento');
        const numero = itemData ? itemData.numero : Utils.generateItemNumber(
            Array.from(itensAtuais).map(item => ({
                numero: item.querySelector('.item-numero').textContent.replace('Item ', '')
            }))
        );

        const itemHtml = `
            <div class="item-orcamento">
                <div class="item-header">
                    <span class="item-numero">Item ${numero}</span>
                    <button type="button" class="btn-remover" onclick="app.removerItem(this)">×</button>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Peça/Produto</label>
                        <input type="text" class="item-peca" value="${itemData ? Utils.sanitizeHtml(itemData.peca) : ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Serviço</label>
                        <input type="text" class="item-servico" value="${itemData ? Utils.sanitizeHtml(itemData.servico) : ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Valor (R$)</label>
                        <input type="text" class="item-valor" value="${itemData ? Utils.formatCurrency(itemData.valor).replace('R$ ', '') : ''}" required>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', itemHtml);

        // Adicionar listeners para o novo item
        const novoItem = container.lastElementChild;
        const inputValor = novoItem.querySelector('.item-valor');
        
        inputValor.addEventListener('input', (e) => {
            e.target.value = this.formatarInputValor(e.target.value);
            this.atualizarTotal();
        });

        // Outros inputs também disparam atualização do total
        novoItem.querySelectorAll('.item-peca, .item-servico').forEach(input => {
            input.addEventListener('input', () => this.atualizarTotal());
        });

        this.atualizarTotal();
    }

    removerItem(btnElement) {
        const item = btnElement.closest('.item-orcamento');
        if (item) {
            item.remove();
            this.atualizarTotal();
        }
    }

    formatarInputValor(valor) {
        // Remove tudo que não é número ou vírgula/ponto
        let numeroLimpo = valor.replace(/[^\d,.-]/g, '');
        
        // Converte para formato numérico e depois formata
        numeroLimpo = numeroLimpo.replace(',', '.');
        const numero = parseFloat(numeroLimpo) || 0;
        
        return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    atualizarTotal() {
        const itens = this.coletarItensFormulario();
        const total = Utils.calculateTotal(itens);
        
        const totalDisplay = document.getElementById('total-valor');
        if (totalDisplay) {
            totalDisplay.textContent = Utils.formatCurrency(total);
        }
    }

    coletarItensFormulario() {
        const container = document.getElementById('itens-container');
        if (!container) return [];

        const itensElements = container.querySelectorAll('.item-orcamento');
        const itens = [];

        itensElements.forEach((itemElement, index) => {
            const numero = index + 1;
            const peca = itemElement.querySelector('.item-peca').value.trim();
            const servico = itemElement.querySelector('.item-servico').value.trim();
            const valorText = itemElement.querySelector('.item-valor').value.trim();
            const valor = Utils.parseCurrency(valorText);

            if (peca && servico && valor > 0) {
                itens.push({ numero, peca, servico, valor });
            }
        });

        return itens;
    }

    coletarDadosFormulario() {
        const cliente = {
            nome: document.getElementById('cliente-nome').value.trim(),
            telefone: document.getElementById('cliente-telefone').value.trim(),
            email: document.getElementById('cliente-email').value.trim()
        };

        const itens = this.coletarItensFormulario();
        const total = Utils.calculateTotal(itens);
        const prazo = document.getElementById('prazo').value;
        const observacoes = document.getElementById('observacoes').value.trim();

        return {
            cliente,
            itens,
            total,
            prazo,
            observacoes
        };
    }

    validarFormulario(dados) {
        const errors = [];

        if (!dados.cliente.nome) {
            errors.push('Nome do cliente é obrigatório');
        }

        if (dados.cliente.email && !Utils.isValidEmail(dados.cliente.email)) {
            errors.push('Email inválido');
        }

        if (dados.cliente.telefone && !Utils.isValidPhone(dados.cliente.telefone)) {
            errors.push('Telefone inválido');
        }

        if (dados.itens.length === 0) {
            errors.push('Adicione pelo menos um item ao orçamento');
        }

        if (dados.total <= 0) {
            errors.push('O valor total deve ser maior que zero');
        }

        return errors;
    }

    async handleSubmitOrcamento(event) {
        event.preventDefault();

        const dados = this.coletarDadosFormulario();
        const errors = this.validarFormulario(dados);

        if (errors.length > 0) {
            Utils.showToast(errors[0], 'error');
            return;
        }

        try {
            let orcamento = {
                ...dados,
                status: 'pendente'
            };

            if (this.editMode && this.currentOrcamento) {
                orcamento.id = this.currentOrcamento.id;
            }

            const salvo = storageManager.saveOrcamento(orcamento);
            
            Utils.showToast(
                this.editMode ? 'Orçamento atualizado com sucesso!' : 'Orçamento criado com sucesso!',
                'success'
            );

            setTimeout(() => {
                router.navigateTo('orcamento/:id', { id: salvo.id });
            }, 1000);

        } catch (error) {
            console.error('Erro ao salvar orçamento:', error);
            Utils.showToast('Erro ao salvar orçamento. Tente novamente.', 'error');
        }
    }

    async salvarRascunho() {
        const dados = this.coletarDadosFormulario();
        
        // Validação mínima para rascunho
        if (!dados.cliente.nome) {
            Utils.showToast('Nome do cliente é obrigatório', 'error');
            return;
        }

        try {
            let orcamento = {
                ...dados,
                status: 'rascunho'
            };

            if (this.editMode && this.currentOrcamento) {
                orcamento.id = this.currentOrcamento.id;
            }

            storageManager.saveOrcamento(orcamento);
            Utils.showToast('Rascunho salvo com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao salvar rascunho:', error);
            Utils.showToast('Erro ao salvar rascunho. Tente novamente.', 'error');
        }
    }

    // Visualização de Orçamento
    loadVisualizarOrcamento(orcamento) {
        const container = document.getElementById('orcamento-content');
        if (!container) return;

        const config = storageManager.getConfig();
        const profissional = config.profissional || {};

        container.innerHTML = this.createOrcamentoViewer(orcamento, profissional);
    }

    createOrcamentoViewer(orcamento, profissional) {
        const itensHtml = orcamento.itens.map(item => `
            <tr>
                <td>${item.numero}</td>
                <td>${Utils.sanitizeHtml(item.peca)}</td>
                <td>${Utils.sanitizeHtml(item.servico)}</td>
                <td class="valor-cell">${Utils.formatCurrency(item.valor)}</td>
            </tr>
        `).join('');

        const infoAdicional = [];
        if (orcamento.prazo) {
            infoAdicional.push(`<p><strong>Prazo de Entrega:</strong> ${Utils.formatDate(orcamento.prazo)}</p>`);
        }
        if (orcamento.observacoes) {
            infoAdicional.push(`<p><strong>Observações:</strong> ${Utils.sanitizeHtml(orcamento.observacoes)}</p>`);
        }

        return `
            <h1 class="orcamento-titulo">Orçamento #${orcamento.id}</h1>
            
            <div class="cliente-info">
                <h4>Dados do Cliente</h4>
                <div class="cliente-details">
                    <div><strong>Nome:</strong> ${Utils.sanitizeHtml(orcamento.cliente.nome)}</div>
                    ${orcamento.cliente.telefone ? `<div><strong>Telefone:</strong> ${Utils.formatPhone(orcamento.cliente.telefone)}</div>` : ''}
                    ${orcamento.cliente.email ? `<div><strong>Email:</strong> ${Utils.sanitizeHtml(orcamento.cliente.email)}</div>` : ''}
                    <div><strong>Data:</strong> ${Utils.formatDate(orcamento.data_criacao)}</div>
                </div>
            </div>

            <table class="itens-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Peça/Produto</th>
                        <th>Serviço</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${itensHtml}
                </tbody>
            </table>

            <div class="orcamento-footer">
                <div class="info-adicional">
                    ${infoAdicional.join('')}
                    <div class="profissional-info" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--rosa-suave);">
                        <h5>Contato</h5>
                        <p><strong>${profissional.nome || 'Leah Costura'}</strong></p>
                        ${profissional.telefone ? `<p>${Utils.formatPhone(profissional.telefone)}</p>` : ''}
                        ${profissional.endereco ? `<p>${profissional.endereco}</p>` : ''}
                        ${profissional.email ? `<p>${profissional.email}</p>` : ''}
                    </div>
                </div>
                
                <div class="total-final">
                    <h4>Total Geral</h4>
                    <div class="valor">${Utils.formatCurrency(orcamento.total)}</div>
                </div>
            </div>
        `;
    }

    editarOrcamento() {
        if (this.currentOrcamento) {
            router.navigateTo('editar/:id', { id: this.currentOrcamento.id });
        }
    }

    async duplicarOrcamento() {
        if (!this.currentOrcamento) return;

        const confirmacao = await Utils.confirm(
            'Deseja criar uma cópia deste orçamento?',
            'Duplicar Orçamento'
        );

        if (confirmacao) {
            const duplicado = storageManager.duplicateOrcamento(this.currentOrcamento.id);
            if (duplicado) {
                Utils.showToast('Orçamento duplicado com sucesso!', 'success');
                setTimeout(() => {
                    router.navigateTo('editar/:id', { id: duplicado.id });
                }, 1000);
            } else {
                Utils.showToast('Erro ao duplicar orçamento', 'error');
            }
        }
    }

    mostrarModalCompartilhar() {
        if (!this.currentOrcamento) return;

        const modal = document.getElementById('modal-compartilhar');
        const linkInput = document.getElementById('share-link');
        
        if (modal && linkInput) {
            const link = Utils.generateShareLink(this.currentOrcamento.id);
            linkInput.value = link;
            modal.classList.add('active');
        }
    }

    fecharModal() {
        const modal = document.getElementById('modal-compartilhar');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async copiarLink() {
        const linkInput = document.getElementById('share-link');
        if (linkInput) {
            const sucesso = await Utils.copyToClipboard(linkInput.value);
            if (sucesso) {
                Utils.showToast('Link copiado para a área de transferência!', 'success');
            } else {
                Utils.showToast('Erro ao copiar link', 'error');
            }
        }
    }

    compartilharWhatsApp() {
        if (!this.currentOrcamento) return;

        const config = storageManager.getConfig();
        const profissional = config.profissional || {};
        
        const mensagem = `🌟 *Orçamento #${this.currentOrcamento.id}*\n\n` +
                        `Olá ${this.currentOrcamento.cliente.nome}!\n\n` +
                        `Seu orçamento está pronto. Confira todos os detalhes:\n` +
                        `${Utils.generateShareLink(this.currentOrcamento.id)}\n\n` +
                        `*Total: ${Utils.formatCurrency(this.currentOrcamento.total)}*\n\n` +
                        `Qualquer dúvida, entre em contato!\n\n` +
                        `${profissional.nome || 'Leah Costura'}`;

        const telefone = this.currentOrcamento.cliente.telefone?.replace(/\D/g, '') || '';
        
        if (!telefone) {
            Utils.showToast('Cliente não possui telefone cadastrado', 'error');
            return;
        }

        const whatsappUrl = Utils.generateWhatsAppLink(telefone, mensagem);
        window.open(whatsappUrl, '_blank');
    }

    // Método para ser chamado pelo router quando carregando um orçamento específico
    setCurrentOrcamento(orcamento) {
        this.currentOrcamento = orcamento;
    }
}

// Inicializar aplicação
window.app = new App();