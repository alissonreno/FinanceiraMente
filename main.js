// Variáveis globais
let mesAtual;
let anoAtual;
let despesasAtuais = [];
let sidebarCollapsed = false;

// Elementos DOM
const mesSelect = document.getElementById('mes-atual');
const anoSelect = document.getElementById('ano-atual');
const btnCarregarPeriodo = document.getElementById('btn-carregar-periodo');
const btnAdicionarDespesa = document.getElementById('btn-adicionar-despesa');
const btnArquivarMes = document.getElementById('btn-arquivar-mes');
const btnExportarExcel = document.getElementById('btn-exportar-excel');
const formDespesa = document.getElementById('form-despesa');
const filtroTipo = document.getElementById('filtro-tipo');
const filtroStatus = document.getElementById('filtro-status');
const filtroCategoria = document.getElementById('filtro-categoria');
const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');

// Modais
const modalDespesa = document.getElementById('modal-despesa');
const modalConfirmar = document.getElementById('modal-confirmar');
const modalArquivar = document.getElementById('modal-arquivar');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    // Main app initialization is now handled by auth.js
    // after successful login via initializeAppForUser function
    
    // Configura todos os event listeners
    configurarEventListeners();
    
    // Adiciona categorias ao filtro
    preencherCategoriasFiltro();
});

// Preenche o select de anos (10 anos para trás e 5 para frente)
function preencherSelectAnos() {
    const anoAtual = new Date().getFullYear();
    const anoInicial = anoAtual - 10;
    const anoFinal = anoAtual + 5;
    
    // Clear existing options
    anoSelect.innerHTML = '';
    
    for (let ano = anoInicial; ano <= anoFinal; ano++) {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        
        if (ano === anoAtual) {
            option.selected = true;
        }
        
        anoSelect.appendChild(option);
    }
}

// Preenche o select de categorias no filtro
function preencherCategoriasFiltro() {
    const categorias = [
        {value: 'moradia', text: 'Moradia'},
        {value: 'transporte', text: 'Transporte'},
        {value: 'alimentacao', text: 'Alimentação'},
        {value: 'saude', text: 'Saúde'},
        {value: 'educacao', text: 'Educação'},
        {value: 'lazer', text: 'Lazer'},
        {value: 'servicos', text: 'Serviços'},
        {value: 'outros', text: 'Outros'}
    ];
    
    // Clear existing options first
    const defaultOption = filtroCategoria.querySelector('option');
    filtroCategoria.innerHTML = '';
    filtroCategoria.appendChild(defaultOption);
    
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.textContent = cat.text;
        filtroCategoria.appendChild(option);
    });
}

