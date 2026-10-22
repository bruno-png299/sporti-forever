/* =========================================================
SISTEMA DE DOAÇÕES DA SPORTZONE
========================================================= */

/*
Esta constante guarda o nome que será utilizado
para salvar os dados no localStorage.

É como se fosse o "nome da gaveta" onde o navegador
irá guardar nossas informações.
*/
const CHAVE_STORAGE = "sportzone_doacoes";

/*
Pegamos o formulário através do seu id.

No nosso HTML temos:

<form id="formulario"> */ const formulario = document.getElementById("formulario");
/*
Pegamos a div onde os cards serão exibidos.

No HTML temos:

<div id="lista"> */ const lista = document.getElementById("lista");
/* =========================================================
FUNÇÃO: PEGAR OS REGISTROS
========================================================= */

/*
Esta função lê os dados que estão no localStorage.

O localStorage só consegue guardar textos.
Por isso utilizamos JSON.parse() para transformar
o texto novamente em um array JavaScript.
*/
function carregarRegistros() {

// Procura os dados utilizando a chave definida acima.
const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);


/*
   Se não existir nenhum dado salvo, retornamos
   um array vazio.

   [] significa uma lista vazia.
*/
if (!dadosSalvos) {
    return [];
}


/*
   JSON.parse() transforma o texto salvo no navegador
   novamente em uma estrutura que o JavaScript consegue usar.
*/
return JSON.parse(dadosSalvos).map(function(registro) {
    if (!registro.status) registro.status = "aprovado";
    return registro;
});

}

/* =========================================================
FUNÇÃO: SALVAR OS REGISTROS
========================================================= */

/*
Recebe um array de registros e salva no localStorage.
*/
function salvarRegistros(registros) {

/*
   JSON.stringify() transforma o array JavaScript
   em texto para que o localStorage consiga armazená-lo.
*/
localStorage.setItem(
    CHAVE_STORAGE,
    JSON.stringify(registros)
);

}

/* =========================================================
FUNÇÃO: MOSTRAR OS REGISTROS
========================================================= */

/*
Esta função é responsável por mostrar os registros
cadastrados dentro da div #lista.
*/
function criarGaleriaImagens(imagens, classeExtra = "") {
    if (!Array.isArray(imagens) || imagens.length === 0) return null;

    const galeria = document.createElement("div");
    galeria.className = `imagens-produto ${classeExtra}`.trim();

    imagens.forEach(function(src, indice) {
        const imagem = document.createElement("img");
        imagem.src = src;
        imagem.alt = `Foto ${indice + 1} do produto`;
        imagem.loading = "lazy";
        galeria.appendChild(imagem);
    });

    return galeria;
}

function comprimirImagem(arquivo) {
    return new Promise(function(resolve, reject) {
        const leitor = new FileReader();
        leitor.onload = function() {
            const imagem = new Image();
            imagem.onload = function() {
                const limite = 1200;
                const escala = Math.min(1, limite / Math.max(imagem.width, imagem.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(imagem.width * escala));
                canvas.height = Math.max(1, Math.round(imagem.height * escala));

                const contexto = canvas.getContext("2d");
                contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL("image/jpeg", 0.78));
            };
            imagem.onerror = function() { reject(new Error("Imagem inválida.")); };
            imagem.src = leitor.result;
        };
        leitor.onerror = function() { reject(new Error("Não foi possível ler a imagem.")); };
        leitor.readAsDataURL(arquivo);
    });
}

function mostrarRegistros() {
    const registros = carregarRegistros();
    lista.innerHTML = "";
    const sessao = obterSessao();

    const publicos = registros.filter(function(registro) {
        return registro.status === "aprovado";
    });

    const meusPendentes = sessao && !sessao.admin
        ? registros.filter(function(registro) {
            return registro.doadorEmail === sessao.email && registro.status !== "aprovado";
        })
        : [];

    if (meusPendentes.length > 0) {
        meusPendentes.forEach(function(registro) {
            const aviso = document.createElement("div");
            aviso.classList.add("aviso-analise");
            aviso.innerHTML = `<strong>${escapeHtml(registro.titulo)}</strong><br>Sua doação está sendo analisada por um administrador. Ela ficará visível no site somente após a aprovação.`;
            lista.appendChild(aviso);
        });
    }

    if (publicos.length === 0) {
        const mensagem = document.createElement("p");
        mensagem.textContent = meusPendentes.length > 0
            ? "Ainda não há produtos aprovados para exibir no site."
            : "Nenhum produto disponível no momento.";
        lista.appendChild(mensagem);
        atualizarPainelAdmin();
        return;
    }

    publicos.forEach(function(registro) {
        const card = document.createElement("article");
        card.classList.add("card-produto");

        const titulo = document.createElement("h3");
        titulo.textContent = registro.titulo;

        const categoria = document.createElement("p");
        categoria.textContent = "Categoria: " + registro.categoria;

        const doador = document.createElement("p");
        doador.textContent = "Doador: " + (registro.doadorNome || "Não informado");

        const contato = document.createElement("p");
        contato.textContent = "Entre em contato com o anunciante pelo chat da SportZone.";

        const localizacao = document.createElement("p");
        localizacao.textContent = "Localização: " + (registro.doadorCidade && registro.doadorEstado ? registro.doadorCidade + " - " + registro.doadorEstado : "Não informada");

        const descricao = document.createElement("p");
        descricao.textContent = registro.descricao;

        const galeria = criarGaleriaImagens(registro.imagens);
        if (galeria) card.appendChild(galeria);

        card.appendChild(titulo);
        card.appendChild(categoria);
        card.appendChild(doador);
        card.appendChild(contato);
        card.appendChild(localizacao);
        card.appendChild(descricao);

        const sessaoAtual = obterSessao();
        if (sessaoAtual && !sessaoAtual.admin && sessaoAtual.email !== (registro.doadorEmail || "").toLowerCase()) {
            const botaoConversar = document.createElement("button");
            botaoConversar.type = "button";
            botaoConversar.className = "botao-chat-anuncio";
            botaoConversar.innerHTML = '<img src="imagens/icone-chat.svg" alt="" class="icone-botao-chat">';
            botaoConversar.setAttribute("aria-label", "Conversar com anunciante");
            botaoConversar.title = "Conversar com anunciante";
            botaoConversar.addEventListener("click", function() { abrirConversa(registro); });
            card.appendChild(botaoConversar);
        } else if (!sessaoAtual) {
            const botaoConversar = document.createElement("button");
            botaoConversar.type = "button";
            botaoConversar.className = "botao-chat-anuncio";
            botaoConversar.innerHTML = '<img src="imagens/icone-chat.svg" alt="" class="icone-botao-chat">';
            botaoConversar.setAttribute("aria-label", "Entre para conversar");
            botaoConversar.title = "Entre para conversar";
            botaoConversar.addEventListener("click", function() {
                sessionStorage.setItem("sportzone_chat_pendente", registro.id);
                abrirLogin();
            });
            card.appendChild(botaoConversar);
        }

        const sessaoAtualAtual = obterSessao();
        const emailDoador = (registro.doadorEmail || "").trim().toLowerCase();
        const emailSessao = (sessaoAtualAtual && sessaoAtualAtual.email ? sessaoAtualAtual.email : "").trim().toLowerCase();
        const podeRemover = !!sessaoAtualAtual && registro.status === "aprovado" &&
            (sessaoAtualAtual.admin || (emailDoador && emailDoador === emailSessao));

        if (podeRemover) {
            const botaoRemover = document.createElement("button");
            botaoRemover.type = "button";
            botaoRemover.className = "botao-remover-doacao";
            botaoRemover.textContent = sessaoAtualAtual.admin ? "Remover doação" : "Remover minha doação";
            botaoRemover.addEventListener("click", function() {
                removerDoacao(registro.id);
            });
            card.appendChild(botaoRemover);
        }

        lista.appendChild(card);
    });

    atualizarPainelAdmin();
}

