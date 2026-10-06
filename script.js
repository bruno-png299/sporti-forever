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
            const botaoRemover = document.createElement("button");
            botaoRemover.type = "button";
            botaoRemover.className = "botao-remover-doacao";
            botaoRemover.textContent = "Remover minha doação";
            botaoRemover.addEventListener("click", function() { removerDoacao(registro.id); });
            aviso.appendChild(botaoRemover);
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

        const telefone = document.createElement("p");
        telefone.textContent = "Telefone: " + (registro.doadorTelefone ? formatarTelefone(registro.doadorTelefone) : "Não informado");

        const localizacao = document.createElement("p");
        localizacao.textContent = "Localização: " + (registro.doadorCidade && registro.doadorEstado ? registro.doadorCidade + " - " + registro.doadorEstado : "Não informada");

        const descricao = document.createElement("p");
        descricao.textContent = registro.descricao;

        const galeria = criarGaleriaImagens(registro.imagens);
        if (galeria) card.appendChild(galeria);

        card.appendChild(titulo);
        card.appendChild(categoria);
        card.appendChild(doador);
        card.appendChild(telefone);
        card.appendChild(localizacao);
        card.appendChild(descricao);

        const sessaoAtual = obterSessao();
        if (sessaoAtual && !sessaoAtual.admin && registro.doadorEmail === sessaoAtual.email) {
            const botaoRemover = document.createElement("button");
            botaoRemover.type = "button";
            botaoRemover.className = "botao-remover-doacao";
            botaoRemover.textContent = "Remover minha doação";
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
    const permitido = sessao.admin || (!registro.doadorEmail || registro.doadorEmail === sessao.email);
    if (!permitido) return;

    const confirmado = window.confirm(`Tem certeza que deseja remover a doação "${registro.titulo}"? Esta ação não pode ser desfeita.`);
    if (!confirmado) return;

    registros.splice(indice, 1);
    salvarRegistros(registros);
    mostrarRegistros();
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

function mostrarMensagem(titulo, texto, etiqueta, tipo = "sucesso", botao = "Entendi") {
    botaoMensagem.onclick = fecharMensagemModal;
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
    modalMensagem.classList.remove("popup-erro");
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

    if (!sessao || !sessao.admin) {
        painel.hidden = true;
        return;
    }

    painel.hidden = false;
    const registros = carregarRegistros();
    listaAdmin.innerHTML = "";

    if (registros.length === 0) {
        listaAdmin.innerHTML = "<p>Nenhuma doação cadastrada.</p>";
        return;
    }

    registros.forEach(function(registro) {
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

        const remover = document.createElement("button");
        remover.type = "button";
        remover.className = "botao-remover-doacao";
        remover.textContent = "Remover doação";
        remover.addEventListener("click", function() { removerDoacao(registro.id); });
        item.appendChild(remover);

        listaAdmin.appendChild(item);
    });
}

function alterarStatusDoacao(id, novoStatus) {
    const registros = carregarRegistros();
    const registro = registros.find(function(item) { return item.id === id; });
    if (!registro) return;
    registro.status = novoStatus;
    registro.analisadoEm = new Date().toISOString();
    salvarRegistros(registros);
    mostrarRegistros();
}

function atualizarSessao() {
    const usuario = obterSessao();

    if (usuario) {
        usuarioLogado.textContent = usuario.admin ? "Olá, Administrador" : `Olá, ${usuario.nome}`;
        usuarioLogado.hidden = false;
        botaoSair.hidden = false;
        botaoLogin.hidden = true;
    } else {
        usuarioLogado.hidden = true;
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

    document.getElementById("mensagemBoasVindas").textContent = `Olá, ${nome}! Sua conta foi criada com sucesso. Agora você já pode participar das doações da SportZone.`;
    document.getElementById("modalBoasVindas").hidden = false;
    document.getElementById("fecharBoasVindas").focus();
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
        atualizarSessao();
        mostrarRegistros();
        mostrarMensagem(
            "Bem-vindo, administrador!",
            "Você entrou na área administrativa. Aqui você pode analisar as doações pendentes e decidir quais serão publicadas.",
            "ÁREA ADMINISTRATIVA",
            "sucesso",
            "Ver doações"
        );
        botaoMensagem.onclick = function() {
            fecharMensagemModal();
            document.getElementById("painelAdmin").scrollIntoView({ behavior: "smooth", block: "start" });
        };
        return;
    }

    const usuario = carregarUsuarios().find(function(item) {
        return item.email === email && item.senha === senha;
    });

    if (!usuario) {
        mensagemLogin.textContent = "E-mail ou senha incorretos.";
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
    atualizarSessao();

    mostrarMensagem(
        `Bem-vindo(a) de volta, ${usuario.nome}!`,
        "Login realizado com sucesso. Você já pode participar das doações da SportZone.",
        "LOGIN REALIZADO",
        "sucesso",
        "Continuar"
    );
});

botaoSair.addEventListener("click", function() {
    sessionStorage.removeItem(CHAVE_SESSAO);
    atualizarSessao();
});

/*
 * A sessão é temporária. Cada nova abertura/recarregamento do site
 * começa deslogada, enquanto o login continua válido durante a
 * sessão atual da página.
 */
sessionStorage.removeItem(CHAVE_SESSAO);

atualizarSessao();

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