// Configura os event listeners
function configurarEventListeners() {
    // Toggle sidebar
    document.getElementById('toggle-sidebar').addEventListener('click', function() {
        document.body.classList.toggle('sidebar-collapsed');
        sidebarCollapsed = !sidebarCollapsed;
        
        // On mobile, toggle sidebar directly
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar').classList.toggle('active');
        }
    });
    
    // Sidebar navigation - Updated implementation
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            document.querySelectorAll('.sidebar-nav li').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked link's parent
            this.parentNode.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show target section
            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                
                // If clicking on archives section, reload archived data
                if (targetId === 'arquivados-section') {
                    carregarMesesArquivados();
                } else if (targetId === 'dashboard-section') {
                    // Refresh dashboard data if needed
                    atualizarDashboard();
                    updateDashboardCharts(despesasAtuais);
                }
            }
            
            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        });
    });
    
    // Toggle filtros
    document.getElementById('toggle-filtros').addEventListener('click', function() {
        const filtrosContainer = document.getElementById('filtros-container');
        filtrosContainer.style.display = filtrosContainer.style.display === 'none' ? 'flex' : 'none';
    });
    
    // Botões principais
    btnCarregarPeriodo.addEventListener('click', () => {
        const mesSelec = parseInt(mesSelect.value);
        const anoSelec = parseInt(anoSelect.value);
        carregarDadosPeriodo(mesSelec, anoSelec);
    });
    
    btnAdicionarDespesa.addEventListener('click', () => abrirModalDespesa());
    
    btnArquivarMes.addEventListener('click', () => {
        document.getElementById('modal-arquivar').style.display = 'block';
    });
    
    btnExportarExcel.addEventListener('click', () => {
        const nomeArquivo = exportarExcel(despesasAtuais, mesAtual, anoAtual);
        mostrarNotificacao(`Arquivo ${nomeArquivo} exportado com sucesso!`);
    });
    
    // Botões de confirmação arquivar mês
    document.getElementById('btn-confirmar-arquivar').addEventListener('click', () => {
        arquivarMesAtual();
    });
    
    document.getElementById('btn-cancelar-arquivar').addEventListener('click', () => {
        modalArquivar.style.display = 'none';
    });
    
    // Modais
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Fechar modais quando clicar fora
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Formulário de despesa
    formDespesa.addEventListener('submit', function(e) {
        e.preventDefault();
        salvarDespesa();
    });
    
    document.getElementById('btn-cancelar').addEventListener('click', function() {
        modalDespesa.style.display = 'none';
    });
    
    // Tipo de despesa (mensal/avulso)
    document.querySelectorAll('.tab-tipo').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab-tipo').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('despesa-tipo').value = this.getAttribute('data-tipo');
        });
    });
    
    // Status de pagamento
    document.getElementById('despesa-status').addEventListener('change', function() {
        const campoPagamento = document.getElementById('campo-data-pagamento');
        if (this.value === 'pago') {
            campoPagamento.style.display = 'block';
            document.getElementById('despesa-data-pagamento').value = new Date().toISOString().split('T')[0];
        } else {
            campoPagamento.style.display = 'none';
            document.getElementById('despesa-data-pagamento').value = '';
        }
    });
    
    // Formatação de valor
    document.getElementById('despesa-valor').addEventListener('input', function() {
        // Remove tudo que não é número
        let valor = this.value.replace(/\D/g, '');
        
        // Converte para formato de moeda
        if (valor === '') {
            this.value = '';
        } else {
            // Formata como moeda (divide por 100 para obter valor com 2 casas decimais)
            valor = (parseFloat(valor) / 100).toFixed(2);
            this.value = valor.replace('.', ',');
        }
    });
    
    // Filtros
    btnAplicarFiltros.addEventListener('click', aplicarFiltros);
}

// Carregar dados do período selecionado
function carregarDadosPeriodo(mes, ano, manterSecao = false) {
    mesAtual = mes;
    anoAtual = ano;
    
    // Atualiza a interface
    document.getElementById('despesas-body').innerHTML = `
        <tr>
            <td colspan="7" class="empty-state">
                <div class="empty-state-container">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Carregando despesas...</p>
                </div>
            </td>
        </tr>
    `;
    
    // Atualiza o título do período
    document.getElementById('periodo-display').textContent = `${obterNomeMes(mes)} de ${ano}`;
    
    // Carrega as despesas
    setTimeout(() => {
        despesasAtuais = obterDespesasPorPeriodo(mes, ano);
        renderizarDespesas(despesasAtuais);
        
        // Atualiza o dashboard
        atualizarDashboard();
        
        // Atualiza os gráficos
        updateDashboardCharts(despesasAtuais);
        
        // Apenas muda para o dashboard se manterSecao for false
        if (!manterSecao) {
            // Switch to dashboard section
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById('dashboard-section').style.display = 'block';
            
            // Update sidebar navigation
            document.querySelectorAll('.sidebar-nav li').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector('.sidebar-nav li:first-child').classList.add('active');
        }
        
        mostrarNotificacao(`Dados de ${obterNomeMes(mes)} de ${ano} carregados com sucesso.`);
    }, 300);
}