function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto || "";
    return div.innerHTML;
}

/* =========================================================
FUNÇÃO: EXCLUIR REGISTRO
========================================================= */

/*
Recebe o índice do registro que deverá ser excluído.
*/
function removerDoacao(id) {
    const registros = carregarRegistros();
    const sessao = obterSessao();
    const indice = registros.findIndex(function(registro) { return registro.id === id; });

    if (indice < 0 || !sessao) return;

    const registro = registros[indice];
    const permitido = sessao.admin || (registro.status === "aprovado" && normalizarEmail(registro.doadorEmail) === normalizarEmail(sessao.email));
    if (!permitido) return;

    mostrarConfirmacaoRemocao(registro.titulo, function() {
        const registrosAtualizados = carregarRegistros();
        const indiceAtualizado = registrosAtualizados.findIndex(function(item) { return item.id === id; });
        if (indiceAtualizado < 0) return;

        registrosAtualizados.splice(indiceAtualizado, 1);
        salvarRegistros(registrosAtualizados);
        window.location.reload();
    });
}

function excluirRegistro(indice) {
    const registros = carregarRegistros();
    if (!registros[indice]) return;
    removerDoacao(registros[indice].id);
}

/* =========================================================
EVENTO DO FORMULÁRIO
========================================================= */

/*
O evento "submit" acontece quando o usuário
envia o formulário.
*/
const campoImagensDoacao = document.getElementById("imagensDoacao");
const previewImagensDoacao = document.getElementById("previewImagensDoacao");

function mostrarPreviewImagens(arquivos) {
    if (!previewImagensDoacao) return;
    previewImagensDoacao.innerHTML = "";

    arquivos.forEach(function(arquivo, indice) {
        const item = document.createElement("div");
        item.className = "preview-imagem-item";

        const imagem = document.createElement("img");
        imagem.alt = `Prévia da imagem ${indice + 1}`;
        imagem.src = URL.createObjectURL(arquivo);
        imagem.onload = function() { URL.revokeObjectURL(imagem.src); };

        const nome = document.createElement("span");
        nome.textContent = arquivo.name;

        item.appendChild(imagem);
        item.appendChild(nome);
        previewImagensDoacao.appendChild(item);
    });
}

if (campoImagensDoacao) {
    campoImagensDoacao.addEventListener("change", function() {
        const arquivos = Array.from(campoImagensDoacao.files || []);
        mostrarPreviewImagens(arquivos.slice(0, 3));
    });
}

