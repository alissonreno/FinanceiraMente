let db;
let SQL;
let userPrefix = ''; // Used to isolate user data

// Hash user email for database prefix
function hashUserEmail(email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

async function initDatabase() {
    try {
        // Initialize SQL.js
        const sqlPromise = initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        
        SQL = await sqlPromise;
        
        // Get current user email for data isolation
        const user = JSON.parse(localStorage.getItem('financeApp_user') || '{}');
        if (user.email) {
            // Create a prefix based on user email (hashed)
            userPrefix = hashUserEmail(user.email) + '_';
        }
        
        // Database storage key with user prefix
        const dbKey = userPrefix + 'financeDB';
        
        // Check for existing database in localStorage
        const savedDB = localStorage.getItem(dbKey);
        
        if (savedDB) {
            // Restore database from localStorage
            const dbData = new Uint8Array(JSON.parse(savedDB));
            db = new SQL.Database(dbData);
        } else {
            // Create new database
            db = new SQL.Database();
            createTables();
        }
        
        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error("Error initializing database:", error);
        mostrarNotificacao("Erro ao inicializar o banco de dados. Tente novamente.", "error");
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // No automatic initialization here
    // Database will be initialized after successful login via initializeAppForUser
});

// Salva o banco de dados no localStorage
function saveDatabase() {
    try {
        const data = db.export();
        const buffer = new Uint8Array(data);
        const dbKey = userPrefix + 'financeDB';
        localStorage.setItem(dbKey, JSON.stringify(Array.from(buffer)));
    } catch (error) {
        console.error("Erro ao salvar o banco de dados:", error);
        mostrarNotificacao("Erro ao salvar os dados. Tente novamente.", "error");
    }
}

// Cria as tabelas necessárias no banco de dados
function createTables() {
    try {
        db.run(`
            CREATE TABLE IF NOT EXISTS despesas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                descricao TEXT NOT NULL,
                categoria TEXT NOT NULL,
                tipo TEXT NOT NULL,
                valor REAL NOT NULL,
                data_vencimento TEXT NOT NULL,
                status TEXT NOT NULL,
                data_pagamento TEXT,
                observacoes TEXT,
                mes INTEGER NOT NULL,
                ano INTEGER NOT NULL,
                arquivado INTEGER DEFAULT 0,
                data_criacao TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS meses_arquivados (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mes INTEGER NOT NULL,
                ano INTEGER NOT NULL,
                total REAL NOT NULL,
                quantidade_despesas INTEGER NOT NULL,
                data_arquivamento TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(mes, ano)
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                aprovado INTEGER DEFAULT 0,
                data_criacao TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error("Erro ao criar tabelas:", error);
        return false;
    }
}

// Adiciona uma nova despesa
function adicionarDespesa(despesa) {
    try {
        const stmt = db.prepare(`
            INSERT INTO despesas (
                descricao, categoria, tipo, valor, data_vencimento, 
                status, data_pagamento, observacoes, mes, ano
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            despesa.descricao,
            despesa.categoria,
            despesa.tipo,
            despesa.valor,
            despesa.dataVencimento,
            despesa.status,
            despesa.dataPagamento || null,
            despesa.observacoes || null,
            despesa.mes,
            despesa.ano
        ]);
        
        stmt.free();
        saveDatabase();
        return true;
    } catch (error) {
        console.error("Erro ao adicionar despesa:", error);
        return false;
    }
}

// Atualiza uma despesa existente
function atualizarDespesa(despesa) {
    try {
        const stmt = db.prepare(`
            UPDATE despesas SET 
                descricao = ?, 
                categoria = ?, 
                tipo = ?, 
                valor = ?, 
                data_vencimento = ?, 
                status = ?, 
                data_pagamento = ?, 
                observacoes = ?
            WHERE id = ?
        `);
        
        stmt.run([
            despesa.descricao,
            despesa.categoria,
            despesa.tipo,
            despesa.valor,
            despesa.dataVencimento,
            despesa.status,
            despesa.dataPagamento || null,
            despesa.observacoes || null,
            despesa.id
        ]);
        
        stmt.free();
        saveDatabase();
        return true;
    } catch (error) {
        console.error("Erro ao atualizar despesa:", error);
        return false;
    }
}

// Exclui uma despesa
function excluirDespesa(id) {
    try {
        db.run("DELETE FROM despesas WHERE id = ?", [id]);
        saveDatabase();
        return true;
    } catch (error) {
        console.error("Erro ao excluir despesa:", error);
        return false;
    }
}

// Marca uma despesa como paga
function marcarComoPaga(id, dataPagamento) {
    try {
        db.run(
            "UPDATE despesas SET status = 'pago', data_pagamento = ? WHERE id = ?", 
            [dataPagamento, id]
        );
        saveDatabase();
        return true;
    } catch (error) {
        console.error("Erro ao marcar despesa como paga:", error);
        return false;
    }
}

// Obtém todas as despesas de um determinado mês e ano
function obterDespesasPorPeriodo(mes, ano, filtros = {}) {
    try {
        let query = `
            SELECT * FROM despesas 
            WHERE mes = ? AND ano = ? AND arquivado = 0
        `;
        
        const params = [mes, ano];
        
        if (filtros.tipo && filtros.tipo !== 'todos') {
            query += " AND tipo = ?";
            params.push(filtros.tipo);
        }
        
        if (filtros.status && filtros.status !== 'todos') {
            query += " AND status = ?";
            params.push(filtros.status);
        }
        
        if (filtros.categoria && filtros.categoria !== 'todas') {
            query += " AND categoria = ?";
            params.push(filtros.categoria);
        }
        
        query += " ORDER BY data_vencimento ASC";
        
        const result = db.exec(query, params);
        
        if (result.length === 0) {
            return [];
        }
        
        const columns = result[0].columns;
        const values = result[0].values;
        
        return values.map(row => {
            const despesa = {};
            columns.forEach((column, index) => {
                despesa[column] = row[index];
            });
            return despesa;
        });
    } catch (error) {
        console.error("Erro ao obter despesas:", error);
        return [];
    }
}

// Obtém uma despesa pelo ID
function obterDespesaPorId(id) {
    try {
        const result = db.exec("SELECT * FROM despesas WHERE id = ?", [id]);
        
        if (result.length === 0 || result[0].values.length === 0) {
            return null;
        }
        
        const columns = result[0].columns;
        const values = result[0].values[0];
        
        const despesa = {};
        columns.forEach((column, index) => {
            despesa[column] = values[index];
        });
        
        return despesa;
    } catch (error) {
        console.error("Erro ao obter despesa por ID:", error);
        return null;
    }
}

// Arquiva um mês
function arquivarMes(mes, ano) {
    try {
        // Primeiro obter o total e quantidade de despesas
        const result = db.exec(`
            SELECT COUNT(*) as quantidade, SUM(valor) as total 
            FROM despesas 
            WHERE mes = ? AND ano = ? AND arquivado = 0
        `, [mes, ano]);
        
        if (result.length === 0 || result[0].values.length === 0) {
            return false;
        }
        
        const quantidade = result[0].values[0][0];
        const total = result[0].values[0][1] || 0;
        
        // Verificar se já existe este mês arquivado
        const checkExistente = db.exec(`
            SELECT id FROM meses_arquivados WHERE mes = ? AND ano = ?
        `, [mes, ano]);
        
        // Se já existe, atualizar
        if (checkExistente.length > 0 && checkExistente[0].values.length > 0) {
            db.run(`
                UPDATE meses_arquivados 
                SET total = ?, quantidade_despesas = ?, data_arquivamento = CURRENT_TIMESTAMP
                WHERE mes = ? AND ano = ?
            `, [total, quantidade, mes, ano]);
        } else {
            // Se não existe, inserir
            db.run(`
                INSERT INTO meses_arquivados (mes, ano, total, quantidade_despesas)
                VALUES (?, ?, ?, ?)
            `, [mes, ano, total, quantidade]);
        }
        
        // Marcar as despesas como arquivadas
        db.run(`
            UPDATE despesas SET arquivado = 1 WHERE mes = ? AND ano = ? AND arquivado = 0
        `, [mes, ano]);
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error("Erro ao arquivar mês:", error);
        return false;
    }
}

// Obtém todos os meses arquivados
function obterMesesArquivados() {
    try {
        // Add validation to ensure db is initialized
        if (!db) {
            console.error("Database not initialized");
            return [];
        }

        const result = db.exec(`
            SELECT 
                id,
                mes,
                ano, 
                total,
                quantidade_despesas,
                data_arquivamento
            FROM meses_arquivados 
            ORDER BY ano DESC, mes DESC
        `);
        
        if (!result || result.length === 0) {
            return [];
        }
        
        const columns = result[0].columns;
        const values = result[0].values;
        
        return values.map(row => {
            const mesArquivado = {};
            columns.forEach((column, index) => {
                mesArquivado[column] = row[index];
            });
            return mesArquivado;
        });
    } catch (error) {
        console.error("Erro ao obter meses arquivados:", error);
        return [];
    }
}

// Restaura um mês arquivado
function restaurarMesArquivado(mes, ano) {
    try {
        // Remover o mês da tabela de arquivados
        db.run(`
            DELETE FROM meses_arquivados WHERE mes = ? AND ano = ?
        `, [mes, ano]);
        
        // Desmarcar as despesas como arquivadas
        db.run(`
            UPDATE despesas SET arquivado = 0 WHERE mes = ? AND ano = ?
        `, [mes, ano]);
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error("Erro ao restaurar mês arquivado:", error);
        return false;
    }
}

// Obtém as despesas de um mês arquivado
function obterDespesasMesArquivado(mes, ano) {
    try {
        const result = db.exec(`
            SELECT * FROM despesas 
            WHERE mes = ? AND ano = ? AND arquivado = 1
            ORDER BY data_vencimento ASC
        `, [mes, ano]);
        
        if (result.length === 0) {
            return [];
        }
        
        const columns = result[0].columns;
        const values = result[0].values;
        
        return values.map(row => {
            const despesa = {};
            columns.forEach((column, index) => {
                despesa[column] = row[index];
            });
            return despesa;
        });
    } catch (error) {
        console.error("Erro ao obter despesas do mês arquivado:", error);
        return [];
    }
}

// Obtém os totais para o dashboard
function obterTotaisMes(mes, ano) {
    try {
        // Total mensal
        const totalResult = db.exec(`
            SELECT SUM(valor) FROM despesas
            WHERE mes = ? AND ano = ? AND arquivado = 0
        `, [mes, ano]);
        
        // Total pago
        const pagoResult = db.exec(`
            SELECT SUM(valor) FROM despesas
            WHERE mes = ? AND ano = ? AND status = 'pago' AND arquivado = 0
        `, [mes, ano]);
        
        // Total pendente (não vencido)
        const hoje = new Date().toISOString().split('T')[0];
        const pendenteResult = db.exec(`
            SELECT SUM(valor) FROM despesas
            WHERE mes = ? AND ano = ? AND status = 'pendente' 
            AND data_vencimento >= ? AND arquivado = 0
        `, [mes, ano, hoje]);
        
        // Total atrasado (vencido)
        const atrasadoResult = db.exec(`
            SELECT SUM(valor) FROM despesas
            WHERE mes = ? AND ano = ? AND status = 'pendente' 
            AND data_vencimento < ? AND arquivado = 0
        `, [mes, ano, hoje]);
        
        return {
            total: totalResult[0].values[0][0] || 0,
            pago: pagoResult[0].values[0][0] || 0,
            pendente: pendenteResult[0].values[0][0] || 0,
            atrasado: atrasadoResult[0].values[0][0] || 0
        };
    } catch (error) {
        console.error("Erro ao obter totais do mês:", error);
        return {
            total: 0,
            pago: 0,
            pendente: 0,
            atrasado: 0
        };
    }
}

// Add these new functions for user management
function adicionarUsuario(usuario) {
    try {
        const stmt = db.prepare(`
            INSERT INTO usuarios (nome, email, senha, aprovado)
            VALUES (?, ?, ?, ?)
        `);
        
        stmt.run([
            usuario.nome,
            usuario.email,
            usuario.senha,
            usuario.aprovado ? 1 : 0
        ]);
        
        stmt.free();
        saveDatabase();
        return true;
    } catch (error) {
        console.error("Erro ao adicionar usuário:", error);
        return false;
    }
}

function obterUsuarioPorEmail(email) {
    try {
        const result = db.exec(`
            SELECT * FROM usuarios WHERE email = ?
        `, [email]);
        
        if (result.length === 0 || result[0].values.length === 0) {
            return null;
        }
        
        const columns = result[0].columns;
        const values = result[0].values[0];
        
        const usuario = {};
        columns.forEach((column, index) => {
            usuario[column] = values[index];
        });
        
        return usuario;
    } catch (error) {
        console.error("Erro ao obter usuário:", error);
        return null;
    }
}

function atualizarAprovacaoUsuario(email, aprovado) {
    try {
        db.run(`
            UPDATE usuarios 
            SET aprovado = ? 
            WHERE email = ?
        `, [aprovado ? 1 : 0, email]);
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error("Erro ao atualizar aprovação do usuário:", error);
        return false;
    }
}