// Renderiza as despesas na tabela
function renderizarDespesas(despesas) {
    const tbody = document.getElementById('despesas-body');
    tbody.innerHTML = '';
    
    if (despesas.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="7" class="empty-state">
                <div class="empty-state-container">
                    <i class="fas fa-search"></i>
                    <p>Nenhuma despesa encontrada para este período.</p>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
        return;
    }
    
    despesas.forEach(despesa => {
        const tr = document.createElement('tr');
        
        // Verifica se está atrasado
        const status = despesa.status === 'pago' ? 'pago' : 
                      (estaVencida(despesa.data_vencimento) ? 'atrasado' : 'pendente');
        
        tr.innerHTML = `
            <td>${despesa.descricao}</td>
            <td>${despesa.categoria.charAt(0).toUpperCase() + despesa.categoria.slice(1)}</td>
            <td>
                <span class="tag tag-${despesa.tipo}">
                    <i class="fas fa-${despesa.tipo === 'mensal' ? 'calendar-alt' : 'receipt'}"></i>
                    ${despesa.tipo === 'mensal' ? 'Mensal' : 'Avulso'}
                </span>
            </td>
            <td>${formatarMoeda(parseFloat(despesa.valor))}</td>
            <td>${formatarData(despesa.data_vencimento)}</td>
            <td>
                <span class="status status-${status}">
                    <i class="fas fa-${status === 'pago' ? 'check-circle' : (status === 'atrasado' ? 'exclamation-circle' : 'clock')}"></i>
                    ${status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
            </td>
            <td class="acoes">
                ${despesa.status !== 'pago' ? 
                  `<button class="btn-acao btn-pagar" data-id="${despesa.id}" title="Marcar como pago">
                      <i class="fas fa-check-circle"></i>
                   </button>` : ''}
                <button class="btn-acao btn-editar" data-id="${despesa.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-acao btn-excluir" data-id="${despesa.id}" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Adiciona event listeners aos botões de ação
    adicionarEventosAcoes();
}

// Adiciona eventos aos botões de ação da tabela
function adicionarEventosAcoes() {
    // Botão Pagar
    document.querySelectorAll('.btn-pagar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            
            document.getElementById('mensagem-confirmar').textContent = 
                "Tem certeza que deseja marcar esta despesa como paga hoje?";
            
            document.getElementById('modal-confirmar').querySelector('.modal-icon i').className = 'fas fa-check-circle';
            document.getElementById('modal-confirmar').querySelector('.modal-icon i').style.color = 'var(--success-color)';
            
            document.getElementById('btn-confirmar-sim').onclick = function() {
                const hoje = new Date().toISOString().split('T')[0];
                if (marcarComoPaga(id, hoje)) {
                    carregarDadosPeriodo(mesAtual, anoAtual, true);
                    mostrarNotificacao("Despesa marcada como paga com sucesso.");
                }
                modalConfirmar.style.display = 'none';
            };
            
            document.getElementById('btn-confirmar-nao').onclick = function() {
                modalConfirmar.style.display = 'none';
            };
            
            modalConfirmar.style.display = 'block';
        });
    });
    
    // Botão Editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            abrirModalDespesa(id);
        });
    });
    
    // Botão Excluir
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            
            document.getElementById('mensagem-confirmar').textContent = 
                "Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.";
            
            document.getElementById('modal-confirmar').querySelector('.modal-icon i').className = 'fas fa-trash';
            document.getElementById('modal-confirmar').querySelector('.modal-icon i').style.color = 'var(--danger-color)';
            
            document.getElementById('btn-confirmar-sim').onclick = function() {
                if (excluirDespesa(id)) {
                    carregarDadosPeriodo(mesAtual, anoAtual, true);
                    mostrarNotificacao("Despesa excluída com sucesso.");
                }
                modalConfirmar.style.display = 'none';
            };
            
            document.getElementById('btn-confirmar-nao').onclick = function() {
                modalConfirmar.style.display = 'none';
            };
            
            modalConfirmar.style.display = 'block';
        });
    });
}

// Abre o modal para adicionar/editar despesa
function abrirModalDespesa(id = null) {
    const modalTitulo = document.getElementById('modal-titulo');
    const form = document.getElementById('form-despesa');
    
    // Limpar o formulário
    form.reset();
    
    if (id) {
        // Modo Edição
        modalTitulo.textContent = 'Editar Despesa';
        
        const despesa = obterDespesaPorId(id);
        if (!despesa) {
            mostrarNotificacao("Despesa não encontrada.", "error");
            return;
        }
        
        // Preencher o formulário
        document.getElementById('despesa-id').value = despesa.id;
        document.getElementById('despesa-descricao').value = despesa.descricao;
        document.getElementById('despesa-categoria').value = despesa.categoria;
        document.getElementById('despesa-tipo').value = despesa.tipo;
        document.getElementById('despesa-valor').value = parseFloat(despesa.valor).toFixed(2).replace('.', ',');
        document.getElementById('despesa-vencimento').value = despesa.data_vencimento;
        document.getElementById('despesa-status').value = despesa.status;
        document.getElementById('despesa-observacoes').value = despesa.observacoes || '';
        
        // Selecionar o tipo correto
        document.querySelectorAll('.tab-tipo').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tipo') === despesa.tipo) {
                tab.classList.add('active');
            }
        });
        
        // Mostrar/esconder campo de data de pagamento
        const campoPagamento = document.getElementById('campo-data-pagamento');
        if (despesa.status === 'pago') {
            campoPagamento.style.display = 'block';
            document.getElementById('despesa-data-pagamento').value = despesa.data_pagamento || '';
        } else {
            campoPagamento.style.display = 'none';
        }
    } else {
        // Modo Adição
        modalTitulo.textContent = 'Adicionar Despesa';
        document.getElementById('despesa-id').value = '';
        document.getElementById('despesa-status').value = 'pendente';
        document.getElementById('campo-data-pagamento').style.display = 'none';
        
        // Data de vencimento padrão para o final do mês
        const ultimoDiaMes = new Date(anoAtual, mesAtual, 0).getDate();
        document.getElementById('despesa-vencimento').value = 
            `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(ultimoDiaMes).padStart(2, '0')}`;
    }
    
    // Exibir o modal
    modalDespesa.style.display = 'block';
}

// Salva a despesa (nova ou editada)
function salvarDespesa() {
    // Obter os valores do formulário
    const id = document.getElementById('despesa-id').value;
    const descricao = document.getElementById('despesa-descricao').value.trim();
    const categoria = document.getElementById('despesa-categoria').value;
    const tipo = document.getElementById('despesa-tipo').value;
    const valorStr = document.getElementById('despesa-valor').value;
    const dataVencimento = document.getElementById('despesa-vencimento').value;
    const status = document.getElementById('despesa-status').value;
    const dataPagamento = document.getElementById('despesa-data-pagamento').value;
    const observacoes = document.getElementById('despesa-observacoes').value.trim();
    
    // Validar campos obrigatórios
    if (!descricao || !categoria || !valorStr || !dataVencimento || !status) {
        mostrarNotificacao("Por favor, preencha todos os campos obrigatórios.", "error");
        return;
    }
    
    // Converte o valor para número
    const valor = converterMoedaParaNumero(valorStr);
    
    // Verifica se o valor é válido
    if (isNaN(valor) || valor <= 0) {
        mostrarNotificacao("Por favor, informe um valor válido.", "error");
        return;
    }
    
    // Preparar objeto de despesa
    const despesa = {
        id: id ? parseInt(id) : null,
        descricao,
        categoria,
        tipo,
        valor,
        dataVencimento,
        status,
        dataPagamento: status === 'pago' ? dataPagamento : null,
        observacoes,
        mes: mesAtual,
        ano: anoAtual
    };
    
    let sucesso = false;
    
    if (id) {
        // Modo edição
        sucesso = atualizarDespesa(despesa);
        if (sucesso) {
            mostrarNotificacao("Despesa atualizada com sucesso!");
        } else {
            mostrarNotificacao("Erro ao atualizar despesa. Tente novamente.", "error");
        }
    } else {
        // Modo adição
        sucesso = adicionarDespesa(despesa);
        if (sucesso) {
            mostrarNotificacao("Despesa adicionada com sucesso!");
        } else {
            mostrarNotificacao("Erro ao adicionar despesa. Tente novamente.", "error");
        }
    }
    
    if (sucesso) {
        // Fechar o modal e recarregar os dados
        modalDespesa.style.display = 'none';
        carregarDadosPeriodo(mesAtual, anoAtual, true);
    }
}

// Atualiza o dashboard com os totais
function atualizarDashboard() {
    const totais = obterTotaisMes(mesAtual, anoAtual);
    
    document.getElementById('valor-total-mensal').textContent = 
        formatarMoeda(totais.total).replace('R$', '').trim();
    
    document.getElementById('valor-total-pago').textContent = 
        formatarMoeda(totais.pago).replace('R$', '').trim();
    
    document.getElementById('valor-total-pendente').textContent = 
        formatarMoeda(totais.pendente).replace('R$', '').trim();
    
    document.getElementById('valor-total-atrasado').textContent = 
        formatarMoeda(totais.atrasado).replace('R$', '').trim();
}

// Carrega os meses arquivados
async function carregarMesesArquivados() {
    try {
        const tbody = document.getElementById('arquivados-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-container">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Carregando meses arquivados...</p>
                    </div>
                </td>
            </tr>
        `;
        
        // Ensure database is initialized
        if (!db) {
            await initDatabase();
        }

        const mesesArquivados = obterMesesArquivados();
        tbody.innerHTML = '';
        
        if (!mesesArquivados || mesesArquivados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-state-container">
                            <i class="fas fa-archive"></i>
                            <p>Nenhum mês arquivado encontrado.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        mesesArquivados.forEach(mes => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${obterNomeMes(mes.mes)}</td>
                <td>${mes.ano}</td>
                <td>${formatarMoeda(parseFloat(mes.total))}</td>
                <td>${mes.quantidade_despesas}</td>
                <td>${formatarData(mes.data_arquivamento)}</td>
                <td class="acoes">
                    <button class="btn-acao btn-restaurar" data-mes="${mes.mes}" data-ano="${mes.ano}" title="Restaurar">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="btn-acao btn-ver" data-mes="${mes.mes}" data-ano="${mes.ano}" title="Ver Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-acao btn-exportar" data-mes="${mes.mes}" data-ano="${mes.ano}" title="Exportar">
                        <i class="fas fa-file-export"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Adiciona event listeners aos botões de ação
        adicionarEventosArquivados();
        
    } catch (error) {
        console.error("Erro ao carregar meses arquivados:", error);
        document.getElementById('arquivados-body').innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-container">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Erro ao carregar meses arquivados. Tente novamente.</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Adiciona eventos aos botões da tabela de arquivados
function adicionarEventosArquivados() {
    document.querySelectorAll('.btn-restaurar').forEach(btn => {
        btn.addEventListener('click', function() {
            const mes = parseInt(this.getAttribute('data-mes'));
            const ano = parseInt(this.getAttribute('data-ano'));
            
            document.getElementById('mensagem-confirmar').textContent = 
                `Tem certeza que deseja restaurar esta despesa?`;
            
            document.getElementById('modal-confirmar').querySelector('.modal-icon i').className = 'fas fa-undo';
            document.getElementById('modal-confirmar').querySelector('.modal-icon i').style.color = 'var(--primary-color)';
            
            document.getElementById('btn-confirmar-sim').onclick = function() {
                if (restaurarMesArquivado(mes, ano)) {
                    carregarMesesArquivados();
                    if (mes === mesAtual && ano === anoAtual) {
                        carregarDadosPeriodo(mesAtual, anoAtual);
                    }
                    mostrarNotificacao("Mês restaurado com sucesso.");
                }
                modalConfirmar.style.display = 'none';
            };
            
            document.getElementById('btn-confirmar-nao').onclick = function() {
                modalConfirmar.style.display = 'none';
            };
            
            modalConfirmar.style.display = 'block';
        });
    });
    
    document.querySelectorAll('.btn-ver').forEach(btn => {
        btn.addEventListener('click', function() {
            const mes = parseInt(this.getAttribute('data-mes'));
            const ano = parseInt(this.getAttribute('data-ano'));
            
            // Atualiza o título do período
            document.getElementById('periodo-display').textContent = `${obterNomeMes(mes)} de ${ano} (Arquivado)`;
            
            // Carrega os dados deste mês arquivado
            const despesas = obterDespesasMesArquivado(mes, ano);
            
            // Atualiza os selects para o mês arquivado
            mesSelect.value = mes;
            anoSelect.value = ano;
            
            // Carrega os dados
            mesAtual = mes;
            anoAtual = ano;
            despesasAtuais = despesas;
            
            // Renderiza as despesas
            renderizarDespesas(despesas);
            
            // Atualiza o dashboard (você pode criar uma função específica para meses arquivados)
            // Como os dados já estão no array de despesas, podemos calcular os totais manualmente
            const totais = {
                total: despesas.reduce((total, d) => total + parseFloat(d.valor), 0),
                pago: despesas.filter(d => d.status === 'pago')
                    .reduce((total, d) => total + parseFloat(d.valor), 0),
                pendente: despesas.filter(d => d.status === 'pendente' && !estaVencida(d.data_vencimento))
                    .reduce((total, d) => total + parseFloat(d.valor), 0),
                atrasado: despesas.filter(d => d.status === 'pendente' && estaVencida(d.data_vencimento))
                    .reduce((total, d) => total + parseFloat(d.valor), 0)
            };
            
            document.getElementById('valor-total-mensal').textContent = 
                formatarMoeda(totais.total).replace('R$', '').trim();
            document.getElementById('valor-total-pago').textContent = 
                formatarMoeda(totais.pago).replace('R$', '').trim();
            document.getElementById('valor-total-pendente').textContent = 
                formatarMoeda(totais.pendente).replace('R$', '').trim();
            document.getElementById('valor-total-atrasado').textContent = 
                formatarMoeda(totais.atrasado).replace('R$', '').trim();
            
            // Atualiza os gráficos
            updateDashboardCharts(despesas);
            
            // Muda para o dashboard
            document.querySelectorAll('.sidebar-nav li').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector('.sidebar-nav li:first-child').classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById('dashboard-section').classList.add('active');
            
            mostrarNotificacao(`Visualizando dados arquivados de ${obterNomeMes(mes)} de ${ano}.`);
        });
    });
    
    document.querySelectorAll('.btn-exportar').forEach(btn => {
        btn.addEventListener('click', function() {
            const mes = parseInt(this.getAttribute('data-mes'));
            const ano = parseInt(this.getAttribute('data-ano'));
            
            // Obtém as despesas deste mês arquivado
            const despesas = obterDespesasMesArquivado(mes, ano);
            
            // Exporta para Excel
            const nomeArquivo = exportarExcel(despesas, mes, ano);
            mostrarNotificacao(`Arquivo ${nomeArquivo} exportado com sucesso!`);
        });
    });
}

// Arquiva o mês atual
function arquivarMesAtual() {
    if (arquivarMes(mesAtual, anoAtual)) {
        modalArquivar.style.display = 'none';
        carregarDadosPeriodo(mesAtual, anoAtual);
        carregarMesesArquivados();
        mostrarNotificacao(`Mês de ${obterNomeMes(mesAtual)} de ${anoAtual} arquivado com sucesso.`);
    } else {
        mostrarNotificacao("Erro ao arquivar mês. Verifique se existem despesas a serem arquivadas.", "error");
    }
}

// Aplica filtros nas despesas
function aplicarFiltros() {
    const tipo = filtroTipo.value;
    const status = filtroStatus.value;
    const categoria = filtroCategoria.value;
    
    // Carrega as despesas com os filtros
    const despesasFiltradas = obterDespesasPorPeriodo(mesAtual, anoAtual, {
        tipo, status, categoria
    });
    
    // Atualiza a lista de despesas atuais
    despesasAtuais = despesasFiltradas;
    
    // Renderiza as despesas filtradas
    renderizarDespesas(despesasFiltradas);
    
    mostrarNotificacao("Filtros aplicados com sucesso.");
}

// Arquiva o mês
function arquivarMes(mes, ano) {
    try {
        // First check if month is already archived
        const checkExistente = db.exec(`
            SELECT id FROM meses_arquivados WHERE mes = ? AND ano = ?
        `, [mes, ano]);
        
        if (checkExistente.length > 0 && checkExistente[0].values.length > 0) {
            mostrarNotificacao("Este mês já está arquivado!", "warning");
            return false;
        }

        // Get total and quantity of expenses
        const result = db.exec(`
            SELECT COUNT(*) as quantidade, SUM(valor) as total 
            FROM despesas 
            WHERE mes = ? AND ano = ? AND arquivado = 0
        `, [mes, ano]);
        
        if (!result || !result[0] || !result[0].values || !result[0].values[0]) {
            mostrarNotificacao("Não há despesas para arquivar neste mês.", "warning");
            return false;
        }
        
        const quantidade = result[0].values[0][0];
        const total = result[0].values[0][1] || 0;
        
        if (quantidade === 0) {
            mostrarNotificacao("Não há despesas para arquivar neste mês.", "warning");
            return false;
        }

        // Insert into archived months
        db.run(`
            INSERT INTO meses_arquivados (mes, ano, total, quantidade_despesas, data_arquivamento)
            VALUES (?, ?, ?, ?, datetime('now'))
        `, [mes, ano, total, quantidade]);
        
        // Mark expenses as archived
        db.run(`
            UPDATE despesas SET arquivado = 1 
            WHERE mes = ? AND ano = ? AND arquivado = 0
        `, [mes, ano]);
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error("Erro ao arquivar mês:", error);
        mostrarNotificacao("Erro ao arquivar mês. Tente novamente.", "error");
        return false;
    }
}

function initializeAppForUser(userEmail) {
    // Initialize database is now called from auth.js
    // Load initial data
    const dataAtual = new Date();
    mesAtual = dataAtual.getMonth() + 1; 
    anoAtual = dataAtual.getFullYear();
    
    preencherSelectAnos();
    mesSelect.value = mesAtual;
    anoSelect.value = anoAtual;
    
    // Load data
    carregarDadosPeriodo(mesAtual, anoAtual);
    carregarMesesArquivados();
}

// Mostrar notificação atualizada
function mostrarNotificacao(mensagem, tipo = 'success') {
    const notificacao = document.getElementById('notificacao');
    const mensagemEl = document.getElementById('mensagem-notificacao');
    const iconEl = document.querySelector('.notificacao-icon i');
    
    mensagemEl.textContent = mensagem;
    
    // Configura o ícone e cor baseado no tipo
    if (tipo === 'error') {
        notificacao.style.borderLeftColor = 'var(--danger-color)';
        iconEl.className = 'fas fa-times-circle';
        iconEl.style.color = 'var(--danger-color)';
    } else if (tipo === 'warning') {
        notificacao.style.borderLeftColor = 'var(--warning-color)';
        iconEl.className = 'fas fa-exclamation-circle';
        iconEl.style.color = 'var(--warning-color)';
    } else {
        notificacao.style.borderLeftColor = 'var(--success-color)';
        iconEl.className = 'fas fa-check-circle';
        iconEl.style.color = 'var(--success-color)';
    }
    
    // Mostra a notificação
    notificacao.classList.add('show');
    
    // Oculta depois de 3 segundos
    setTimeout(() => {
        notificacao.classList.remove('show');
    }, 3000);
}