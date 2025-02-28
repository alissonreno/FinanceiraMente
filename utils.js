// Função para formatar valores em moeda brasileira (BRL)
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Função para formatar valores de input de moeda
function formatarInputMoeda(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = (parseFloat(valor) / 100).toFixed(2);
    
    if (isNaN(valor)) {
        valor = '0.00';
    }
    
    input.value = valor.replace('.', ',');
}

// Função para converter valor em string de moeda para número
function converterMoedaParaNumero(valor) {
    if (!valor) return 0;
    
    return parseFloat(valor.replace(/\./g, '').replace(',', '.'));
}

// Formatar data para exibição (DD/MM/YYYY)
function formatarData(dataStr) {
    if (!dataStr) return '';
    
    const data = new Date(dataStr);
    return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}

// Converte data de exibição (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
function converterDataParaISO(dataStr) {
    if (!dataStr) return '';
    
    const partes = dataStr.split('/');
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

// Obter nome do mês com base no número
function obterNomeMes(numeroMes) {
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 
        'Maio', 'Junho', 'Julho', 'Agosto', 
        'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return meses[numeroMes - 1];
}

// Verificar se uma data está vencida
function estaVencida(dataStr) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataVencimento = new Date(dataStr);
    dataVencimento.setHours(0, 0, 0, 0);
    
    return dataVencimento < hoje;
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'success') {
    const notificacao = document.getElementById('notificacao');
    const mensagemEl = document.getElementById('mensagem-notificacao');
    
    mensagemEl.textContent = mensagem;
    
    // Adiciona classes de cor baseado no tipo
    notificacao.className = 'notificacao';
    if (tipo === 'error') {
        notificacao.style.backgroundColor = 'var(--danger-color)';
    } else if (tipo === 'warning') {
        notificacao.style.backgroundColor = 'var(--warning-color)';
        notificacao.style.color = '#333';
    } else {
        notificacao.style.backgroundColor = 'var(--success-color)';
    }
    
    // Mostra a notificação
    notificacao.classList.add('show');
    
    // Oculta depois de 3 segundos
    setTimeout(() => {
        notificacao.classList.remove('show');
    }, 3000);
}

// Exportar para Excel (formato compatível com Power BI)
function exportarExcel(despesas, mes, ano) {
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Transformar dados para o formato padronizado
    const dados = despesas.map(d => ({
        'ID': d.id,
        'Descricao': d.descricao,
        'Categoria': d.categoria.charAt(0).toUpperCase() + d.categoria.slice(1),
        'Tipo': d.tipo === 'mensal' ? 'Mensal' : 'Avulso',
        'Valor': parseFloat(d.valor),
        'DataVencimento': new Date(d.data_vencimento).toISOString().split('T')[0],
        'Status': d.status === 'pago' ? 'Pago' : (estaVencida(d.data_vencimento) ? 'Atrasado' : 'Pendente'),
        'DataPagamento': d.data_pagamento ? new Date(d.data_pagamento).toISOString().split('T')[0] : null,
        'Observacoes': d.observacoes || '',
        'Mes': mes,
        'Ano': ano,
        'MesAno': `${ano}-${String(mes).padStart(2, '0')}`,
        'DataCriacao': d.data_criacao ? new Date(d.data_criacao).toISOString().split('T')[0] : null,
        'Arquivado': d.arquivado ? 'Sim' : 'Não'
    }));
    
    // Adicionar dados dimensionais (para facilitar relações no Power BI)
    const categorias = [
        {CategoriaID: 1, Categoria: 'Moradia'},
        {CategoriaID: 2, Categoria: 'Transporte'},
        {CategoriaID: 3, Categoria: 'Alimentação'},
        {CategoriaID: 4, Categoria: 'Saúde'},
        {CategoriaID: 5, Categoria: 'Educação'},
        {CategoriaID: 6, Categoria: 'Lazer'},
        {CategoriaID: 7, Categoria: 'Serviços'},
        {CategoriaID: 8, Categoria: 'Outros'}
    ];
    
    const tipos = [
        {TipoID: 1, Tipo: 'Mensal'},
        {TipoID: 2, Tipo: 'Avulso'}
    ];
    
    const status = [
        {StatusID: 1, Status: 'Pago'},
        {StatusID: 2, Status: 'Pendente'},
        {StatusID: 3, Status: 'Atrasado'}
    ];
    
    // Criar worksheets
    const wsDespesas = XLSX.utils.json_to_sheet(dados);
    const wsCategorias = XLSX.utils.json_to_sheet(categorias);
    const wsTipos = XLSX.utils.json_to_sheet(tipos);
    const wsStatus = XLSX.utils.json_to_sheet(status);
    
    // Adicionar metadados e formatação
    wsDespesas['!cols'] = [
        {wch: 10}, // ID
        {wch: 30}, // Descricao
        {wch: 15}, // Categoria
        {wch: 10}, // Tipo
        {wch: 12}, // Valor
        {wch: 12}, // DataVencimento
        {wch: 10}, // Status
        {wch: 12}, // DataPagamento
        {wch: 30}, // Observacoes
        {wch: 5},  // Mes
        {wch: 6},  // Ano
        {wch: 8},  // MesAno
        {wch: 12}, // DataCriacao
        {wch: 10}  // Arquivado
    ];
    
    // Adicionar worksheets ao workbook
    XLSX.utils.book_append_sheet(wb, wsDespesas, 'Despesas');
    XLSX.utils.book_append_sheet(wb, wsCategorias, 'Categorias');
    XLSX.utils.book_append_sheet(wb, wsTipos, 'Tipos');
    XLSX.utils.book_append_sheet(wb, wsStatus, 'Status');
    
    // Nome do arquivo
    const nomeArquivo = `ControleFinanceiro_${obterNomeMes(mes)}_${ano}.xlsx`;
    
    // Exportar
    XLSX.writeFile(wb, nomeArquivo);
    
    return nomeArquivo;
}