formulario.addEventListener("submit", async function(event) {
    event.preventDefault();

    const sessao = obterSessao();

    if (!sessao) {
        mostrarMensagem(
            "Entre para fazer uma doação",
            "Para oferecer um produto, primeiro entre na sua conta ou crie uma conta gratuita.",
            "DOAÇÃO",
            "erro",
            "Ir para o login"
        );
        botaoMensagem.onclick = function() { fecharMensagemModal(); abrirLogin(); };
        return;
    }

    if (sessao.admin) {
        mostrarMensagem(
            "Acesso de administrador",
            "A conta de administrador é usada para analisar e aprovar doações. Ela não pode cadastrar produtos.",
            "ADMINISTRADOR",
            "erro"
        );
        return;
    }

    const usuario = carregarUsuarios().find(function(item) {
        return item.email === sessao.email;
    });

    if (!usuario) {
        sessionStorage.removeItem(CHAVE_SESSAO);
        atualizarSessao();
        mostrarMensagem(
            "Sessão expirada",
            "Não encontramos sua conta nesta sessão. Entre novamente para continuar com a doação.",
            "DOAÇÃO",
            "erro",
            "Entrar novamente"
        );
        botaoMensagem.onclick = function() { fecharMensagemModal(); abrirLogin(); };
        return;
    }

    const titulo = document.getElementById("titulo").value.trim();
    const categoria = document.getElementById("categoria").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const arquivos = Array.from(campoImagensDoacao.files || []);

    if (!titulo || titulo.length < 3) {
        mostrarMensagem("Campo incompleto", "Informe o nome do produto com pelo menos 3 caracteres.", "DOAÇÃO", "erro");
        document.getElementById("titulo").focus();
        return;
    }

    if (!categoria) {
        mostrarMensagem("Categoria obrigatória", "Selecione uma categoria para a doação.", "DOAÇÃO", "erro");
        document.getElementById("categoria").focus();
        return;
    }

    if (!descricao || descricao.length < 10) {
        mostrarMensagem("Descrição incompleta", "Descreva o produto com pelo menos 10 caracteres.", "DOAÇÃO", "erro");
        document.getElementById("descricao").focus();
        return;
    }

    if (arquivos.length < 1) {
        mostrarMensagem(
            "Foto obrigatória",
            "Anexe pelo menos uma imagem do produto antes de enviar a doação.",
            "DOAÇÃO",
            "erro"
        );
        return;
    }

    if (arquivos.length > 3) {
        mostrarMensagem(
            "Limite de imagens",
            "Você pode anexar no máximo 3 imagens por doação.",
            "DOAÇÃO",
            "erro"
        );
        return;
    }

    const formatosPermitidos = ["image/jpeg", "image/png", "image/webp"];
    if (arquivos.some(function(arquivo) { return !formatosPermitidos.includes(arquivo.type); })) {
        mostrarMensagem(
            "Formato inválido",
            "Use somente imagens JPG, PNG ou WebP.",
            "DOAÇÃO",
            "erro"
        );
        return;
    }

    let imagens;
    try {
        imagens = await Promise.all(arquivos.map(comprimirImagem));
    } catch (erro) {
        console.error(erro);
        mostrarMensagem(
            "Não foi possível anexar as imagens",
            "Verifique os arquivos escolhidos e tente novamente.",
            "DOAÇÃO",
            "erro"
        );
        return;
    }

    const novoRegistro = {
        id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : `doacao-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        titulo: titulo,
        categoria: categoria,
        doadorNome: usuario.nome,
        doadorTelefone: usuario.telefone,
        doadorEmail: usuario.email,
        doadorCep: usuario.cep,
        doadorLogradouro: usuario.logradouro,
        doadorComplemento: usuario.complemento,
        doadorUnidade: usuario.unidade,
        doadorBairro: usuario.bairro,
        doadorCidade: usuario.cidade,
        doadorEstado: usuario.estado,
        doadorRegiao: usuario.regiao,
        doadorIbge: usuario.ibge,
        doadorDdd: usuario.ddd,
        doadorGia: usuario.gia,
        doadorSiafi: usuario.siafi,
        status: "pendente",
        criadoEm: new Date().toISOString(),
        descricao: descricao,
        imagens: imagens
    };

    const registros = carregarRegistros();
    registros.push(novoRegistro);
    salvarRegistros(registros);
    formulario.reset();
    if (previewImagensDoacao) previewImagensDoacao.innerHTML = "";
    mostrarRegistros();

    mostrarMensagem(
        `Obrigado, ${usuario.nome}!`,
        "Sua doação foi registrada e está sendo analisada por um administrador. Ela ficará visível no site somente depois da aprovação.",
        "DOAÇÃO RECEBIDA",
        "sucesso",
        "Continuar"
    );

});

/* =========================================================

/* =========================================================
   LOGIN / CADASTRO LOCAL
   ========================================================= */

/*
 * Este projeto funciona apenas no navegador, então as contas
 * ficam no localStorage. Isso serve para demonstração/projeto escolar.
 * Para um site real, seria necessário um backend e armazenamento
 * seguro de senhas (hash).
 */

const CHAVE_USUARIOS = "sportzone_usuarios";
const CHAVE_SESSAO = "sportzone_sessao";
const EMAIL_ADMIN = "admin@sportzone.com";
const SENHA_ADMIN = "admin123";

/* =========================================================
   POPUPS DE FEEDBACK
   ========================================================= */
const modalMensagem = document.getElementById("modalMensagem");
const fecharMensagem = document.getElementById("fecharMensagem");
const botaoMensagem = document.getElementById("botaoMensagem");
const botaoCancelarMensagem = document.getElementById("botaoCancelarMensagem");

function mostrarMensagem(titulo, texto, etiqueta, tipo = "sucesso", botao = "Entendi") {
    botaoMensagem.onclick = fecharMensagemModal;
    botaoCancelarMensagem.hidden = true;
    botaoCancelarMensagem.onclick = fecharMensagemModal;
    document.getElementById("tituloMensagem").textContent = titulo;
    document.getElementById("textoMensagem").textContent = texto;
    document.getElementById("etiquetaMensagem").textContent = etiqueta;
    document.getElementById("iconeMensagem").textContent = tipo === "erro" ? "!" : "✓";
    modalMensagem.classList.toggle("popup-erro", tipo === "erro");
    botaoMensagem.textContent = botao;
    modalMensagem.hidden = false;
    botaoMensagem.focus();
}

function fecharMensagemModal() {
    modalMensagem.hidden = true;
    modalMensagem.classList.remove("popup-erro", "popup-confirmacao");
    botaoCancelarMensagem.hidden = true;
}

function mostrarConfirmacaoRemocao(titulo, aoConfirmar) {
    document.getElementById("tituloMensagem").textContent = "Remover esta doação?";
    document.getElementById("textoMensagem").textContent = `Você está prestes a remover “${titulo}”. Essa ação é permanente e não poderá ser desfeita.`;
    document.getElementById("etiquetaMensagem").textContent = "CONFIRMAÇÃO";
    document.getElementById("iconeMensagem").textContent = "!";
    modalMensagem.classList.remove("popup-erro");
    modalMensagem.classList.add("popup-confirmacao");
    botaoCancelarMensagem.hidden = false;
    botaoCancelarMensagem.textContent = "Cancelar";
    botaoCancelarMensagem.onclick = fecharMensagemModal;
    botaoMensagem.textContent = "Sim, remover doação";
    botaoMensagem.onclick = function() {
        fecharMensagemModal();
        aoConfirmar();
    };
    modalMensagem.hidden = false;
    botaoCancelarMensagem.focus();
}

fecharMensagem.addEventListener("click", fecharMensagemModal);
botaoMensagem.addEventListener("click", fecharMensagemModal);
modalMensagem.addEventListener("click", function(event) {
    if (event.target === modalMensagem) fecharMensagemModal();
});

/*
 * As contas são guardadas permanentemente no localStorage do navegador.
 * Assim, fechar o navegador ou recarregar a página não apaga os cadastros.
 */

const modalLogin = document.getElementById("modalLogin");
const botaoLogin = document.getElementById("botaoLogin");
const fecharLogin = document.getElementById("fecharLogin");
const botaoSair = document.getElementById("botaoSair");
const usuarioLogado = document.getElementById("usuarioLogado");
const botaoPerfil = document.getElementById("botaoPerfil");
const botaoChatTopo = document.getElementById("botaoChat");

const areaLoginFormulario = document.getElementById("areaLoginFormulario");
const areaCadastroFormulario = document.getElementById("areaCadastroFormulario");

const formLogin = document.getElementById("formLogin");
const formCadastro = document.getElementById("formCadastro");

const mensagemLogin = document.getElementById("mensagemLogin");
const mensagemCadastro = document.getElementById("mensagemCadastro");

function carregarUsuarios() {
    try {
        const usuarios = localStorage.getItem(CHAVE_USUARIOS);
        return usuarios ? JSON.parse(usuarios) : [];
    } catch (erro) {
        console.error("Não foi possível carregar as contas salvas:", erro);
        return [];
    }
}

function salvarUsuarios(usuarios) {
    localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios));
}

function abrirLogin() {
    modalLogin.hidden = false;
    areaLoginFormulario.hidden = false;
    areaCadastroFormulario.hidden = true;
    mensagemLogin.textContent = "";
    mensagemCadastro.textContent = "";
    document.getElementById("loginEmail").focus();
}

function fecharModalLogin() {
    modalLogin.hidden = true;
}

function obterSessao() {
    try {
        const sessao = sessionStorage.getItem(CHAVE_SESSAO);
        return sessao ? JSON.parse(sessao) : null;
    } catch (erro) {
        console.error("Não foi possível carregar a sessão:", erro);
        return null;
    }
}


function atualizarPainelAdmin() {
    const painel = document.getElementById("painelAdmin");
    const listaAdmin = document.getElementById("listaAdmin");
    const sessao = obterSessao();
    if (!painel || !listaAdmin) return;

    const registros = carregarRegistros();
    const pendentes = registros.filter(function(registro) {
        return registro.status === "pendente";
    });

    // O painel só existe visualmente quando o administrador está logado
    // e há novas doações aguardando aprovação.
    if (!sessao || !sessao.admin || pendentes.length === 0) {
        painel.hidden = true;
        listaAdmin.innerHTML = "";
        if (typeof atualizarPainelDenuncias === "function") atualizarPainelDenuncias();
        return;
    }

    painel.hidden = false;
    listaAdmin.innerHTML = "";

    pendentes.forEach(function(registro) {
        const item = document.createElement("article");
        item.classList.add("card-admin");
        const statusTexto = registro.status === "aprovado" ? "Aprovada" : registro.status === "rejeitado" ? "Rejeitada" : "Pendente";
        item.innerHTML = `
            <h3>${escapeHtml(registro.titulo)}</h3>
            <p><strong>Status:</strong> ${statusTexto}</p>
            <p><strong>Categoria:</strong> ${escapeHtml(registro.categoria)}</p>
            <p><strong>Doador:</strong> ${escapeHtml(registro.doadorNome || "Não informado")}</p>
            <p><strong>Telefone:</strong> ${escapeHtml(formatarTelefone(registro.doadorTelefone) || "Não informado")}</p>
            <div class="endereco-admin">
                <h4>Endereço do doador</h4>
                <p><strong>CEP:</strong> ${escapeHtml(registro.doadorCep || "Não informado")}</p>
                <p><strong>Bairro:</strong> ${escapeHtml(registro.doadorBairro || "Não informado")}</p>
                <p><strong>Cidade:</strong> ${escapeHtml(registro.doadorCidade || "Não informado")}</p>
                <p><strong>Estado:</strong> ${escapeHtml(registro.doadorEstado || "Não informado")}</p>
            </div>
            <p><strong>Descrição:</strong> ${escapeHtml(registro.descricao)}</p>
            ${Array.isArray(registro.imagens) && registro.imagens.length ? `
                <div class="imagens-produto imagens-admin">
                    ${registro.imagens.map((src, indice) => `<img src="${src}" alt="Foto ${indice + 1} da doação" loading="lazy">`).join("")}
                </div>
            ` : ""}
        `;

        if (registro.status === "pendente") {
            const aprovar = document.createElement("button");
            aprovar.type = "button"; aprovar.textContent = "Aprovar";
            aprovar.addEventListener("click", function() { alterarStatusDoacao(registro.id, "aprovado"); });
            item.appendChild(aprovar);

            const rejeitar = document.createElement("button");
            rejeitar.type = "button"; rejeitar.textContent = "Rejeitar";
            rejeitar.addEventListener("click", function() { alterarStatusDoacao(registro.id, "rejeitado"); });
            item.appendChild(rejeitar);
        }

        listaAdmin.appendChild(item);
    });
    if (typeof atualizarPainelDenuncias === "function") atualizarPainelDenuncias();
}

function alterarStatusDoacao(id, novoStatus) {
    const registros = carregarRegistros();
    const registro = registros.find(function(item) { return item.id === id; });
    if (!registro) return;
    registro.status = novoStatus;
    registro.analisadoEm = new Date().toISOString();
    salvarRegistros(registros);
    window.location.reload();
}

function atualizarSessao() {
    const usuario = obterSessao();

    if (usuario) {
        usuarioLogado.textContent = usuario.admin ? "Olá, Administrador" : `Olá, ${usuario.nome}`;
        usuarioLogado.hidden = false;
        botaoPerfil.hidden = !!usuario.admin;
        botaoChatTopo.hidden = !!usuario.admin;
        botaoSair.hidden = false;
        botaoLogin.hidden = true;
    } else {
        usuarioLogado.hidden = true;
        botaoPerfil.hidden = true;
        botaoChatTopo.hidden = true;
        botaoSair.hidden = true;
        botaoLogin.hidden = false;
    }

    atualizarAcessoDoacao();
}

function atualizarAcessoDoacao() {
    const sessao = obterSessao();
    const campos = formulario.querySelectorAll("input, select, textarea, button");
    const aviso = document.querySelector(".aviso-login-doacao");

    campos.forEach(function(campo) {
        campo.disabled = !sessao;
    });

    if (aviso) {
        aviso.textContent = sessao
            ? `Doação registrada em nome de ${sessao.nome} (${sessao.telefone ? formatarTelefone(sessao.telefone) : "Não informado"}).`
            : "Faça login ou crie uma conta para oferecer um produto para doação.";
    }
}

botaoLogin.addEventListener("click", abrirLogin);
fecharLogin.addEventListener("click", fecharModalLogin);

modalLogin.addEventListener("click", function(event) {
    if (event.target === modalLogin) {
        fecharModalLogin();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && !modalLogin.hidden) {
        fecharModalLogin();
    }
    if (event.key === "Escape" && modalBoasVindas && !modalBoasVindas.hidden) {
        modalBoasVindas.hidden = true;
    }
});

document.getElementById("mostrarCadastro").addEventListener("click", function() {
    areaLoginFormulario.hidden = true;
    areaCadastroFormulario.hidden = false;
    mensagemCadastro.textContent = "";
    document.getElementById("cadastroNome").focus();
});

document.getElementById("mostrarLogin").addEventListener("click", function() {
    areaCadastroFormulario.hidden = true;
    areaLoginFormulario.hidden = false;
    mensagemLogin.textContent = "";
    document.getElementById("loginEmail").focus();
});

function normalizarNome(nome) {
    return String(nome || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function formatarTelefone(valor) {
    const numeros = String(valor || "").replace(/\D/g, "").slice(0, 11);
    if (numeros.length <= 2) return numeros ? `(${numeros}` : "";
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

const campoCadastroCep = document.getElementById("cadastroCep");
if (campoCadastroCep) {
    campoCadastroCep.addEventListener("input", function() {
        const numeros = campoCadastroCep.value.replace(/\D/g, "").slice(0, 8);
        campoCadastroCep.value = numeros.length > 5
            ? `${numeros.slice(0, 5)}-${numeros.slice(5)}`
            : numeros;
    });
}

const campoCadastroTelefone = document.getElementById("cadastroTelefone");
if (campoCadastroTelefone) {
    campoCadastroTelefone.addEventListener("input", function() {
        campoCadastroTelefone.value = formatarTelefone(campoCadastroTelefone.value);
    });
}

const modalBoasVindas = document.getElementById("modalBoasVindas");
const fecharBoasVindas = document.getElementById("fecharBoasVindas");
if (fecharBoasVindas) {
    fecharBoasVindas.addEventListener("click", function() {
        modalBoasVindas.hidden = true;
    });
}
if (modalBoasVindas) {
    modalBoasVindas.addEventListener("click", function(event) {
        if (event.target === modalBoasVindas) modalBoasVindas.hidden = true;
    });
}

async function verificarEmail(email) {
    const formato = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!formato.test(email)) return { valido: false, mensagem: "Informe um e-mail válido." };

    const dominio = email.split("@")[1].toLowerCase();
    try {
        const resposta = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(dominio)}&type=MX`, { headers: { Accept: "application/dns-json" } });
        if (!resposta.ok) throw new Error("Falha na consulta DNS");
        const dados = await resposta.json();
        if (!Array.isArray(dados.Answer) || dados.Answer.length === 0) {
            return { valido: false, mensagem: "Esse domínio não parece aceitar e-mails. Confira o endereço." };
        }
    } catch (erro) {
        // A validação de sintaxe continua funcionando mesmo se o DNS estiver indisponível.
        return { valido: true, aviso: "Não foi possível verificar o domínio agora." };
    }
    return { valido: true };
}

formCadastro.addEventListener("submit", async function(event) {
    event.preventDefault();

    const nome = document.getElementById("cadastroNome").value.trim();
    const email = document.getElementById("cadastroEmail").value.trim().toLowerCase();
    const cep = document.getElementById("cadastroCep").value.replace(/\D/g, "");
    const telefone = formatarTelefone(document.getElementById("cadastroTelefone").value);
    const telefoneDigitos = telefone.replace(/\D/g, "");
    const nomeNormalizado = normalizarNome(nome);
    const senha = document.getElementById("cadastroSenha").value;

    const emailVerificado = await verificarEmail(email);
    if (!emailVerificado.valido) {
        mensagemCadastro.textContent = emailVerificado.mensagem;
        return;
    }

    if (nomeNormalizado.length < 2) {
        mensagemCadastro.textContent = "Informe um nome válido.";
        return;
    }

    if (telefoneDigitos.length !== 11) {
        mensagemCadastro.textContent = "Informe um telefone válido no formato (00) 00000-0000.";
        return;
    }

    if (cep.length !== 8) {
        mensagemCadastro.textContent = "Informe um CEP válido com 8 números.";
        return;
    }

    mensagemCadastro.textContent = "Consultando CEP...";

    let localizacao;
    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!resposta.ok) throw new Error("Falha na consulta");
        localizacao = await resposta.json();
    } catch (erro) {
        mensagemCadastro.textContent = "Não foi possível consultar o CEP. Verifique sua conexão e tente novamente.";
        return;
    }

    if (localizacao.erro || !localizacao.localidade || !localizacao.uf) {
        mensagemCadastro.textContent = "CEP não encontrado. Confira o número informado.";
        return;
    }

    const usuarios = carregarUsuarios();

    if (email === EMAIL_ADMIN) {
        mensagemCadastro.textContent = "Este e-mail não pode ser usado para criar uma conta.";
        return;
    }

    if (usuarios.some(function(usuario) {
        return (usuario.email || "").trim().toLowerCase() === email;
    })) {
        mensagemCadastro.textContent = "Este e-mail já possui uma conta.";
        return;
    }

    if (usuarios.some(function(usuario) {
        return normalizarNome(usuario.nome) === nomeNormalizado;
    })) {
        mensagemCadastro.textContent = "Este nome já está sendo usado por outra conta.";
        return;
    }

    if (usuarios.some(function(usuario) {
        return (usuario.telefone || "").replace(/\D/g, "") === telefoneDigitos;
    })) {
        mensagemCadastro.textContent = "Este número de telefone já está sendo usado por outra conta.";
        return;
    }

    usuarios.push({
        nome: nome,
        email: email,
        cep: cep,
        logradouro: localizacao.logradouro || "",
        complemento: localizacao.complemento || "",
        unidade: localizacao.unidade || "",
        bairro: localizacao.bairro || "",
        cidade: localizacao.localidade || "",
        estado: localizacao.uf || "",
        regiao: localizacao.regiao || "",
        ibge: localizacao.ibge || "",
        ddd: localizacao.ddd || "",
        gia: localizacao.gia || "",
        siafi: localizacao.siafi || "",
        telefone: telefone,
        senha: senha,
        criadoEm: new Date().toISOString()
    });

    salvarUsuarios(usuarios);

    sessionStorage.setItem(
        CHAVE_SESSAO,
        JSON.stringify({
            nome: nome, email: email, telefone: telefone, cep: cep,
            logradouro: localizacao.logradouro || "", complemento: localizacao.complemento || "",
            unidade: localizacao.unidade || "", bairro: localizacao.bairro || "", cidade: localizacao.localidade || "", estado: localizacao.uf || "",
            regiao: localizacao.regiao || "", ibge: localizacao.ibge || "", ddd: localizacao.ddd || "",
            gia: localizacao.gia || "", siafi: localizacao.siafi || ""
        })
    );

    formCadastro.reset();
    fecharModalLogin();
    atualizarSessao();

    window.location.reload();
});

