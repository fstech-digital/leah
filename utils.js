// Funções utilitárias para o sistema

class Utils {
    // Formatação de moeda
    static formatCurrency(value) {
        const number = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(number);
    }

    // Parse de moeda (remove formatação)
    static parseCurrency(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        
        return parseFloat(
            value.toString()
                .replace(/[^\d,-]/g, '')
                .replace(',', '.')
        ) || 0;
    }

    // Formatação de data
    static formatDate(date, includeTime = false) {
        if (!date) return '';
        
        const d = new Date(date);
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return d.toLocaleDateString('pt-BR', options);
    }

    // Formatação de telefone
    static formatPhone(phone) {
        if (!phone) return '';
        
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        
        return phone;
    }

    // Validação de email
    static isValidEmail(email) {
        if (!email) return true; // Email é opcional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validação de telefone
    static isValidPhone(phone) {
        if (!phone) return true; // Telefone é opcional
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    }

    // Gerar link único do orçamento
    static generateShareLink(orcamentoId) {
        const baseUrl = window.location.origin + window.location.pathname;
        // Usar uma rota especial para compartilhamento público
        return `${baseUrl}#compartilhado/${orcamentoId}`;
    }

    // Copiar texto para clipboard
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback para navegadores mais antigos
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const result = document.execCommand('copy');
                document.body.removeChild(textArea);
                return result;
            }
        } catch (error) {
            console.error('Erro ao copiar texto:', error);
            return false;
        }
    }

    // Gerar link do WhatsApp
    static generateWhatsAppLink(phone, message) {
        const cleanPhone = phone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
    }

    // Debounce para buscas
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Sanitizar HTML
    static sanitizeHtml(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Validar formulário
    static validateForm(formData, rules) {
        const errors = {};

        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field];

            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = 'Este campo é obrigatório';
                continue;
            }

            if (value && rule.minLength && value.length < rule.minLength) {
                errors[field] = `Mínimo de ${rule.minLength} caracteres`;
                continue;
            }

            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors[field] = `Máximo de ${rule.maxLength} caracteres`;
                continue;
            }

            if (value && rule.pattern && !rule.pattern.test(value)) {
                errors[field] = rule.message || 'Formato inválido';
                continue;
            }

            if (value && rule.custom && !rule.custom(value)) {
                errors[field] = rule.message || 'Valor inválido';
                continue;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    // Mostrar notificação toast
    static showToast(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Estilos inline para o toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#ffc107',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            zIndex: '10000',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
            maxWidth: '300px',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        document.body.appendChild(toast);
        
        // Animação de entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Remover após duração especificada
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // Confirmar ação
    static async confirm(message, title = 'Confirmação') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${Utils.sanitizeHtml(title)}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${Utils.sanitizeHtml(message)}</p>
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                            <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
                            <button class="btn btn-primary" id="confirm-ok">Confirmar</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const handleClose = (result) => {
                document.body.removeChild(modal);
                resolve(result);
            };

            modal.querySelector('#confirm-ok').onclick = () => handleClose(true);
            modal.querySelector('#confirm-cancel').onclick = () => handleClose(false);
            modal.onclick = (e) => {
                if (e.target === modal) handleClose(false);
            };
        });
    }

    // Scroll suave para elemento
    static scrollToElement(element, offset = 0) {
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }

    // Detectar dispositivo móvel
    static isMobile() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Calcular total de itens
    static calculateTotal(itens) {
        if (!Array.isArray(itens)) return 0;
        
        return itens.reduce((total, item) => {
            const valor = this.parseCurrency(item.valor);
            return total + valor;
        }, 0);
    }

    // Gerar número do item
    static generateItemNumber(itens) {
        if (!Array.isArray(itens)) return 1;
        
        const maxNumber = itens.reduce((max, item) => {
            const numero = parseInt(item.numero) || 0;
            return Math.max(max, numero);
        }, 0);
        
        return maxNumber + 1;
    }

    // Formatar status para exibição
    static formatStatus(status) {
        const statusMap = {
            'pendente': 'Pendente',
            'enviado': 'Enviado',
            'rascunho': 'Rascunho',
            'aceito': 'Aceito',
            'rejeitado': 'Rejeitado'
        };
        
        return statusMap[status] || status;
    }

    // Exportar orçamento como texto
    static exportOrcamentoText(orcamento) {
        const config = window.storageManager.getConfig();
        const profissional = config.profissional || {};
        
        let texto = `ORÇAMENTO #${orcamento.id}\n`;
        texto += `Data: ${this.formatDate(orcamento.data_criacao)}\n\n`;
        
        texto += `CLIENTE:\n`;
        texto += `${orcamento.cliente.nome}\n`;
        if (orcamento.cliente.telefone) {
            texto += `Tel: ${this.formatPhone(orcamento.cliente.telefone)}\n`;
        }
        if (orcamento.cliente.email) {
            texto += `Email: ${orcamento.cliente.email}\n`;
        }
        
        texto += `\nITENS:\n`;
        orcamento.itens.forEach((item, index) => {
            texto += `${index + 1}. ${item.peca} - ${item.servico}: ${this.formatCurrency(item.valor)}\n`;
        });
        
        texto += `\nTOTAL: ${this.formatCurrency(orcamento.total)}\n`;
        
        if (orcamento.prazo) {
            texto += `Prazo: ${this.formatDate(orcamento.prazo)}\n`;
        }
        
        if (orcamento.observacoes) {
            texto += `\nObservações: ${orcamento.observacoes}\n`;
        }
        
        texto += `\n---\n`;
        texto += `${profissional.nome || 'Leah Karina'}\n`;
        if (profissional.telefone) {
            texto += `${this.formatPhone(profissional.telefone)}\n`;
        }
        if (profissional.endereco) {
            texto += `${profissional.endereco}\n`;
        }
        
        return texto;
    }

    // Download de arquivo
    static downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    // Limpar campos do formulário
    static clearForm(formElement) {
        const inputs = formElement.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    }

    // Preencher formulário com dados
    static fillForm(formElement, data) {
        Object.entries(data).forEach(([key, value]) => {
            const input = formElement.querySelector(`[name="${key}"], #${key}`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = !!value;
                } else if (input.type === 'radio') {
                    const radioInput = formElement.querySelector(`[name="${key}"][value="${value}"]`);
                    if (radioInput) radioInput.checked = true;
                } else {
                    input.value = value || '';
                }
            }
        });
    }
}

// Disponibilizar globalmente
window.Utils = Utils;