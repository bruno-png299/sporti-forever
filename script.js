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
return JSON.parse(dadosSalvos);

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
function mostrarRegistros() {

/*
   Primeiro pegamos todos os registros salvos.
*/
const registros = carregarRegistros();


/*
   Limpamos a lista antes de recriar os cards.

   Isso evita que os mesmos registros apareçam
   duplicados na tela.
*/
lista.innerHTML = "";


/*
   Se não existir nenhum registro,
   mostramos uma mensagem amigável.
*/
if (registros.length === 0) {

    const mensagem = document.createElement("p");

    mensagem.textContent =
        "Nenhuma doação foi registrada ainda. Seja o primeiro a contribuir com a SportZone!";

    lista.appendChild(mensagem);

    return;
}


/*
   Percorremos todos os registros.

   O forEach executa o código uma vez para cada
   item existente no array.
*/
registros.forEach(function(registro, indice) {

    /*
       Criamos um elemento <article> para representar
       o card da doação.
    */
    const card = document.createElement("article");

    /*
       Adicionamos a classe card-produto.

       Essa classe já foi criada no nosso CSS.
    */
    card.classList.add("card-produto");


    /*
       Criamos o título do card.
    */
    const titulo = document.createElement("h3");

    titulo.textContent = registro.titulo;


    /*
       Criamos o texto da categoria.
    */
    const categoria = document.createElement("p");

    categoria.textContent =
        "Categoria: " + registro.categoria;


    /*
       Criamos o texto do responsável.
    */
    const responsavel = document.createElement("p");

    responsavel.textContent =
        "Contato: " + registro.responsavel;


    /*
       Criamos o texto da descrição.
    */
    const descricao = document.createElement("p");

    descricao.textContent =
        registro.descricao;


    /*
       Criamos o botão de exclusão.
    */
    const botaoExcluir = document.createElement("button");

    botaoExcluir.textContent = "Excluir";


    /*
       Quando o botão for clicado, chamamos
       a função excluirRegistro().

       Enviamos o índice do registro para saber
       exatamente qual item deve ser removido.
    */
    botaoExcluir.addEventListener("click", function() {

        excluirRegistro(indice);

    });


    /*
       Colocamos todos os elementos dentro do card.
    */
    card.appendChild(titulo);

    card.appendChild(categoria);

    card.appendChild(responsavel);

    card.appendChild(descricao);

    card.appendChild(botaoExcluir);


    /*
       Finalmente colocamos o card dentro da
       div #lista.
    */
    lista.appendChild(card);

});

}

/* =========================================================
FUNÇÃO: EXCLUIR REGISTRO
========================================================= */

/*
Recebe o índice do registro que deverá ser excluído.
*/
function excluirRegistro(indice) {

/*
   Carregamos todos os registros atualmente salvos.
*/
const registros = carregarRegistros();


/*
   Remove um item do array.

   splice(indice, 1) significa:
   - comece na posição indicada pelo índice;
   - remova 1 item.
*/
registros.splice(indice, 1);


/*
   Salvamos novamente a lista modificada.
*/
salvarRegistros(registros);


/*
   Atualizamos os cards na tela.
*/
mostrarRegistros();

}

/* =========================================================
EVENTO DO FORMULÁRIO
========================================================= */

/*
O evento "submit" acontece quando o usuário
envia o formulário.
*/
formulario.addEventListener("submit", function(event) {

/*
   Impede o comportamento padrão do formulário.

   Sem isso, o navegador recarregaria a página
   quando o usuário clicasse no botão.
*/
event.preventDefault();


/*
   Pegamos os valores digitados pelo usuário.
*/
const titulo = document.getElementById("titulo").value.trim();

const categoria = document.getElementById("categoria").value;

const responsavel = document.getElementById("responsavel").value.trim();

const descricao = document.getElementById("descricao").value.trim();


/*
   Criamos um objeto contendo os dados da doação.
*/
const novoRegistro = {

    titulo: titulo,

    categoria: categoria,

    responsavel: responsavel,

    descricao: descricao

};


/*
   Carregamos os registros existentes.
*/
const registros = carregarRegistros();


/*
   Adicionamos o novo registro ao final do array.
*/
registros.push(novoRegistro);


/*
   Salvamos a lista atualizada no localStorage.
*/
salvarRegistros(registros);


/*
   Limpamos os campos do formulário depois do cadastro.
*/
formulario.reset();


/*
   Atualizamos a lista de cards na tela.
*/
mostrarRegistros();


/*
   Mostramos uma mensagem simples confirmando
   que o cadastro foi realizado.
*/
alert(
    "Obrigado por contribuir com a SportZone! Sua oferta de doação foi registrada."
);

});

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