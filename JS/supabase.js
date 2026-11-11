/* =====================================================
   ESPANHA — SITE OFICIAL
   ARQUIVO: JS/supabase.js
   INTEGRAÇÃO REAL COM O SUPABASE (ONLINE PARA TODOS)
===================================================== */

const SUPABASE_URL = "https://bggxytsmzvixnciffcmq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3qjd1CD2Sx6sYYx7Ul1NAw_xwPcexXB";

let supabaseClient = null;

try {
    if (typeof supabase !== "undefined" && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
        console.log("✅ Conectado ao Supabase online.");
    } else {
        console.warn("⚠️ Supabase SDK não carregado.");
    }
} catch (error) {
    console.error("Erro ao inicializar Supabase:", error);
}

// Estado global
window.appState = {
    isAdmin: false,
    adminName: "",
    presidentName: "Koee_annaa",
    players: [],
    statistics: [],
    seasons: [],
    activities: []
};

/* =====================================================
   1. BUSCAR DADOS DA NUVEM (PARA TODOS OS DISPOSITIVOS)
===================================================== */
window.fetchSupabaseData = async function() {
    try {
        if (!supabaseClient) return;

        // Buscar Presidência
        const { data: configData } = await supabaseClient
            .from('configuracoes')
            .select('*')
            .eq('id', 'config_espanha')
            .single();

        if (configData && configData.nome_presidenta) {
            window.appState.presidentName = configData.nome_presidenta;
        }

        // Buscar Jogadores
        const { data: playersData } = await supabaseClient
            .from('jogadores')
            .select('*')
            .order('created_at', { ascending: true });

        if (playersData) {
            window.appState.players = playersData.map(p => ({
                id: p.id,
                nome: p.nome,
                posicao: p.posicao,
                nacionalidade: p.nacionalidade,
                status: p.status,
                convocado: p.convocado,
                numero: p.numero
            }));
        }

        // Buscar Estatísticas
        const { data: statsData } = await supabaseClient
            .from('estatisticas')
            .select('*');

        if (statsData) {
            window.appState.statistics = statsData.map(s => ({
                playerId: s.player_id,
                partidas: s.partidas,
                gols: s.gols,
                assistencias: s.assistencias,
                cartoes: s.cartoes
            }));
        }

        // Buscar Temporadas
        const { data: seasonsData } = await supabaseClient
            .from('temporadas')
            .select('*')
            .order('created_at', { ascending: true });

        if (seasonsData) {
            window.appState.seasons = seasonsData.map(s => ({
                id: s.id,
                nome: s.nome,
                titulos: s.descricao,
                artilheiro: s.artilheiro,
                gols: s.gols,
                assistente: s.assistente,
                assistencias: s.assistencias,
                descricao: s.observacoes
            }));
        }

        renderAllSections();
    } catch (error) {
        console.error("Erro ao sincronizar com o Supabase:", error);
    }
};

/* =====================================================
   2. FUNÇÕES DE SALVAMENTO NA NUVEM (SUPABASE)
===================================================== */

// Salvar / Atualizar Presidência
window.savePresidentToSupabase = async function(novoNome) {
    window.appState.presidentName = novoNome;
    if (!supabaseClient) return;
    await supabaseClient
        .from('configuracoes')
        update({ nome_presidenta: novoNome, updated_at: new Date() })
        .eq('id', 'config_espanha');
};

// Salvar / Atualizar Jogador
window.savePlayerToSupabase = async function(player) {
    if (!supabaseClient) return;
    await supabaseClient
        .from('jogadores')
        .upsert({
            id: player.id,
            nome: player.nome,
            posicao: player.posicao,
            nacionalidade: player.nacionalidade,
            status: player.status,
            convocado: player.convocado,
            numero: player.numero
        });
};

window.deletePlayerFromSupabase = async function(playerId) {
    if (!supabaseClient) return;
    await supabaseClient.from('jogadores').delete().eq('id', playerId);
};

