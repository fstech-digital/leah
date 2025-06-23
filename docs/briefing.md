# Briefing - Sistema de Orçamentos Online para Leah Karina

## 📋 **Resumo Executivo**

Desenvolvimento de uma aplicação web estática para gerenciamento e compartilhamento de orçamentos de costura, permitindo que a profissional Leah Karina crie, visualize e envie orçamentos personalizados para suas clientes através de links únicos.

---

## 🎯 **Objetivo do Projeto**

Criar uma plataforma simples e intuitiva que permita:

- Gerar orçamentos profissionais de forma rápida
- Compartilhar orçamentos via link único
- Manter histórico de orçamentos criados
- Oferecer experiência profissional às clientes

---

## 👥 **Público-Alvo**

### **Usuário Principal**

- **Nome**: Leah Karina
- **Profissão**: Costureira profissional
- **Localização**: Higienópolis, São Paulo
- **Necessidades**:
  - Agilizar processo de orçamentação
  - Apresentar serviços de forma profissional
  - Facilitar comunicação com clientes

### **Usuários Secundários**

- **Clientes**: Mulheres que precisam de ajustes em roupas
- **Perfil**: Variado, desde jovens até idosas
- **Expectativas**: Clareza nos valores e serviços

---

## 💻 **Especificações Técnicas**

### **Stack Tecnológico**

- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Armazenamento**: LocalStorage para dados locais
- **Hospedagem**: GitHub Pages ou Netlify (gratuito)
- **URL**: Sugestão: `leahcostura.github.io` ou `leahkarina.netlify.app`

### **Requisitos Técnicos**

- ✅ Totalmente responsivo (mobile-first)
- ✅ Funcionar offline após primeiro carregamento
- ✅ Sem necessidade de backend/servidor
- ✅ Compatível com todos navegadores modernos
- ✅ Performance otimizada (< 3s carregamento)

---

## 🎨 **Diretrizes de Design**

### **Identidade Visual**

- **Cores Principais**:

  - Rosa Suave: `#f8e5e8` (background)
  - Malva: `#8b5a6f` (títulos)
  - Rosa Médio: `#d68a9c` (destaques)
  - Branco Creme: `#fef9f8` (fundos)

- **Tipografia**:

  - Títulos: Playfair Display (serif elegante)
  - Corpo: Poppins (sans-serif moderna)

- **Estilo**: Feminino, delicado, profissional, confiável

### **Elementos Visuais**

- Ícones relacionados à costura (agulha, linha, tesoura)
- Bordas arredondadas suaves
- Sombras sutis para profundidade
- Gradientes delicados
- Animações suaves nas interações

---

## 📱 **Funcionalidades Principais**

### **1. Página Inicial (Dashboard)**

- Lista de orçamentos criados
- Botão "Novo Orçamento"
- Busca por cliente/data
- Status dos orçamentos (enviado/pendente)

### **2. Criador de Orçamentos**

- **Dados do Cliente**:
  - Nome completo
  - Telefone (opcional)
  - Email (opcional)
- **Itens do Orçamento**:

  - Número do item (automático)
  - Descrição da peça
  - Serviço a ser realizado
  - Valor unitário
  - Botão adicionar/remover item

- **Funcionalidades**:
  - Cálculo automático do total
  - Adicionar observações
  - Definir prazo de entrega
  - Salvar como rascunho

### **3. Visualizador de Orçamento**

- Layout profissional para impressão
- Informações completas do orçamento
- Dados de contato da profissional
- Botões: Editar, Duplicar, Excluir

### **4. Compartilhamento**

- Gerar link único (ex: `site.com/#orc-2025-001`)
- Copiar link com um clique
- QR Code para compartilhamento
- Botão WhatsApp direto

---

## 🔧 **Estrutura de Páginas**

```
index.html
├── Dashboard (lista de orçamentos)
├── /novo-orcamento (formulário)
├── /orcamento/:id (visualização)
└── /orcamento/:id/editar (edição)
```

### **Navegação por Hash (#)**

Como é uma aplicação estática, usar navegação por hash:

- `#dashboard`
- `#novo`
- `#orcamento/2025-001`
- `#editar/2025-001`

---

## 💾 **Estrutura de Dados (LocalStorage)**

```javascript
// Estrutura do Orçamento
{
  id: "2025-001",
  data_criacao: "2025-01-15",
  cliente: {
    nome: "Andrea Klein",
    telefone: "(11) 98765-4321",
    email: "andrea@email.com"
  },
  itens: [
    {
      numero: 1,
      peca: "Vestido Branco Florido",
      servico: "Troca de Botão",
      valor: 15.00
    }
  ],
  total: 867.00,
  prazo: "2025-01-30",
  observacoes: "Cliente vai trazer o tecido",
  status: "enviado",
  link: "https://site.com/#orcamento/2025-001"
}
```

---

## 🚀 **Funcionalidades Extras (Fase 2)**

- **Exportar PDF**: Gerar PDF do orçamento
- **Templates**: Serviços pré-cadastrados
- **Histórico de Preços**: Sugestão baseada em serviços anteriores
- **Relatórios**: Resumo mensal de orçamentos
- **Backup**: Exportar/importar dados

---

## 📊 **Métricas de Sucesso**

- Tempo de criação de orçamento < 5 minutos
- Taxa de conversão de orçamentos > 70%
- Satisfação das clientes > 90%
- Redução de retrabalho em 50%

---

## 🎯 **Entregáveis Esperados**

1. **Arquivos HTML**:

   - `index.html` (aplicação principal)
   - `404.html` (página de erro)

2. **Arquivos CSS**:

   - `styles.css` (estilos principais)
   - `print.css` (estilos para impressão)

3. **Arquivos JavaScript**:

   - `app.js` (lógica principal)
   - `router.js` (navegação)
   - `storage.js` (gerenciamento de dados)
   - `utils.js` (funções auxiliares)

4. **Assets**:

   - `/images` (logo, ícones)
   - `/fonts` (se usar fonts locais)

5. **Documentação**:
   - `README.md` (instruções de uso)
   - Comentários no código

---

## 📅 **Cronograma Sugerido**

### **Fase 1 - MVP (2 semanas)**

- Semana 1: Estrutura base + Criador de orçamentos
- Semana 2: Visualização + Compartilhamento

### **Fase 2 - Melhorias (1 semana)**

- Templates e funcionalidades extras
- Testes e ajustes finais

---

## 🔐 **Considerações de Segurança**

- Dados armazenados apenas localmente
- Sem informações sensíveis na URL
- Validação de entrada de dados
- Sanitização de conteúdo exibido

---

## 📞 **Informações de Contato**

**Cliente**: Leah Karina  
**Telefone**: (11) 95606-1906  
**Localização**: Tábata

---

## 💡 **Observações Importantes**

1. **Simplicidade é fundamental** - Leah precisa conseguir usar sem treinamento extenso
2. **Mobile-first** - Muitas clientes acessarão pelo celular
3. **Aparência profissional** - Transmitir confiança e qualidade
4. **Facilidade de compartilhamento** - WhatsApp é o principal canal

---

## 🎨 **Referências Visuais**

- Layout do orçamento atual (anexado)
- Sites de costura profissional
- Aplicativos de orçamento simples
- Estética feminina e elegante

---

**Este briefing foi preparado para orientar o desenvolvimento de uma solução que atenda perfeitamente as necessidades da Leah, combinando simplicidade, profissionalismo e eficiência.**