formLogin.addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const senha = document.getElementById("loginSenha").value;

    if (email === EMAIL_ADMIN && senha === SENHA_ADMIN) {
        sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({
            nome: "Administrador",
            email: EMAIL_ADMIN,
            admin: true
        }));
        formLogin.reset();
        fecharModalLogin();
        window.location.reload();
        return;
    }

    const usuario = carregarUsuarios().find(function(item) {
        return item.email === email && item.senha === senha;
    });

    if (!usuario) {
        mensagemLogin.textContent = "E-mail ou senha incorretos.";
        return;
    }
    if (usuario.banido) {
        mensagemLogin.textContent = "Esta conta foi suspensa pela administração.";
        return;
    }

    sessionStorage.setItem(
        CHAVE_SESSAO,
        JSON.stringify({
            nome: usuario.nome,
            email: usuario.email,
            telefone: formatarTelefone(usuario.telefone),
            cep: usuario.cep,
            logradouro: usuario.logradouro || "",
            complemento: usuario.complemento || "",
            unidade: usuario.unidade || "",
            bairro: usuario.bairro || "",
            cidade: usuario.cidade || "",
            estado: usuario.estado || "",
            regiao: usuario.regiao || "",
            ibge: usuario.ibge || "",
            ddd: usuario.ddd || "",
            gia: usuario.gia || "",
            siafi: usuario.siafi || ""
        })
    );

    formLogin.reset();
    fecharModalLogin();
    window.location.reload();
});

