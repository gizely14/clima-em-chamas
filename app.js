const locais = {
  Brasil: [-15.78, -47.93],
  Amazonas: [-3.1, -60.0],
  Pará: [-1.45, -48.5],
  Pernambuco: [-8.05, -34.9],
  'Mato Grosso': [-15.6, -56.1],
  'São Paulo': [-23.55, -46.63],
  Bahia: [-12.97, -38.5],
  Rondônia: [-8.76, -63.9]
};

const back4app = {
  url: 'https://parseapi.back4app.com',
  appId: 'SEU_APP_ID',
  chave: 'SUA_JAVASCRIPT_KEY',
  classe: 'Anotacoes'
};

let graficoTemperatura;
let graficoEstados;
let graficoBiomas;
let dadosFocos = null;
let notas = [];

const cores = ['#f47745', '#f5bd58', '#65a88b', '#5da6c7', '#9b83c8', '#e58a9a'];
const pegar = id => document.getElementById(id);

function prepararAnos() {
  const atual = new Date().getFullYear();
  for (let ano = 2019; ano <= atual - 1; ano++) {
    pegar('anoInicio').add(new Option(ano, ano));
    pegar('anoFim').add(new Option(ano, ano));
  }
  pegar('anoInicio').value = '2019';
  pegar('anoFim').value = String(atual - 1);
}

function opcoesGrafico() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        title: { display: true, text: 'Ano' }
      },
      y: {
        beginAtZero: false,
        grid: { color: '#edf1ef' },
        title: { display: true, text: 'Temperatura média (°C)' }
      }
    }
  };
}

