/* ============================================================
   FVS Advogados — Calculadoras jurídicas
   Toda a lógica roda 100% no navegador. Nenhum dado é enviado
   a servidor. Estimativas simplificadas — não são parecer jurídico.
   ============================================================ */
(function () {
  "use strict";

  var BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function fmt(v) {
    return BRL.format(Math.max(0, Math.round(v * 100) / 100));
  }

  /* ---------- Abas ---------- */
  var tabs = document.querySelectorAll(".calc-tab");
  var panels = document.querySelectorAll(".calc-panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.setAttribute("aria-selected", "false"); });
      panels.forEach(function (p) { p.classList.remove("is-active"); });
      tab.setAttribute("aria-selected", "true");
      var panel = document.getElementById(tab.getAttribute("aria-controls"));
      if (panel) panel.classList.add("is-active");
    });
  });

  /* ---------- Validação ---------- */
  function getNumber(input, opts) {
    opts = opts || {};
    var field = input.closest(".field");
    var raw = input.value.replace(/\./g, "").replace(",", ".");
    var v = parseFloat(raw);
    var invalid =
      (input.value.trim() === "" && !opts.optional) ||
      (input.value.trim() !== "" && (isNaN(v) || v < 0)) ||
      (opts.max != null && v > opts.max);
    if (input.value.trim() === "" && opts.optional) v = opts.fallback != null ? opts.fallback : 0;
    if (field) {
      field.classList.toggle("has-error", invalid);
      input.setAttribute("aria-invalid", invalid ? "true" : "false");
    }
    return invalid ? null : v;
  }

  function clearErrors(form) {
    form.querySelectorAll(".field.has-error").forEach(function (f) {
      f.classList.remove("has-error");
    });
  }

  function renderLines(el, lines, total, note) {
    var html = '<ul class="result-lines">';
    lines.forEach(function (l) {
      html += '<li class="' + (l.muted ? "is-muted" : "") + '"><span>' + l.label + "</span><span>" + l.value + "</span></li>";
    });
    html += "</ul>";
    if (total) {
      html += '<div class="result-total"><span>' + total.label + '</span><span class="value">' + total.value + "</span></div>";
    }
    if (note) html += '<p class="result-note">' + note + "</p>";
    el.innerHTML = html;
  }

  /* ============================================================
     A) TRABALHISTA — verbas rescisórias (fórmulas simplificadas)
     ============================================================ */
  var formTrab = document.getElementById("form-trabalhista");
  if (formTrab) {
    formTrab.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors(formTrab);

      var salario = getNumber(document.getElementById("trab-salario"));
      var anos = getNumber(document.getElementById("trab-anos"));
      var meses = getNumber(document.getElementById("trab-meses"), { max: 11 });
      var tipo = document.getElementById("trab-tipo").value;
      var dias = getNumber(document.getElementById("trab-dias"), { optional: true, fallback: 0, max: 31 });

      if (salario === null || anos === null || meses === null || dias === null || salario <= 0) {
        if (salario !== null && salario <= 0) {
          var f = document.getElementById("trab-salario").closest(".field");
          f.classList.add("has-error");
        }
        return;
      }

      var mesesTotais = anos * 12 + meses;
      var out = document.getElementById("result-trabalhista");
      var lines = [];
      var total = 0;

      // Saldo de salário: dias trabalhados × salário/30
      var saldo = (dias * salario) / 30;
      lines.push({ label: "Saldo de salário (" + dias + " dia" + (dias === 1 ? "" : "s") + ")", value: fmt(saldo) });
      total += saldo;

      // Aviso prévio indenizado: 30 dias + 3 por ano completo (máx. 90) — só sem justa causa
      var aviso = 0;
      if (tipo === "sem_justa_causa") {
        var diasAviso = Math.min(90, 30 + 3 * Math.floor(anos));
        aviso = (salario / 30) * diasAviso;
        lines.push({ label: "Aviso prévio indenizado (" + diasAviso + " dias)", value: fmt(aviso) });
        total += aviso;
      } else {
        lines.push({ label: "Aviso prévio indenizado", value: "não devido", muted: true });
      }

      // 13º e férias proporcionais: meses no ano corrente (simplificação: resto do tempo total)
      var mesesAno = mesesTotais % 12;
      if (mesesAno === 0 && mesesTotais > 0) mesesAno = 12;
      if (tipo === "justa_causa") {
        lines.push({ label: "13º proporcional", value: "não devido", muted: true });
        lines.push({ label: "Férias proporcionais + 1/3", value: "não devidas", muted: true });
      } else {
        var decimo = (mesesAno / 12) * salario;
        lines.push({ label: "13º salário proporcional (" + mesesAno + "/12)", value: fmt(decimo) });
        total += decimo;

        var ferias = (mesesAno / 12) * salario * (4 / 3);
        lines.push({ label: "Férias proporcionais + 1/3 (" + mesesAno + "/12)", value: fmt(ferias) });
        total += ferias;
      }

      // FGTS estimado: 8% × salário × meses; multa 40% (sem justa causa) ou 20% (acordo)
      var fgts = 0.08 * salario * mesesTotais;
      var multa = 0;
      if (tipo === "sem_justa_causa") multa = 0.4 * fgts;
      if (tipo === "acordo") multa = 0.2 * fgts;

      if (tipo === "sem_justa_causa" || tipo === "acordo") {
        lines.push({ label: "FGTS acumulado estimado (8%/mês)", value: fmt(fgts) });
        lines.push({ label: "Multa do FGTS (" + (tipo === "acordo" ? "20%" : "40%") + ")", value: fmt(multa) });
        total += fgts + multa;
      } else {
        lines.push({
          label: "Saldo FGTS estimado (sem saque imediato nesta modalidade)",
          value: fmt(fgts),
          muted: true
        });
      }

      var notas = {
        sem_justa_causa: "Estimativa para dispensa sem justa causa, incluindo saque do FGTS + multa de 40%.",
        pedido: "No pedido de demissão não há aviso indenizado pela empresa, multa nem saque imediato do FGTS.",
        justa_causa: "Na justa causa são devidos, em regra, apenas o saldo de salário e eventuais férias vencidas.",
        acordo: "No acordo (art. 484-A da CLT) a multa do FGTS é de 20% e o saque é parcial (80% do saldo)."
      };

      renderLines(out, lines, { label: "Total estimado", value: fmt(total) }, notas[tipo]);
      document.getElementById("cta-trabalhista").hidden = false;
    });
  }

  /* ============================================================
     B) CÍVEL — atualização monetária + juros de mora simples
     ============================================================ */
  var formCivel = document.getElementById("form-civel");
  if (formCivel) {
    // Pré-preenche a data de hoje (editável)
    var hojeInput = document.getElementById("civel-data-fim");
    if (hojeInput && !hojeInput.value) {
      hojeInput.value = new Date().toISOString().slice(0, 10);
    }

    formCivel.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors(formCivel);

      var valor = getNumber(document.getElementById("civel-valor"));
      var juros = getNumber(document.getElementById("civel-juros"));
      var correcao = getNumber(document.getElementById("civel-correcao"));
      var iniEl = document.getElementById("civel-data-ini");
      var fimEl = document.getElementById("civel-data-fim");
      var ini = iniEl.value ? new Date(iniEl.value + "T12:00:00") : null;
      var fim = fimEl.value ? new Date(fimEl.value + "T12:00:00") : null;

      var dateErr = !ini || !fim || fim < ini;
      iniEl.closest(".field").classList.toggle("has-error", !ini || dateErr);
      fimEl.closest(".field").classList.toggle("has-error", !fim || dateErr);
      if (valor === null || juros === null || correcao === null || dateErr || valor <= 0) return;

      var mesesDecorridos = (fim - ini) / (1000 * 60 * 60 * 24 * 30);
      var corrigido = valor * Math.pow(1 + correcao / 100, mesesDecorridos);
      var jurosValor = valor * (juros / 100) * mesesDecorridos;
      var totalCivel = corrigido + jurosValor;

      renderLines(
        document.getElementById("result-civel"),
        [
          { label: "Valor original", value: fmt(valor) },
          { label: "Período decorrido", value: mesesDecorridos.toFixed(1).replace(".", ",") + " meses" },
          { label: "Correção monetária composta", value: fmt(corrigido - valor) },
          { label: "Juros de mora simples (" + String(juros).replace(".", ",") + "% a.m.)", value: fmt(jurosValor) }
        ],
        { label: "Valor atualizado estimado", value: fmt(totalCivel) },
        "Índices oficiais (IPCA, INPC, SELIC etc.) variam mês a mês; aqui usamos taxa média constante."
      );
      document.getElementById("cta-civel").hidden = false;
    });
  }

  /* ============================================================
     C) PREVIDENCIÁRIA — triagem qualitativa (regra geral pós-Reforma)
     Idade mínima: 62 (F) / 65 (M) • Contribuição mínima: 15 (F) / 20 (M)
     ============================================================ */
  var formPrev = document.getElementById("form-prev");
  if (formPrev) {
    formPrev.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors(formPrev);

      var sexo = document.getElementById("prev-sexo").value;
      var idade = getNumber(document.getElementById("prev-idade"), { max: 120 });
      var anosC = getNumber(document.getElementById("prev-anos"));
      var mesesC = getNumber(document.getElementById("prev-meses"), { max: 11 });
      if (idade === null || anosC === null || mesesC === null) return;

      var idadeMin = sexo === "F" ? 62 : 65;
      var contribMin = sexo === "F" ? 15 : 20;
      var contribTotal = anosC + mesesC / 12;

      function faltamAnos(n) {
        var inteiro = Math.floor(n);
        var mesesRest = Math.ceil((n - inteiro) * 12);
        if (mesesRest === 12) { inteiro += 1; mesesRest = 0; }
        var parts = [];
        if (inteiro > 0) parts.push(inteiro + " ano" + (inteiro === 1 ? "" : "s"));
        if (mesesRest > 0) parts.push(mesesRest + " " + (mesesRest === 1 ? "mês" : "meses"));
        return parts.length ? parts.join(" e ") : "menos de 1 mês";
      }

      var okIdade = idade >= idadeMin;
      var okContrib = contribTotal >= contribMin;

      var lines = [
        {
          label: "Idade mínima (" + idadeMin + " anos)",
          value: okIdade ? "✓ requisito atendido" : "faltam " + faltamAnos(idadeMin - idade)
        },
        {
          label: "Contribuição mínima (" + contribMin + " anos)",
          value: okContrib ? "✓ requisito atendido" : "faltam " + faltamAnos(contribMin - contribTotal)
        }
      ];

      var nota;
      if (okIdade && okContrib) {
        nota = "Pelos critérios gerais da regra permanente, você já pode ter direito à aposentadoria programada. Uma análise do seu CNIS confirmará o melhor momento e o melhor valor.";
      } else {
        nota = "Atenção: existem regras de transição (pedágio, pontos, idade progressiva) que podem antecipar sua aposentadoria em relação à regra geral. Vale a pena analisar seu histórico completo de contribuições.";
      }

      renderLines(document.getElementById("result-prev"), lines, null, nota);
      document.getElementById("cta-prev").hidden = false;
    });
  }
})();