botaoSair.addEventListener("click", function() {
    sessionStorage.removeItem(CHAVE_SESSAO);
    sessionStorage.removeItem("sportzone_chat_pendente");
    window.location.reload();
});


/* =========================================================
   CHAT, DENÚNCIAS, ENCERRAMENTO E PERFIL
   Dados locais de demonstração (localStorage).
   ========================================================= */
const CHAVE_CHATS = "sportzone_chats_v1";
const CHAVE_DENUNCIAS = "sportzone_denuncias_v1";
let conversaAtualId = null;
let avatarPerfilPendente = null;
const modalChat = document.getElementById("modalChat");
const modalPerfil = document.getElementById("modalPerfil");
const mensagensChat = document.getElementById("mensagensChat");
const formChat = document.getElementById("formChat");
const formDenuncia = document.getElementById("formDenuncia");
const painelDenuncias = document.getElementById("painelDenuncias");
function lerLista(chave) { try { return JSON.parse(localStorage.getItem(chave) || "[]"); } catch (_) { return []; } }
function salvarLista(chave, dados) { localStorage.setItem(chave, JSON.stringify(dados)); }
function normalizarEmail(v) { return (v || "").trim().toLowerCase(); }
function nomeUsuarioDoChat(email) {
 const sessao=obterSessao();
 if(sessao && normalizarEmail(sessao.email)===normalizarEmail(email)) return sessao.nome || email;
 const usuario=lerLista(CHAVE_USUARIOS).find(u=>normalizarEmail(u.email)===normalizarEmail(email));
 return usuario?.nome || (email||"Contato");
}
function mostrarTelaListaChats() {
 const layout=document.getElementById("layoutListaChat");
 layout.classList.remove("mostrando-conversa"); layout.classList.add("mostrando-lista");
 document.getElementById("voltarListaChats").hidden=true;
 document.getElementById("tituloChat").textContent="Conversas";
}
function mostrarTelaConversaChat(chat) {
 const layout=document.getElementById("layoutListaChat");
 layout.classList.remove("mostrando-lista"); layout.classList.add("mostrando-conversa");
 document.getElementById("voltarListaChats").hidden=false;
 document.getElementById("tituloChat").textContent=nomeUsuarioDoChat(chat.participantes.find(e=>normalizarEmail(e)!==normalizarEmail(obterSessao()?.email))) || "Conversa";
 formDenuncia.hidden=true;
 document.getElementById("botaoDenunciar").hidden=!!chat.encerrado;
 document.getElementById("botaoEncerrarChat").hidden=false;
 document.getElementById("botaoEncerrarChat").textContent=chat.encerrado?"Conversa encerrada":"Encerrar conversa";
 document.getElementById("botaoEncerrarChat").disabled=!!chat.encerrado;
 document.getElementById("textoChat").disabled=!!chat.encerrado;
 formChat.querySelector("button").disabled=!!chat.encerrado;
 renderizarListaConversasChat(); renderizarMensagens();
}
function renderizarListaConversasChat() {
 const sessao=obterSessao(); const alvo=document.getElementById("listaConversasChat"); if(!alvo||!sessao)return;
 const chats=lerLista(CHAVE_CHATS).filter(c=>c.participantes.some(e=>normalizarEmail(e)===normalizarEmail(sessao.email))).sort((a,b)=>new Date(b.criadoEm)-new Date(a.criadoEm));
 alvo.innerHTML="";
 if(!chats.length){alvo.innerHTML='<p class="lista-chat-vazia">Você ainda não tem conversas. Abra um anúncio e toque no botão de mensagem para começar.</p>';return;}
 chats.forEach(c=>{const outro=c.participantes.find(e=>normalizarEmail(e)!==normalizarEmail(sessao.email))||"Contato";const nomeOutro=nomeUsuarioDoChat(outro);const ultimo=c.mensagens?.[c.mensagens.length-1];const b=document.createElement("button");b.type="button";b.className="item-conversa-chat"+(c.id===conversaAtualId?" selecionada":"");b.innerHTML=`<span class="avatar-conversa-chat">${escapeHtml((nomeOutro[0]||"?").toUpperCase())}</span><span class="texto-item-conversa"><strong>${escapeHtml(nomeOutro)}</strong><small>${escapeHtml(c.produto||"Doação")}</small><span>${escapeHtml(ultimo?.texto||(c.encerrado?"Conversa encerrada":"Ainda sem mensagens"))}</span></span>`;
 b.addEventListener("click",()=>{conversaAtualId=c.id;mostrarTelaConversaChat(c);});alvo.appendChild(b);});
}