async function buscarTemperatura() {
  const local = locais[pegar('estado').value];
  const inicio = pegar('anoInicio').value;
  const fim = pegar('anoFim').value;
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${local[0]}&longitude=${local[1]}&start_date=${inicio}-01-01&end_date=${fim}-12-31&daily=temperature_2m_mean&timezone=auto`;

  try {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error('Não foi possível consultar a API.');
    const dados = await resposta.json();
    const medias = {};

    dados.daily.time.forEach((data, i) => {
      const ano = data.slice(0, 4);
      if (!medias[ano]) medias[ano] = [];
      if (dados.daily.temperature_2m_mean[i] !== null) medias[ano].push(dados.daily.temperature_2m_mean[i]);
    });

    const anos = Object.keys(medias).sort();
    const valores = anos.map(ano => {
      const lista = medias[ano];
      return lista.reduce((soma, valor) => soma + valor, 0) / lista.length;
    });

    if (graficoTemperatura) graficoTemperatura.destroy();
    graficoTemperatura = new Chart(pegar('graficoTemperatura'), {
      type: 'line',
      data: {
        labels: anos,
        datasets: [{
          label: 'Temperatura média (°C)',
          data: valores,
          borderColor: '#f47745',
          backgroundColor: '#f4774522',
          fill: true,
          tension: 0.3,
          pointRadius: 4
        }]
      },
      options: opcoesGrafico()
    });
  } catch (erro) {
    pegar('graficoTemperatura').parentElement.innerHTML = '<p class="vazio">Não foi possível carregar os dados de temperatura. Tente novamente.</p>';
  }
}

function nomeEstado(valor) {
  const estados = {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
    BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal',
    ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
    MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba',
    PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
    RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
    SC: 'Santa Catarina', SE: 'Sergipe', TO: 'Tocantins'
  };
  return estados[valor.toUpperCase()] || valor;
}

async function carregarFocos() {
  try {
    const resposta = await fetch('./data/focos-2025.json');
    if (!resposta.ok) throw new Error('Não foi possível carregar a base do INPE.');
    dadosFocos = await resposta.json();
    mostrarFocos();
  } catch (erro) {
    pegar('resultadoImportacao').textContent =
      'Erro ao carregar os dados do INPE. Verifique se a pasta data foi publicada junto com o site.';
  }
}

function mostrarFocos() {
  if (!dadosFocos) return;

  const anoInicio = Number(pegar('anoInicio').value);
  const anoFim = Number(pegar('anoFim').value);
  const estadoEscolhido = pegar('estado').value;
  const anoIncluido = anoInicio <= dadosFocos.ano && anoFim >= dadosFocos.ano;

  let listaEstados = [];
  let listaBiomas = [];
  let totalFiltrado = 0;

  if (anoIncluido) {
    if (estadoEscolhido === 'Brasil') {
      listaEstados = dadosFocos.porEstado.map(item => [item.estado, item.focos]);
      listaBiomas = dadosFocos.porBioma.map(item => [item.bioma, item.focos]);
      totalFiltrado = dadosFocos.totalFocos;
    } else {
      listaBiomas = dadosFocos.porEstadoEBioma
        .filter(item => nomeEstado(item.estado) === estadoEscolhido)
        .map(item => [item.bioma, item.focos]);
      totalFiltrado = listaBiomas.reduce((soma, item) => soma + item[1], 0);
      listaEstados = totalFiltrado ? [[estadoEscolhido, totalFiltrado]] : [];
    }
  }

  listaEstados = listaEstados.sort((a, b) => b[1] - a[1]).slice(0, 10);

  if (graficoEstados) graficoEstados.destroy();
  graficoEstados = new Chart(pegar('graficoEstados'), {
    type: 'bar',
    data: {
      labels: listaEstados.map(item => item[0]),
      datasets: [{
        label: 'Focos de calor',
        data: listaEstados.map(item => item[1]),
        backgroundColor: '#f47745',
        borderRadius: 7
      }]
    },
    options: {
      ...opcoesGrafico(),
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: 'Quantidade de focos de calor' }
        },
        y: {
          grid: { display: false },
          title: { display: true, text: 'Estado' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: contexto => `${contexto.parsed.x.toLocaleString('pt-BR')} focos`
          }
        }
      }
    }
  });

  if (graficoBiomas) graficoBiomas.destroy();
  graficoBiomas = new Chart(pegar('graficoBiomas'), {
    type: 'doughnut',
    data: {
      labels: listaBiomas.map(item => item[0]),
      datasets: [{
        data: listaBiomas.map(item => item[1]),
        backgroundColor: cores,
        borderWidth: 3,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: contexto => {
              const total = contexto.dataset.data.reduce((soma, valor) => soma + valor, 0);
              const quantidade = contexto.parsed;
              const percentual = total ? (quantidade / total * 100) : 0;
              return `${contexto.label}: ${quantidade.toLocaleString('pt-BR')} focos (${percentual.toFixed(1).replace('.', ',')}%)`;
            }
          }
        }
      }
    }
  });

  const semDados = !anoIncluido || totalFiltrado === 0;
  pegar('avisoEstados').hidden = !semDados;
  pegar('avisoBiomas').hidden = !semDados;
  pegar('avisoEstados').textContent = `Sem dados de focos para ${estadoEscolhido} no período selecionado. A base disponível contém dados de ${dadosFocos.ano}.`;
  pegar('avisoBiomas').textContent = `Sem dados de biomas para ${estadoEscolhido} no período selecionado. A base disponível contém dados de ${dadosFocos.ano}.`;
  pegar('resultadoImportacao').textContent =
    `${totalFiltrado.toLocaleString('pt-BR')} focos de calor em ${dadosFocos.ano} · Fonte: INPE.`;
}

function usarBack4App() {
  return back4app.appId !== 'SEU_APP_ID' && back4app.chave !== 'SUA_JAVASCRIPT_KEY';
}

async function pedirBack4App(caminho, metodo = 'GET', dados) {
  const resposta = await fetch(back4app.url + caminho, {
    method: metodo,
    headers: {
      'X-Parse-Application-Id': back4app.appId,
      'X-Parse-Javascript-Key': back4app.chave,
      'Content-Type': 'application/json'
    },
    body: dados ? JSON.stringify(dados) : undefined
  });
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.error || 'Erro ao acessar o Back4App.');
  return resultado;
}

function salvarLocal() {
  localStorage.setItem('anotacoesClima', JSON.stringify(notas));
}

async function carregarNotas() {
  if (usarBack4App()) {
    try {
      const dados = await pedirBack4App(`/classes/${back4app.classe}?order=-createdAt`);
      notas = dados.results.map(item => ({ titulo: item.title, data: item.date, local: item.region, categoria: item.category, descricao: item.description, id: item.objectId }));
      pegar('statusApi').textContent = 'Anotações sincronizadas com o Back4App.';
    } catch (erro) {
      notas = JSON.parse(localStorage.getItem('anotacoesClima') || '[]');
      pegar('statusApi').textContent = 'Não foi possível conectar ao Back4App. Os registros estão salvos neste navegador.';
    }
  } else {
    notas = JSON.parse(localStorage.getItem('anotacoesClima') || '[]');
  }
  mostrarNotas();
}

function mostrarNotas() {
  const busca = pegar('busca').value.toLowerCase();
  const lista = notas.filter(nota => `${nota.titulo} ${nota.local} ${nota.categoria} ${nota.descricao}`.toLowerCase().includes(busca));
  pegar('listaNotas').innerHTML = lista.map(nota => `
    <article class="nota">
      <small>${nota.categoria} · ${nota.data}</small>
      <h4>${nota.titulo}</h4>
      <p>${nota.local} — ${nota.descricao}</p>
      <div class="nota-acoes">
        <button onclick="editarNota('${nota.id}')">Editar</button>
        <button class="excluir" onclick="excluirNota('${nota.id}')">Excluir</button>
      </div>
    </article>`).join('');
  pegar('semNotas').hidden = lista.length > 0;
}

async function salvarNota(evento) {
  evento.preventDefault();
  const id = pegar('notaId').value;
  const nota = {
    titulo: pegar('notaTitulo').value,
    data: pegar('notaData').value,
    local: pegar('notaLocal').value,
    categoria: pegar('notaCategoria').value,
    descricao: pegar('notaDescricao').value
  };

  try {
    if (usarBack4App()) {
      const dados = { title: nota.titulo, date: nota.data, region: nota.local, category: nota.categoria, description: nota.descricao };
      if (id) await pedirBack4App(`/classes/${back4app.classe}/${id}`, 'PUT', dados);
      else await pedirBack4App(`/classes/${back4app.classe}`, 'POST', dados);
      await carregarNotas();
    } else {
      if (id) notas = notas.map(item => item.id === id ? { ...nota, id } : item);
      else notas.push({ ...nota, id: String(Date.now()) });
      salvarLocal();
      mostrarNotas();
    }
    pegar('formNota').reset();
    pegar('notaId').value = '';
    pegar('tituloFormulario').textContent = 'Nova anotação';
  } catch (erro) {
    pegar('statusApi').textContent = erro.message;
  }
}

function editarNota(id) {
  const nota = notas.find(item => item.id === id);
  if (!nota) return;
  pegar('notaId').value = id;
  pegar('notaTitulo').value = nota.titulo;
  pegar('notaData').value = nota.data;
  pegar('notaLocal').value = nota.local;
  pegar('notaCategoria').value = nota.categoria;
  pegar('notaDescricao').value = nota.descricao;
  pegar('tituloFormulario').textContent = 'Editar anotação';
  pegar('formNota').scrollIntoView({ behavior: 'smooth' });
}

async function excluirNota(id) {
  if (!confirm('Deseja excluir esta anotação?')) return;
  try {
    if (usarBack4App()) await pedirBack4App(`/classes/${back4app.classe}/${id}`, 'DELETE');
    notas = notas.filter(item => item.id !== id);
    if (!usarBack4App()) salvarLocal();
    mostrarNotas();
  } catch (erro) {
    pegar('statusApi').textContent = erro.message;
  }
}

pegar('filtrar').addEventListener('click', () => { buscarTemperatura(); mostrarFocos(); });
pegar('formNota').addEventListener('submit', salvarNota);
pegar('cancelar').addEventListener('click', () => {
  pegar('formNota').reset();
  pegar('notaId').value = '';
  pegar('tituloFormulario').textContent = 'Nova anotação';
});
pegar('busca').addEventListener('input', mostrarNotas);
pegar('menuMobile').addEventListener('click', () => pegar('menu').classList.toggle('aberto'));
document.querySelectorAll('#menu a').forEach(link => link.addEventListener('click', () => pegar('menu').classList.remove('aberto')));

prepararAnos();
pegar('notaData').value = new Date().toISOString().slice(0, 10);
buscarTemperatura();
carregarFocos();
carregarNotas();
