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

        // Modal de compartilhamento
        this.setupModalCompartilhar();
        
        // Visualização de orçamento - configurar dinamicamente
        this.setupVisualizacaoEventListeners();
    }

    setupVisualizacaoEventListeners() {
        // Remover listeners existentes para evitar duplicação
        if (this.handleVisualizacaoClick) {
            document.removeEventListener('click', this.handleVisualizacaoClick);
        }
        
        // Adicionar listener único para todos os botões de visualização
        this.handleVisualizacaoClick = (e) => {
            console.log('Click detectado em:', e.target.id);
            console.log('this no handleVisualizacaoClick:', this);
            
            if (e.target.id === 'btn-editar') {
                e.preventDefault();
                console.log('Botão editar clicado');
                this.editarOrcamento();
            } else if (e.target.id === 'btn-duplicar') {
                e.preventDefault();
                console.log('Botão duplicar clicado');
                this.duplicarOrcamento();
            } else if (e.target.id === 'btn-excluir') {
                e.preventDefault();
                console.log('Botão excluir clicado');
                this.excluirOrcamento();
            } else if (e.target.id === 'btn-compartilhar') {
                e.preventDefault();
                console.log('Botão compartilhar clicado');
                this.mostrarModalCompartilhar();
            } else if (e.target.id === 'btn-voltar-vis') {
                e.preventDefault();
                console.log('Botão voltar clicado');
                router.navigateTo('dashboard');
            }
        };
        
        document.addEventListener('click', this.handleVisualizacaoClick);
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
        
        // Limpar orçamentos públicos antigos (limpeza automática)
        storageManager.cleanOldPublicOrcamentos();
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

        const valorAlternativo = itemData?.valor_alternativo || null;
        const hasValorAlternativo = !!valorAlternativo;

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
                <div class="form-group">
                    <label>
                        <input type="checkbox" class="tem-valor-alternativo" ${hasValorAlternativo ? 'checked' : ''}> Tem valor alternativo
                    </label>
                </div>
                <div class="valor-alternativo" style="display: ${hasValorAlternativo ? 'block' : 'none'};">
                    <div class="form-group">
                        <label>Valor Alternativo (R$)</label>
                        <input type="text" class="item-valor-alt" value="${valorAlternativo ? Utils.formatCurrency(valorAlternativo.valor).replace('R$ ', '') : ''}" placeholder="Valor opcional">
                    </div>
                    <div class="form-group">
                        <label>Descrição do Valor Alternativo</label>
                        <input type="text" class="item-valor-alt-desc" value="${valorAlternativo?.descricao || ''}" placeholder="Ex: se cliente trouxer tecido">
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', itemHtml);

        // Adicionar listeners para o novo item
        const novoItem = container.lastElementChild;
        const inputValor = novoItem.querySelector('.item-valor');
        const inputValorAlt = novoItem.querySelector('.item-valor-alt');
        const checkboxValorAlt = novoItem.querySelector('.tem-valor-alternativo');
        const divValorAlt = novoItem.querySelector('.valor-alternativo');
        
        inputValor.addEventListener('input', (e) => {
            e.target.value = this.formatarInputValor(e.target.value);
            this.atualizarTotal();
        });

        if (inputValorAlt) {
            inputValorAlt.addEventListener('input', (e) => {
                e.target.value = this.formatarInputValor(e.target.value);
            });
        }

        checkboxValorAlt.addEventListener('change', (e) => {
            divValorAlt.style.display = e.target.checked ? 'block' : 'none';
            if (!e.target.checked) {
                // Limpar campos quando desabilitar
                inputValorAlt.value = '';
                novoItem.querySelector('.item-valor-alt-desc').value = '';
            }
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
                const item = { numero, peca, servico, valor };

                // Verificar se tem valor alternativo
                const temValorAlt = itemElement.querySelector('.tem-valor-alternativo').checked;
                if (temValorAlt) {
                    const valorAltText = itemElement.querySelector('.item-valor-alt').value.trim();
                    const valorAltDesc = itemElement.querySelector('.item-valor-alt-desc').value.trim();
                    
                    if (valorAltText && valorAltDesc) {
                        item.valor_alternativo = {
                            valor: Utils.parseCurrency(valorAltText),
                            descricao: valorAltDesc
                        };
                    }
                }

                itens.push(item);
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

        // Definir orçamento atual para uso nos botões
        this.currentOrcamento = orcamento;
        console.log('loadVisualizarOrcamento - currentOrcamento definido:', this.currentOrcamento);

        const config = storageManager.getConfig();
        const profissional = config.profissional || {};

        container.innerHTML = this.createOrcamentoViewer(orcamento, profissional);

        // Reconfigurar listeners após carregar conteúdo
        this.setupVisualizacaoEventListeners();
        
        // Configurar listeners diretos também (fallback)
        setTimeout(() => {
            const btnEditar = document.getElementById('btn-editar');
            const btnDuplicar = document.getElementById('btn-duplicar');
            const btnExcluir = document.getElementById('btn-excluir');
            const btnCompartilhar = document.getElementById('btn-compartilhar');
            const btnVoltar = document.getElementById('btn-voltar-vis');

            if (btnEditar) {
                btnEditar.onclick = (e) => {
                    e.preventDefault();
                    this.editarOrcamento();
                };
            }
            
            if (btnDuplicar) {
                btnDuplicar.onclick = (e) => {
                    e.preventDefault();
                    this.duplicarOrcamento();
                };
            }
            
            if (btnExcluir) {
                btnExcluir.onclick = (e) => {
                    e.preventDefault();
                    this.excluirOrcamento();
                };
            }
            
            if (btnCompartilhar) {
                btnCompartilhar.onclick = (e) => {
                    e.preventDefault();
                    this.mostrarModalCompartilhar();
                };
            }
            
            if (btnVoltar) {
                btnVoltar.onclick = (e) => {
                    e.preventDefault();
                    router.navigateTo('dashboard');
                };
            }
        }, 100);

        // Mostrar header de ações se necessário
        const pageHeader = document.querySelector('#visualizar-orcamento .page-header');
        if (pageHeader) {
            pageHeader.style.display = 'flex';
        }
    }

    createOrcamentoViewer(orcamento, profissional) {
        // Cabeçalho profissional
        const dataFormatada = Utils.formatDate(orcamento.data_criacao);
        const statusClass = this.getStatusClass(orcamento.status);
        const statusText = this.getStatusText(orcamento.status);
        
        // Calcular total alternativo se houver itens com valores alternativos
        let totalAlternativo = 0;
        let temValorAlternativo = false;
        
        const itensHtml = orcamento.itens.map(item => {
            let servicoText = Utils.sanitizeHtml(item.servico);
            let valorPrincipal = Utils.formatCurrency(item.valor);
            let valorAlternativoHtml = '';

            // Adicionar valor alternativo se existir
            if (item.valor_alternativo) {
                temValorAlternativo = true;
                totalAlternativo += item.valor_alternativo.valor;
                valorAlternativoHtml = `
                    <div class="valor-alternativo">
                        <small class="alt-label">${Utils.sanitizeHtml(item.valor_alternativo.descricao)}:</small>
                        <small class="alt-valor">${Utils.formatCurrency(item.valor_alternativo.valor)}</small>
                    </div>
                `;
            } else {
                totalAlternativo += item.valor;
            }

            return `
                <tr class="item-row">
                    <td class="item-numero">${item.numero}</td>
                    <td class="item-peca">${Utils.sanitizeHtml(item.peca)}</td>
                    <td class="item-servico">
                        <div class="servico-principal">${servicoText}</div>
                        ${valorAlternativoHtml}
                    </td>
                    <td class="valor-cell">
                        <div class="valor-principal">${valorPrincipal}</div>
                        ${item.valor_alternativo ? `<div class="valor-alt-display">${Utils.formatCurrency(item.valor_alternativo.valor)}</div>` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        // Resumo de valores
        const resumoValores = `
            <div class="resumo-valores">
                <div class="resumo-linha">
                    <span>Subtotal (${orcamento.itens.length} ${orcamento.itens.length === 1 ? 'item' : 'itens'}):</span>
                    <span class="valor-subtotal">${Utils.formatCurrency(orcamento.total)}</span>
                </div>
                ${temValorAlternativo ? `
                    <div class="resumo-linha alternativo">
                        <span>Total com valores alternativos:</span>
                        <span class="valor-alternativo-total">${Utils.formatCurrency(totalAlternativo)}</span>
                    </div>
                ` : ''}
                <div class="resumo-linha total-final-linha">
                    <span class="total-label">TOTAL GERAL:</span>
                    <span class="total-valor">${Utils.formatCurrency(orcamento.total)}</span>
                </div>
            </div>
        `;

        // Informações adicionais organizadas
        const infoAdicional = [];
        if (orcamento.prazo) {
            const prazoFormatado = Utils.formatDate(orcamento.prazo);
            const diasRestantes = this.calcularDiasRestantes(orcamento.prazo);
            infoAdicional.push(`
                <div class="info-item">
                    <div class="info-icon">📅</div>
                    <div class="info-content">
                        <strong>Prazo de Entrega:</strong> ${prazoFormatado}
                        ${diasRestantes !== null ? `<small>${diasRestantes}</small>` : ''}
                    </div>
                </div>
            `);
        }
        
        if (orcamento.observacoes) {
            infoAdicional.push(`
                <div class="info-item">
                    <div class="info-icon">📝</div>
                    <div class="info-content">
                        <strong>Observações:</strong><br>
                        <span class="observacoes-text">${Utils.sanitizeHtml(orcamento.observacoes)}</span>
                    </div>
                </div>
            `);
        }

        return `
            <div class="orcamento-completo">
                <!-- Cabeçalho do Orçamento -->
                <div class="orcamento-header">
                    <div class="header-principal">
                        <div class="logo-section">
                            <h1 class="profissional-nome">${profissional?.nome || 'Leah Karina'}</h1>
                            <p class="profissional-subtitulo">Costura Profissional</p>
                        </div>
                        <div class="orcamento-meta">
                            <div class="orcamento-numero">Orçamento #${orcamento.id}</div>
                            <div class="orcamento-data">${dataFormatada}</div>
                            <div class="orcamento-status ${statusClass}">${statusText}</div>
                        </div>
                    </div>
                </div>

                <!-- Dados do Cliente -->
                <div class="cliente-section">
                    <h3 class="section-title">
                        <span class="section-icon">👤</span>
                        Dados do Cliente
                    </h3>
                    <div class="cliente-grid">
                        <div class="cliente-item">
                            <label>Nome Completo:</label>
                            <span>${Utils.sanitizeHtml(orcamento.cliente.nome)}</span>
                        </div>
                        ${orcamento.cliente.telefone ? `
                            <div class="cliente-item">
                                <label>Telefone:</label>
                                <span>${Utils.formatPhone(orcamento.cliente.telefone)}</span>
                            </div>
                        ` : ''}
                        ${orcamento.cliente.email ? `
                            <div class="cliente-item">
                                <label>Email:</label>
                                <span>${Utils.sanitizeHtml(orcamento.cliente.email)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Itens do Orçamento -->
                <div class="itens-section">
                    <h3 class="section-title">
                        <span class="section-icon">📋</span>
                        Itens do Orçamento
                    </h3>
                    <div class="table-container">
                        <table class="itens-table-melhorada">
                            <thead>
                                <tr>
                                    <th class="col-numero">#</th>
                                    <th class="col-peca">Peça/Produto</th>
                                    <th class="col-servico">Descrição do Serviço</th>
                                    <th class="col-valor">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itensHtml}
                            </tbody>
                        </table>
                    </div>
                    ${resumoValores}
                </div>

                <!-- Informações Adicionais -->
                ${infoAdicional.length > 0 ? `
                    <div class="info-section">
                        <h3 class="section-title">
                            <span class="section-icon">ℹ️</span>
                            Informações Adicionais
                        </h3>
                        <div class="info-grid">
                            ${infoAdicional.join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Rodapé Profissional -->
                <div class="orcamento-footer-completo">
                    <div class="contato-section">
                        <h4>Contato Profissional</h4>
                        <div class="contato-info">
                            <div class="contato-item">
                                <strong>${profissional?.nome || 'Leah Karina'}</strong>
                            </div>
                            ${profissional?.telefone ? `
                                <div class="contato-item">
                                    📞 ${Utils.formatPhone(profissional.telefone)}
                                </div>
                            ` : ''}
                            ${profissional?.email ? `
                                <div class="contato-item">
                                    ✉️ ${profissional.email}
                                </div>
                            ` : ''}
                            ${profissional?.endereco ? `
                                <div class="contato-item">
                                    📍 ${profissional.endereco}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="validade-section">
                        <p class="validade-texto">
                            <small>Este orçamento tem validade de 30 dias a partir da data de emissão.</small>
                        </p>
                        <p class="obrigado-texto">
                            Obrigada pela preferência! 💖
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        const statusMap = {
            'pendente': 'status-pendente',
            'aprovado': 'status-aprovado', 
            'rascunho': 'status-rascunho',
            'compartilhado': 'status-compartilhado',
            'concluido': 'status-concluido'
        };
        return statusMap[status] || 'status-pendente';
    }

    getStatusText(status) {
        const statusMap = {
            'pendente': 'Pendente',
            'aprovado': 'Aprovado',
            'rascunho': 'Rascunho', 
            'compartilhado': 'Compartilhado',
            'concluido': 'Concluído'
        };
        return statusMap[status] || 'Pendente';
    }

    calcularDiasRestantes(prazo) {
        if (!prazo) return null;
        const hoje = new Date();
        const dataPrazo = new Date(prazo);
        const diffTime = dataPrazo - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
            return `(faltam ${diffDays} dias)`;
        } else if (diffDays === 1) {
            return '(falta 1 dia)';
        } else if (diffDays === 0) {
            return '(vence hoje)';
        } else {
            return `(atrasado ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'})`;
        }
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

    async excluirOrcamento() {
        console.log('excluirOrcamento chamado');
        console.log('currentOrcamento:', this.currentOrcamento);
        console.log('this no excluirOrcamento:', this);
        
        if (!this.currentOrcamento) {
            Utils.showToast('Nenhum orçamento selecionado', 'error');
            return;
        }

        try {
            const confirmacao = await Utils.confirm(
                `Tem certeza que deseja excluir o orçamento #${this.currentOrcamento.id}?\n\nCliente: ${this.currentOrcamento.cliente.nome}\nValor: ${Utils.formatCurrency(this.currentOrcamento.total)}\n\nEsta ação não pode ser desfeita.`,
                'Excluir Orçamento'
            );

            console.log('Confirmação:', confirmacao);

            if (confirmacao) {
                console.log('Excluindo orçamento:', this.currentOrcamento.id);
                
                const sucesso = storageManager.deleteOrcamento(this.currentOrcamento.id);
                console.log('Resultado da exclusão:', sucesso);
                
                if (sucesso) {
                    Utils.showToast('Orçamento excluído com sucesso!', 'success');
                    
                    // Voltar para dashboard após exclusão
                    setTimeout(() => {
                        router.navigateTo('dashboard');
                    }, 1000);
                } else {
                    Utils.showToast('Erro ao excluir orçamento', 'error');
                }
            }

        } catch (error) {
            console.error('Erro ao excluir orçamento:', error);
            Utils.showToast('Erro ao excluir orçamento. Tente novamente.', 'error');
        }
    }

    async mostrarModalCompartilhar() {
        if (!this.currentOrcamento) return;

        const modal = document.getElementById('modal-compartilhar');
        const linkInput = document.getElementById('share-link');
        
        if (modal && linkInput) {
            linkInput.value = 'Gerando link...';
            modal.classList.add('active');
            
            try {
                const link = await this.gerarLinkCompartilhamento(this.currentOrcamento);
                linkInput.value = link;
            } catch (error) {
                console.error('Erro ao gerar link:', error);
                linkInput.value = 'Erro ao gerar link';
            }
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

    async compartilharWhatsApp() {
        if (!this.currentOrcamento) return;

        const config = storageManager.getConfig();
        const profissional = config.profissional || {};
        
        const telefone = this.currentOrcamento.cliente.telefone?.replace(/\D/g, '') || '';
        
        if (!telefone) {
            Utils.showToast('Cliente não possui telefone cadastrado', 'error');
            return;
        }

        try {
            // Gerar link com await para resolver a Promise
            const linkCompartilhamento = await this.gerarLinkCompartilhamento(this.currentOrcamento);
            
            const mensagem = `🌟 *Orçamento #${this.currentOrcamento.id}*\n\n` +
                            `Olá ${this.currentOrcamento.cliente.nome}!\n\n` +
                            `Seu orçamento está pronto. Confira todos os detalhes:\n` +
                            `${linkCompartilhamento}\n\n` +
                            `*Total: ${Utils.formatCurrency(this.currentOrcamento.total)}*\n\n` +
                            `Qualquer dúvida, entre em contato!\n\n` +
                            `${profissional.nome || 'Leah Karina'}`;

            const whatsappUrl = Utils.generateWhatsAppLink(telefone, mensagem);
            window.open(whatsappUrl, '_blank');
            
        } catch (error) {
            console.error('Erro ao gerar link para WhatsApp:', error);
            Utils.showToast('Erro ao gerar link. Tente novamente.', 'error');
        }
    }

    async gerarLinkCompartilhamento(orcamento) {
        try {
            // Tentar salvar no MongoDB primeiro
            const apiUrl = this.getApiUrl();
            
            const response = await fetch(`${apiUrl}/api/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orcamento)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Orçamento salvo no MongoDB:', result.shortId);
                return result.link;
            } else {
                console.warn('Erro na API, usando fallback local');
                throw new Error('API indisponível');
            }

        } catch (error) {
            console.warn('MongoDB indisponível, usando sistema local:', error);
            
            // Fallback para sistema local
            return this.gerarLinkLocal(orcamento);
        }
    }

    gerarLinkLocal(orcamento) {
        // Sistema local como fallback
        const dadosMinimos = [
            orcamento.id,
            orcamento.cliente.nome,
            orcamento.total,
            orcamento.itens.length,
            orcamento.data_criacao?.split('T')[0] || new Date().toISOString().split('T')[0]
        ];
        
        const dataString = dadosMinimos.join('|');
        const encoded = btoa(encodeURIComponent(dataString))
            .replace(/[+/=]/g, (char) => ({ '+': '-', '/': '_', '=': '' }[char]));
        
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#s/${encoded}`;
    }

    getApiUrl() {
        // Detectar ambiente
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        } else if (window.location.hostname.includes('vercel.app')) {
            return window.location.origin;
        } else if (window.location.hostname.includes('github.io')) {
            return 'https://leah-costura.vercel.app'; // API separada
        }
        return window.location.origin;
    }

    loadOrcamentoCompartilhado(orcamento) {
        // Carregar orçamento compartilhado (sem botões de ação)
        const container = document.getElementById('orcamento-content');
        if (!container) return;

        this.currentOrcamento = orcamento;
        console.log('loadOrcamentoCompartilhado - orçamento carregado:', this.currentOrcamento);

        const config = storageManager.getConfig();
        const profissional = config.profissional || {
            nome: 'Leah Karina',
            telefone: '(11) 95606-1906',
            endereco: 'Tábata, São Paulo'
        };

        // Criar viewer sem botões de ação
        const viewerHtml = this.createOrcamentoViewer(orcamento, profissional);
        container.innerHTML = viewerHtml;

        // Ocultar botões de ação para visualização pública
        const pageHeader = document.querySelector('#visualizar-orcamento .page-header');
        if (pageHeader) {
            pageHeader.style.display = 'none';
        }

        // Adicionar título específico para compartilhamento
        const titleDiv = document.createElement('div');
        titleDiv.className = 'compartilhamento-header';
        titleDiv.style.cssText = 'text-align: center; margin-bottom: 30px; padding: 20px; background: var(--bege-claro); border-radius: var(--border-radius);';
        titleDiv.innerHTML = `
            <h2 style="color: var(--marrom-escuro); margin-bottom: 10px;">Seu Orçamento</h2>
            <p style="color: var(--marrom-escuro); margin: 0;">Orçamento preparado por <strong>Leah Karina</strong></p>
        `;
        
        container.insertBefore(titleDiv, container.firstChild);
    }

    // Método para ser chamado pelo router quando carregando um orçamento específico
    setCurrentOrcamento(orcamento) {
        this.currentOrcamento = orcamento;
    }
}

// Inicializar aplicação
window.app = new App();