function abrirConversa(registro) {
 const sessao = obterSessao();
 if (!sessao) { sessionStorage.setItem("sportzone_chat_pendente", registro.id); abrirLogin(); return; }
 if (sessao.admin) { mostrarMensagem("Chat de usuário", "Entre com uma conta de usuário para conversar com o anunciante.", "CHAT", "erro"); return; }
 const dono = normalizarEmail(registro.doadorEmail);
 if (!dono || dono === normalizarEmail(sessao.email)) { mostrarMensagem("Conversa indisponível", "Você não pode iniciar uma conversa consigo mesmo.", "CHAT", "erro"); return; }
 let chats = lerLista(CHAVE_CHATS);
 let chat = chats.find(c => c.doacaoId === registro.id && [normalizarEmail(c.participantes[0]),normalizarEmail(c.participantes[1])].includes(normalizarEmail(sessao.email)) && c.participantes.some(e => normalizarEmail(e) === dono));
 if (!chat) { chat = { id: "chat-" + Date.now() + Math.random().toString(16).slice(2), doacaoId: registro.id, produto: registro.titulo, participantes: [dono, normalizarEmail(sessao.email)], mensagens: [], encerrado: false, criadoEm: new Date().toISOString() }; chats.push(chat); salvarLista(CHAVE_CHATS,chats); }
 conversaAtualId = chat.id; renderizarListaConversasChat(); mostrarTelaConversaChat(chat); modalChat.hidden = false;
}
function renderizarMensagens() {
 const chat = lerLista(CHAVE_CHATS).find(c => c.id === conversaAtualId); mensagensChat.innerHTML = "";
 if (!chat) { mensagensChat.textContent = "Conversa não encontrada."; return; }
 if (chat.encerrado) { const info=document.createElement("p"); info.className="chat-encerrado"; info.textContent="Esta conversa foi encerrada."; mensagensChat.appendChild(info); }
 chat.mensagens.forEach(m => { const el=document.createElement("div"); el.className="mensagem-chat"+(normalizarEmail(m.email)===normalizarEmail(obterSessao()?.email)?" minha-mensagem":""); const autor=document.createElement("strong"); autor.textContent=m.nome+" • "; const texto=document.createElement("span"); texto.textContent=m.texto; const data=document.createElement("small"); data.textContent=new Date(m.data).toLocaleString("pt-BR"); el.append(autor,texto,data); mensagensChat.appendChild(el); });
 mensagensChat.scrollTop=mensagensChat.scrollHeight;
}
formChat.addEventListener("submit",function(e){e.preventDefault(); const sessao=obterSessao(); const texto=document.getElementById("textoChat").value.trim(); if(!sessao||!texto)return; const chats=lerLista(CHAVE_CHATS); const chat=chats.find(c=>c.id===conversaAtualId); if(!chat||chat.encerrado)return; if(chat.participantes.some(email=>lerLista("sportzone_usuarios").some(u=>normalizarEmail(u.email)===normalizarEmail(email)&&u.banido)))return; chat.mensagens.push({email:sessao.email,nome:sessao.nome,texto,data:new Date().toISOString()}); salvarLista(CHAVE_CHATS,chats); document.getElementById("textoChat").value=""; renderizarMensagens(); renderizarListaConversasChat(); });
document.getElementById("fecharChat").addEventListener("click",()=>{modalChat.hidden=true;});
modalChat.addEventListener("click",e=>{if(e.target===modalChat)modalChat.hidden=true;});
document.getElementById("botaoDenunciar").addEventListener("click",()=>{formDenuncia.hidden=!formDenuncia.hidden;});
formDenuncia.addEventListener("submit",function(e){e.preventDefault();const sessao=obterSessao();const chat=lerLista(CHAVE_CHATS).find(c=>c.id===conversaAtualId);const motivo=document.getElementById("motivoDenuncia").value;if(!sessao||!chat||!motivo)return;const denuncias=lerLista(CHAVE_DENUNCIAS);if(!denuncias.some(d=>d.chatId===chat.id&&normalizarEmail(d.denunciante)===normalizarEmail(sessao.email))){denuncias.push({id:"denuncia-"+Date.now(),chatId:chat.id,denunciante:sessao.email,alvo:chat.participantes.find(e=>normalizarEmail(e)!==normalizarEmail(sessao.email)),motivo,detalhes:document.getElementById("detalheDenuncia").value.trim(),data:new Date().toISOString(),status:"aberta"});salvarLista(CHAVE_DENUNCIAS,denuncias);} formDenuncia.reset();formDenuncia.hidden=true;modalChat.hidden=true;atualizarPainelDenuncias();mostrarMensagem("Denúncia enviada","A administração poderá revisar o motivo e o histórico completo desta conversa.","DENÚNCIA RECEBIDA");});
document.getElementById("botaoEncerrarChat").addEventListener("click",function(){const chats=lerLista(CHAVE_CHATS);const chat=chats.find(c=>c.id===conversaAtualId);if(!chat||chat.encerrado)return;chat.encerrado=true;chat.encerradoEm=new Date().toISOString();salvarLista(CHAVE_CHATS,chats);renderizarMensagens();document.getElementById("botaoDenunciar").hidden=true;document.getElementById("botaoEncerrarChat").textContent="Conversa encerrada";document.getElementById("textoChat").disabled=true;formChat.querySelector("button").disabled=true;});
function atualizarPainelDenuncias(){const sessao=obterSessao();const lista=document.getElementById("listaDenuncias");if(!sessao||!sessao.admin){painelDenuncias.hidden=true;return;}const denuncias=lerLista(CHAVE_DENUNCIAS);painelDenuncias.hidden=!denuncias.length;lista.innerHTML="";denuncias.forEach(d=>{const chat=lerLista(CHAVE_CHATS).find(c=>c.id===d.chatId);const card=document.createElement("article");card.className="card-admin denuncia-admin";const h=document.createElement("h3");h.textContent="Denúncia recebida";const info=document.createElement("p");info.textContent="Denunciante: "+d.denunciante+" | Conta denunciada: "+d.alvo;const motivo=document.createElement("p");motivo.textContent="Motivo: "+d.motivo+(d.detalhes?" — "+d.detalhes:"");const status=document.createElement("span");status.className="status-denuncia-admin";status.textContent=d.status||"aberta";const produto=document.createElement("p");produto.className="produto-denuncia-admin";produto.textContent="Anúncio relacionado: "+(chat?chat.produto:"conversa indisponível");card.append(h,status,produto,info,motivo);const detalhesCaso=document.createElement("details");detalhesCaso.className="detalhes-caso-denuncia";const resumoCaso=document.createElement("summary");resumoCaso.textContent="Ver histórico completo da conversa ("+(chat?chat.mensagens.length:0)+" mensagens)";detalhesCaso.appendChild(resumoCaso);const transcript=document.createElement("div");transcript.className="transcricao-denuncia";if(chat){chat.mensagens.forEach(m=>{const p=document.createElement("p");p.textContent=new Date(m.data).toLocaleString("pt-BR")+" • "+m.nome+": "+m.texto;transcript.appendChild(p);});if(!chat.mensagens.length)transcript.textContent="A conversa ainda não possui mensagens.";}detalhesCaso.appendChild(transcript);card.appendChild(detalhesCaso);const encerrar=document.createElement("button");encerrar.textContent=chat&&chat.encerrado?"Conversa encerrada":"Encerrar conversa";encerrar.disabled=!chat||chat.encerrado;encerrar.addEventListener("click",()=>{const chats=lerLista(CHAVE_CHATS);const c=chats.find(x=>x.id===d.chatId);if(c){c.encerrado=true;c.encerradoEm=new Date().toISOString();salvarLista(CHAVE_CHATS,chats);atualizarPainelDenuncias();}});card.appendChild(encerrar);const ban=document.createElement("button");ban.className="botao-perigo";ban.textContent="Banir conta denunciada";ban.addEventListener("click",()=>{if(!confirm("Banir a conta "+d.alvo+"? Ela não poderá entrar novamente."))return;const usuarios=lerLista(CHAVE_USUARIOS);const alvo=usuarios.find(u=>normalizarEmail(u.email)===normalizarEmail(d.alvo));if(alvo){alvo.banido=true;alvo.banidoEm=new Date().toISOString();salvarUsuarios(usuarios);d.status="conta banida";salvarLista(CHAVE_DENUNCIAS,denuncias);mostrarMensagem("Conta banida","A conta denunciada foi suspensa neste site.","MODERAÇÃO");}else mostrarMensagem("Conta não encontrada","Não foi possível localizar a conta para banir.","MODERAÇÃO","erro");atualizarPainelDenuncias();});card.appendChild(ban);lista.appendChild(card);});}
const botaoPerfilEl=document.getElementById("botaoPerfil");
botaoPerfilEl.addEventListener("click",()=>{const sessao=obterSessao();if(!sessao||sessao.admin)return;const u=lerLista(CHAVE_USUARIOS).find(x=>normalizarEmail(x.email)===normalizarEmail(sessao.email));if(!u)return;document.getElementById("nomePerfil").value=u.nome||"";document.getElementById("telefonePerfil").value=u.telefone||"";avatarPerfilPendente=u.avatar||null;document.getElementById("previewAvatar").innerHTML="";if(avatarPerfilPendente){const img=document.createElement("img");img.src=avatarPerfilPendente;document.getElementById("previewAvatar").appendChild(img);}else document.getElementById("previewAvatar").textContent="👤";modalPerfil.hidden=false;});
document.getElementById("fecharPerfil").addEventListener("click",()=>modalPerfil.hidden=true);
modalPerfil.addEventListener("click",e=>{if(e.target===modalPerfil)modalPerfil.hidden=true;});
document.getElementById("fotoPerfil").addEventListener("change",function(){const file=this.files[0];if(!file)return;if(file.size>2*1024*1024){mostrarMensagem("Imagem muito grande","Escolha uma imagem de até 2 MB.","PERFIL","erro");this.value="";return;}const reader=new FileReader();reader.onload=()=>{avatarPerfilPendente=reader.result;const img=document.createElement("img");img.src=avatarPerfilPendente;const preview=document.getElementById("previewAvatar");preview.innerHTML="";preview.appendChild(img);};reader.readAsDataURL(file);});
document.getElementById("telefonePerfil").addEventListener("input",function(){this.value=formatarTelefone(this.value);});
document.getElementById("formPerfil").addEventListener("submit",function(e){e.preventDefault();const sessao=obterSessao();if(!sessao)return;const nome=document.getElementById("nomePerfil").value.trim();const telefone=formatarTelefone(document.getElementById("telefonePerfil").value);if(nome.length<2||(telefone.replace(/\D/g,"").length!==11)){mostrarMensagem("Confira os dados","Informe nome válido e telefone com DDD.","PERFIL","erro");return;}const usuarios=lerLista(CHAVE_USUARIOS);const u=usuarios.find(x=>normalizarEmail(x.email)===normalizarEmail(sessao.email));if(!u)return;u.nome=nome;u.telefone=telefone;u.avatar=avatarPerfilPendente;salvarUsuarios(usuarios);sessao.nome=nome;sessao.telefone=telefone;sessao.avatar=avatarPerfilPendente;sessionStorage.setItem(CHAVE_SESSAO,JSON.stringify(sessao));modalPerfil.hidden=true;window.location.reload();});
botaoChatTopo.addEventListener("click",()=>{const sessao=obterSessao();if(!sessao)return;conversaAtualId=null;formDenuncia.hidden=true;document.getElementById("botaoDenunciar").hidden=true;document.getElementById("botaoEncerrarChat").hidden=true;document.getElementById("textoChat").disabled=true;formChat.querySelector("button").disabled=true;renderizarListaConversasChat();mostrarTelaListaChats();modalChat.hidden=false;});
document.getElementById("voltarListaChats").addEventListener("click",()=>{conversaAtualId=null;formDenuncia.hidden=true;document.getElementById("botaoDenunciar").hidden=true;document.getElementById("botaoEncerrarChat").hidden=true;document.getElementById("textoChat").disabled=true;formChat.querySelector("button").disabled=true;mostrarTelaListaChats();renderizarListaConversasChat();});


