// Sistema de roteamento por hash para SPA
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.defaultRoute = 'dashboard';
        
        // Inicializar o router
        this.init();
    }

    init() {
        // Escutar mudanças no hash
        window.addEventListener('hashchange', () => this.handleRouteChange());
        window.addEventListener('load', () => this.handleRouteChange());
        
        // Registrar rotas
        this.registerRoutes();
    }

    registerRoutes() {
        // Registrar todas as rotas da aplicação
        this.addRoute('dashboard', {
            handler: () => this.showDashboard(),
            title: 'Dashboard - Leah Karina'
        });

        this.addRoute('novo', {
            handler: () => this.showNovoOrcamento(),
            title: 'Novo Orçamento - Leah Karina'
        });

        this.addRoute('orcamento/:id', {
            handler: (params) => this.showOrcamento(params.id),
            title: 'Orçamento - Leah Karina'
        });

        this.addRoute('editar/:id', {
            handler: (params) => this.editOrcamento(params.id),
            title: 'Editar Orçamento - Leah Karina'
        });

        this.addRoute('compartilhado/:id', {
            handler: (params) => this.showOrcamentoCompartilhado(params.id),
            title: 'Orçamento - Leah Karina'
        });

        this.addRoute('ver/:hash', {
            handler: (params) => this.showOrcamentoPorHash(params.hash),
            title: 'Orçamento - Leah Karina'
        });

        this.addRoute('v/:data', {
            handler: (params) => this.showOrcamentoCompacto(params.data),
            title: 'Orçamento - Leah Karina'
        });

        this.addRoute('s/:data', {
            handler: (params) => this.showOrcamentoSimples(params.data),
            title: 'Orçamento - Leah Karina'
        });

        this.addRoute('v/:id', {
            handler: (params) => this.showOrcamentoMongoDB(params.id),
            title: 'Orçamento - Leah Karina'
        });
    }

    addRoute(path, config) {
        this.routes[path] = config;
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1) || this.defaultRoute;
        const route = this.parseRoute(hash);
        
        if (route) {
            this.currentRoute = route;
            this.executeRoute(route);
        } else {
            this.navigateTo(this.defaultRoute);
        }
    }

    parseRoute(hash) {
        // Encontrar rota correspondente
        for (const [path, config] of Object.entries(this.routes)) {
            const params = this.matchRoute(path, hash);
            if (params !== null) {
                return {
                    path,
                    params,
                    config
                };
            }
        }
        return null;
    }

    matchRoute(routePath, currentPath) {
        const routeParts = routePath.split('/');
        const currentParts = currentPath.split('/');

        if (routeParts.length !== currentParts.length) {
            return null;
        }

        const params = {};

        for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const currentPart = currentParts[i];

            if (routePart.startsWith(':')) {
                // Parâmetro dinâmico
                const paramName = routePart.slice(1);
                params[paramName] = decodeURIComponent(currentPart);
            } else if (routePart !== currentPart) {
                // Parte estática não confere
                return null;
            }
        }

        return params;
    }

    executeRoute(route) {
        try {
            // Atualizar título da página
            if (route.config.title) {
                document.title = route.config.title;
            }

            // Executar handler da rota
            if (route.config.handler) {
                route.config.handler(route.params);
            }

            // Atualizar navegação ativa
            this.updateNavigation(route);

        } catch (error) {
            console.error('Erro ao executar rota:', error);
            this.showError('Erro ao carregar página');
        }
    }

    updateNavigation(route) {
        // Atualizar botões de navegação
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => btn.classList.remove('active'));

        // Marcar botão ativo baseado na rota
        const routeBase = route.path.split('/')[0];
        const activeBtn = document.getElementById(`nav-${routeBase}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    navigateTo(path, params = {}) {
        let finalPath = path;

        // Substituir parâmetros na URL
        Object.entries(params).forEach(([key, value]) => {
            finalPath = finalPath.replace(`:${key}`, encodeURIComponent(value));
        });

        window.location.hash = finalPath;
    }

    goBack() {
        window.history.back();
    }

    // Handlers das rotas
    showDashboard() {
        this.showPage('dashboard');
        if (window.app && window.app.loadDashboard) {
            window.app.loadDashboard();
        }
    }

    showNovoOrcamento(orcamentoData = null) {
        this.showPage('novo-orcamento');
        if (window.app && window.app.loadNovoOrcamento) {
            window.app.loadNovoOrcamento(orcamentoData);
        }
    }

    showOrcamento(id) {
        const orcamento = window.storageManager.getOrcamento(id);
        
        if (!orcamento) {
            this.showError('Orçamento não encontrado');
            this.navigateTo('dashboard');
            return;
        }

        this.showPage('visualizar-orcamento');
        if (window.app && window.app.loadVisualizarOrcamento) {
            window.app.loadVisualizarOrcamento(orcamento);
        }
    }

    editOrcamento(id) {
        const orcamento = window.storageManager.getOrcamento(id);
        
        if (!orcamento) {
            this.showError('Orçamento não encontrado');
            this.navigateTo('dashboard');
            return;
        }

        this.navigateTo('novo');
        setTimeout(() => {
            this.showNovoOrcamento(orcamento);
        }, 100);
    }

    showOrcamentoCompartilhado(id) {
        // Método legado - redirecionar para o novo sistema
        console.log('Redirecionando para sistema de hash curto...');
        
        // Tentar encontrar orçamento no storage local
        const orcamento = window.storageManager.getOrcamento(id);
        
        if (orcamento) {
            // Gerar novo hash e redirecionar
            const shortHash = window.storageManager.saveOrcamentoPublico(orcamento);
            this.navigateTo(`ver/${shortHash}`);
            return;
        }

        // Tentar obter dados da URL (compatibilidade com links antigos)
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const dadosCodificados = urlParams.get('dados');
        
        if (dadosCodificados) {
            try {
                const dadosJson = decodeURIComponent(atob(dadosCodificados));
                const orcamentoData = JSON.parse(dadosJson);
                
                // Salvar no sistema novo e redirecionar
                const shortHash = window.storageManager.saveOrcamentoPublico(orcamentoData);
                this.navigateTo(`ver/${shortHash}`);
                return;
            } catch (error) {
                console.error('Erro ao decodificar dados da URL:', error);
            }
        }
        
        this.showError('Orçamento não encontrado. Solicite um novo link.');
        this.navigateTo('dashboard');
    }

    showOrcamentoPorHash(hash) {
        // Buscar orçamento pelo hash curto
        const orcamento = window.storageManager.getOrcamentoPublico(hash);
        
        if (!orcamento) {
            this.showError('Orçamento não encontrado ou expirado. Solicite um novo link.');
            this.navigateTo('dashboard');
            return;
        }

        // Mostrar página de visualização
        this.showPage('visualizar-orcamento');
        if (window.app && window.app.loadOrcamentoCompartilhado) {
            window.app.loadOrcamentoCompartilhado(orcamento);
        }
    }

    showOrcamentoCompacto(encodedData) {
        try {
            // Decodificar dados compactos
            const normalizedData = encodedData.replace(/[-_]/g, (char) => {
                return { '-': '+', '_': '/' }[char];
            });
            
            const paddedData = normalizedData + '='.repeat((4 - normalizedData.length % 4) % 4);
            const jsonString = atob(paddedData);
            const dadosCompactos = JSON.parse(jsonString);
            
            // Converter para formato completo
            const orcamento = {
                id: dadosCompactos.i,
                cliente: {
                    nome: dadosCompactos.c,
                    telefone: dadosCompactos.t,
                    email: dadosCompactos.e
                },
                itens: dadosCompactos.it.map(item => ({
                    numero: item.n,
                    peca: item.p,
                    servico: item.s,
                    valor: item.v,
                    ...(item.va && { valor_alternativo: item.va })
                })),
                total: dadosCompactos.to,
                prazo: dadosCompactos.pr,
                observacoes: dadosCompactos.ob,
                data_criacao: dadosCompactos.dc
            };

            console.log('Orçamento decodificado:', orcamento);

            // Mostrar página de visualização
            this.showPage('visualizar-orcamento');
            if (window.app && window.app.loadOrcamentoCompartilhado) {
                window.app.loadOrcamentoCompartilhado(orcamento);
            }

        } catch (error) {
            console.error('Erro ao decodificar orçamento:', error);
            this.showError('Link inválido ou corrompido. Solicite um novo link.');
            this.navigateTo('dashboard');
        }
    }

    showOrcamentoSimples(encodedData) {
        try {
            // Decodificar dados simples
            const normalizedData = encodedData.replace(/[-_]/g, (char) => {
                return { '-': '+', '_': '/' }[char];
            });
            
            const paddedData = normalizedData + '='.repeat((4 - normalizedData.length % 4) % 4);
            const dataString = decodeURIComponent(atob(paddedData));
            const [id, clienteNome, total, numItens, dataCriacao] = dataString.split('|');
            
            console.log('Dados decodificados:', { id, clienteNome, total, numItens, dataCriacao });

            // Buscar orçamento completo no localStorage (se disponível)
            let orcamentoCompleto = window.storageManager.getOrcamento(id);
            
            if (!orcamentoCompleto) {
                // Criar visualização simplificada
                orcamentoCompleto = {
                    id: id,
                    cliente: { nome: clienteNome },
                    total: parseFloat(total),
                    data_criacao: dataCriacao,
                    itens: [],
                    observacoes: `Este é um resumo do orçamento. Para ver todos os detalhes, entre em contato com Leah Karina.`,
                    status: 'compartilhado'
                };
                
                // Adicionar itens placeholder
                for (let i = 1; i <= parseInt(numItens); i++) {
                    orcamentoCompleto.itens.push({
                        numero: i,
                        peca: `Item ${i}`,
                        servico: 'Detalhes disponíveis com a costureira',
                        valor: 0
                    });
                }
            }

            // Mostrar página de visualização
            this.showPage('visualizar-orcamento');
            if (window.app && window.app.loadOrcamentoCompartilhado) {
                window.app.loadOrcamentoCompartilhado(orcamentoCompleto);
            }

        } catch (error) {
            console.error('Erro ao decodificar orçamento simples:', error);
            this.showError('Link inválido. Solicite um novo link.');
            this.navigateTo('dashboard');
        }
    }

    async showOrcamentoMongoDB(shortId) {
        try {
            // Buscar orçamento no MongoDB
            const apiUrl = this.getApiUrl();
            const response = await fetch(`${apiUrl}/api/get/${shortId}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Orçamento carregado do MongoDB:', result.orcamento);
                
                // Mostrar página de visualização
                this.showPage('visualizar-orcamento');
                if (window.app && window.app.loadOrcamentoCompartilhado) {
                    window.app.loadOrcamentoCompartilhado(result.orcamento);
                }
            } else {
                const error = await response.json();
                if (error.expired) {
                    this.showError('Este orçamento expirou. Solicite um novo link.');
                } else {
                    this.showError('Orçamento não encontrado.');
                }
                this.navigateTo('dashboard');
            }

        } catch (error) {
            console.error('Erro ao buscar orçamento no MongoDB:', error);
            this.showError('Erro ao carregar orçamento. Verifique sua conexão.');
            this.navigateTo('dashboard');
        }
    }

    getApiUrl() {
        // Detectar ambiente (mesmo método do app.js)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        } else if (window.location.hostname.includes('vercel.app')) {
            return window.location.origin;
        } else if (window.location.hostname.includes('github.io')) {
            return 'https://leah-costura.vercel.app';
        }
        return window.location.origin;
    }

    showPage(pageId) {
        // Ocultar todas as páginas
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
        });

        // Mostrar página específica
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Scroll para o topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    showError(message) {
        if (window.Utils) {
            window.Utils.showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    // Utilitários
    getCurrentRoute() {
        return this.currentRoute;
    }

    getCurrentParams() {
        return this.currentRoute ? this.currentRoute.params : {};
    }

    isCurrentRoute(path) {
        return this.currentRoute && this.currentRoute.path === path;
    }

    // Middleware para autenticação (se necessário no futuro)
    addMiddleware(routePath, middleware) {
        const route = this.routes[routePath];
        if (route) {
            const originalHandler = route.handler;
            route.handler = (params) => {
                const proceed = middleware(params);
                if (proceed) {
                    originalHandler(params);
                }
            };
        }
    }

    // Link programático
    createLink(path, params = {}) {
        let finalPath = path;

        Object.entries(params).forEach(([key, value]) => {
            finalPath = finalPath.replace(`:${key}`, encodeURIComponent(value));
        });

        return `#${finalPath}`;
    }

    // Verificar se uma rota existe
    routeExists(path) {
        return this.parseRoute(path) !== null;
    }
}

// Inicializar router globalmente
window.router = new Router();