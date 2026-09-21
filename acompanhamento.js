let intervaloAcompanhamento = null;

function formatarHora(dataIso) {
  const data = new Date(dataIso);
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function montarPassosDoPedido(pedido) {
  const ehEntrega = pedido.formaRecebimento === FITZZ.formaRecebimento.ENTREGA;

  const passos = [];
  passos.push({ status: FITZZ.statusPedido.CONFIRMADO, titulo: "Confirmado" });
  passos.push({ status: FITZZ.statusPedido.EM_PREPARACAO, titulo: "Em preparo" });

  if (ehEntrega) {
    passos.push({ status: FITZZ.statusPedido.SAIU_PARA_ENTREGA, titulo: "Saiu" });
    passos.push({ status: FITZZ.statusPedido.ENTREGUE, titulo: "Entregue" });
  } else {
    passos.push({ status: FITZZ.statusPedido.PRONTO_PARA_RETIRADA, titulo: "Pronto" });
    passos.push({ status: FITZZ.statusPedido.RETIRADO, titulo: "Retirado" });
  }

  return passos;
}

function encontrarIndiceDoStatusAtual(passos, statusAtual) {
  for (let i = 0; i < passos.length; i++) {
    if (passos[i].status === statusAtual) {
      return i;
    }
  }
  return -1;
}

function renderizarPedido(pedido) {
  document.getElementById("busca-pedido").classList.add("d-none");
  document.getElementById("detalhe-pedido").classList.remove("d-none");

  document.getElementById("pedido-id").textContent = "Pedido #" + pedido.identificador;

  const passos = montarPassosDoPedido(pedido);
  const indiceAtual = encontrarIndiceDoStatusAtual(passos, pedido.statusAtual);

  let html = "";
  for (let i = 0; i < passos.length; i++) {
    let classe = "pending";
    if (i < indiceAtual) {
      classe = "done";
    } else if (i === indiceAtual) {
      classe = "current";
    }

    html += "<li class=\"" + classe + "\">";
    html += "<span class=\"marker\"></span>";
    html += "<div class=\"step-title\">" + passos[i].titulo + "</div>";
    html += "</li>";
  }
  document.getElementById("timeline").innerHTML = html;

  let htmlItens = "";
  for (let i = 0; i < pedido.itens.length; i++) {
    const item = pedido.itens[i];
    htmlItens += "<div class=\"d-flex justify-content-between small mb-1\">";
    htmlItens += "<span>" + item.quantidade + "× " + item.nome + " (" + item.tamanho + ")</span>";
    htmlItens += "<span>" + formatarPreco(item.precoUnitario * item.quantidade) + "</span>";
    htmlItens += "</div>";
  }
  document.getElementById("pedido-itens").innerHTML = htmlItens;
  document.getElementById("pedido-taxa").textContent = formatarPreco(pedido.taxaEntrega);
  document.getElementById("pedido-total").textContent = formatarPreco(pedido.valorTotal);

  if (pedido.previsaoConclusao) {
    document.getElementById("pedido-previsao").textContent = formatarHora(pedido.previsaoConclusao);
  } else {
    document.getElementById("pedido-previsao").textContent = "Aguardando confirmação da loja";
  }

  if (pedido.formaRecebimento === FITZZ.formaRecebimento.ENTREGA) {
    document.getElementById("titulo-endereco").textContent = "Endereço de entrega";
    document.getElementById("pedido-endereco").textContent = "CEP " + pedido.cep + " — " + pedido.regiaoEntrega;
  } else {
    document.getElementById("titulo-endereco").textContent = "Retirada";
    document.getElementById("pedido-endereco").textContent = "Retirada no balcão da Fitzzaria";
  }

  document.getElementById("btnFalarLoja").href = "tel:" + FITZZ.estabelecimento.telefone;

  const finalizado =
    pedido.statusAtual === FITZZ.statusPedido.RETIRADO || pedido.statusAtual === FITZZ.statusPedido.ENTREGUE;

  if (finalizado && intervaloAcompanhamento !== null) {
    clearInterval(intervaloAcompanhamento);
    intervaloAcompanhamento = null;
  }
}

function buscarPedidoDigitado() {
  const codigo = document.getElementById("inputCodigo").value.trim().toUpperCase();
  if (codigo === "") {
    return;
  }
  buscarEExibirPedido(codigo);
}

function buscarEExibirPedido(codigo) {
  const pedido = buscarPedidoPorId(codigo);

  if (pedido === null) {
    document.getElementById("msgNaoEncontrado").classList.remove("d-none");
    return;
  }

  document.getElementById("msgNaoEncontrado").classList.add("d-none");
  renderizarPedido(pedido);

  intervaloAcompanhamento = setInterval(function () {
    const pedidoAtualizado = buscarPedidoPorId(codigo);
    if (pedidoAtualizado !== null) {
      renderizarPedido(pedidoAtualizado);
    }
  }, 2500);
}

const parametros = new URLSearchParams(window.location.search);
const codigoNaUrl = parametros.get("pedido");
if (codigoNaUrl) {
  document.getElementById("inputCodigo").value = codigoNaUrl;
  buscarEExibirPedido(codigoNaUrl);
}
