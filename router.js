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
        // Tentar obter dados da URL primeiro
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const dadosCodificados = urlParams.get('dados');
        
        let orcamento = null;
        
        if (dadosCodificados) {
            try {
                // Decodificar dados da URL
                const dadosJson = decodeURIComponent(atob(dadosCodificados));
                orcamento = JSON.parse(dadosJson);
                console.log('Orçamento carregado da URL:', orcamento);
            } catch (error) {
                console.error('Erro ao decodificar dados da URL:', error);
            }
        }
        
        // Se não conseguir da URL, tentar do storage local
        if (!orcamento) {
            orcamento = window.storageManager.getOrcamento(id);
        }
        
        if (!orcamento) {
            this.showError('Orçamento não disponível. Solicite um novo link à costureira.');
            this.navigateTo('dashboard');
            return;
        }

        // Mostrar página de visualização
        this.showPage('visualizar-orcamento');
        if (window.app && window.app.loadOrcamentoCompartilhado) {
            window.app.loadOrcamentoCompartilhado(orcamento);
        }
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