/*
 * A sessão fica no sessionStorage: permanece ativa durante recargas,
 * mas é descartada quando a aba/sessão do navegador termina.
 */
atualizarSessao();
atualizarPainelDenuncias();

/* =========================================================
CARREGAMENTO INICIAL
========================================================= */

/*
Quando o JavaScript é carregado, chamamos
mostrarRegistros().

Isso faz com que os dados anteriormente salvos
apareçam automaticamente na tela.
*/
mostrarRegistros();

const chatPendenteId = sessionStorage.getItem("sportzone_chat_pendente");
if (chatPendenteId && obterSessao() && !obterSessao().admin) {
    sessionStorage.removeItem("sportzone_chat_pendente");
    const anuncioPendente = carregarRegistros().find(r => r.id === chatPendenteId && r.status === "aprovado");
    if (anuncioPendente) abrirConversa(anuncioPendente);
}

const inputFotoPerfil = document.getElementById("fotoPerfil");
const nomeArquivoFoto = document.getElementById("nomeArquivoFoto");
if (inputFotoPerfil && nomeArquivoFoto) inputFotoPerfil.addEventListener("change", () => { nomeArquivoFoto.textContent = inputFotoPerfil.files && inputFotoPerfil.files[0] ? inputFotoPerfil.files[0].name : "Nenhuma foto selecionada"; });