// Salvar / Atualizar Temporada
window.saveSeasonToSupabase = async function(season) {
    if (!supabaseClient) return;
    await supabaseClient
        .from('temporadas')
        .upsert({
            id: season.id,
            nome: season.nome,
            descricao: season.titulos,
            artilheiro: season.artilheiro,
            gols: season.gols,
            assistente: season.assistente,
            assistencias: season.assistencias,
            observacoes: season.descricao
        });
};

window.deleteSeasonFromSupabase = async function(seasonId) {
    if (!supabaseClient) return;
    await supabaseClient.from('temporadas').delete().eq('id', seasonId);
};

// Salvar Estatística
window.saveStatToSupabase = async function(stat) {
    if (!supabaseClient) return;
    await supabaseClient
        .from('estatisticas')
        .upsert({
            id: 'stat_' + stat.playerId,
            player_id: stat.playerId,
            partidas: stat.partidas,
            gols: stat.gols,
            assistencias: stat.assistencias,
            cartoes: stat.cartoes,
            updated_at: new Date()
        });
};

/* =====================================================
   RENDERIZAÇÃO GERAL
===================================================== */
function renderAllSections() {
    if (typeof window.updatePainelUI === "function") window.updatePainelUI();
    if (typeof window.renderPlayers === "function") window.renderPlayers();
    if (typeof window.renderStatistics === "function") window.renderStatistics();
    if (typeof window.renderSeasons === "function") window.renderSeasons();
    if (typeof window.renderTrophies === "function") window.renderTrophies();
}

/* =====================================================
   AUTENTICAÇÃO EXCLUSIVA (LEMOS)
===================================================== */
window.checkAdminPermission = function(username, password) {
    if (username.trim().toLowerCase() === "lemos") {
        window.appState.isAdmin = true;
        window.appState.adminName = "Lemos";
        document.body.classList.add("admin-authenticated");

        document.getElementById("admin-login-area")?.classList.add("hidden");
        document.getElementById("admin-dashboard")?.classList.remove("hidden");

        if (typeof showToast === "function") showToast("Bem-vindo, Lemos! Modo online ativo.", "success");
        return true;
    } else {
        if (typeof showToast === "function") showToast("Acesso negado. Apenas o Lemos.", "error");
        return false;
    }
};

window.logoutAdmin = function() {
    window.appState.isAdmin = false;
    window.appState.adminName = "";
    document.body.classList.remove("admin-authenticated");

    document.getElementById("admin-login-area")?.classList.remove("hidden");
    document.getElementById("admin-dashboard")?.classList.add("hidden");

    if (typeof showToast === "function") showToast("Sessão encerrada.", "warning");
};

/* =====================================================
   CONVOCAÇÃO (ATÉ 12 COM SINCRONIZAÇÃO ONLINE)
===================================================== */
window.toggleConvocacao = async function(playerId) {
    if (!window.appState.isAdmin) {
        if (typeof showToast === "function") showToast("Apenas o Lemos pode convocar.", "error");
        return;
    }

    const player = window.appState.players.find(p => p.id === playerId);
    if (!player) return;

    if (!player.convocado) {
        const convocados = window.appState.players.filter(p => p.convocado);
        if (convocados.length >= 12) {
            if (typeof showToast === "function") showToast("Limite máximo de 12 convocados atingido!", "warning");
            return;
        }
        player.convocado = true;
        player.numero = convocados.length + 1;
    } else {
        player.convocado = false;
        player.numero = null;

        let n = 1;
        window.appState.players.filter(p => p.convocado).forEach(p => {
            p.numero = n++;
        });
    }

    // Salva na nuvem para atualizar em tempo real nos outros celulares
    await window.savePlayerToSupabase(player);
    for (const p of window.appState.players) {
        await window.savePlayerToSupabase(p);
    }

    renderAllSections();
    if (typeof showToast === "function") {
        showToast(player.convocado ? `${player.nome} convocado!` : `${player.nome} desconvocado.`, "success");
    }
};

// Sincronização automática a cada 10 segundos para ver atualizações de outros aparelhos
setInterval(() => {
    if (!window.appState.isAdmin && typeof window.fetchSupabaseData === "function") {
        window.fetchSupabaseData();
    }
}, 10000);