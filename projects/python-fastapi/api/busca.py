"""Recuperação de trechos com BM25 — a metade do RAG que decide a qualidade.

Quase toda conversa sobre RAG gira em torno do modelo de linguagem. Mas o
modelo só responde com o que recebe: se a recuperação trouxer o trecho errado,
nenhum modelo salva. A parte que determina a qualidade da resposta acontece
ANTES do LLM, e é ela que está aqui.

O ranqueamento é BM25, o mesmo algoritmo por trás do Elasticsearch e do
Lucene. Sem dependência: é aritmética sobre contagem de termos.
"""

from __future__ import annotations

import math
import re
import unicodedata
from dataclasses import dataclass, field

# --------------------------------------------------------------- tokenização

# Palavras que aparecem em quase toda frase e não ajudam a distinguir trecho.
# Manter é pior que remover: elas inflam a pontuação de documentos longos.
VAZIAS = {
    "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos",
    "das", "em", "no", "na", "nos", "nas", "por", "para", "pra", "com", "sem",
    "sobre", "e", "ou", "mas", "que", "se", "ao", "aos", "à", "às", "pelo",
    "pela", "ser", "é", "são", "foi", "era", "tem", "ter", "há", "como",
    "quando", "onde", "qual", "quais", "quem", "isso", "isto", "esse", "essa",
    "este", "esta", "eu", "você", "ele", "ela", "meu", "minha", "seu", "sua",
    "já", "não", "sim", "mais", "menos", "muito", "também", "só", "então",
}


def normalizar(texto: str) -> str:
    """Tira acento e caixa.

    Sem isto, "manutenção" e "manutencao" seriam termos diferentes — e quem
    digita rápido não coloca acento.
    """
    sem_acento = unicodedata.normalize("NFKD", texto)
    sem_acento = "".join(c for c in sem_acento if not unicodedata.combining(c))
    return sem_acento.lower()


def tokenizar(texto: str) -> list[str]:
    bruto = re.findall(r"[a-z0-9]+", normalizar(texto))
    return [t for t in bruto if len(t) > 1 and t not in VAZIAS]


# ------------------------------------------------------------------ trechos


@dataclass
class Trecho:
    """Um pedaço indexável de um documento."""

    id: str
    documento: str
    secao: str
    texto: str
    url: str | None = None
    termos: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        # O título da seção entra na indexação: ele costuma carregar o termo
        # exato que a pessoa digita, e o corpo nem sempre repete.
        self.termos = tokenizar(self.secao + " " + self.texto)


def fatiar(documento: str, markdown: str, url: str | None = None) -> list[Trecho]:
    """Quebra um texto em trechos, um por seção.

    A escolha do tamanho do pedaço é a decisão mais subestimada do RAG. Pedaço
    grande demais dilui o assunto e traz ruído junto; pequeno demais perde o
    contexto que dava sentido à frase. Cortar por seção respeita a estrutura
    que o autor já criou, em vez de partir a cada N caracteres.
    """
    trechos: list[Trecho] = []
    secao_atual = documento
    corpo: list[str] = []
    indice = 0

    def fechar() -> None:
        nonlocal corpo, indice
        conteudo = " ".join(l.strip() for l in corpo).strip()
        if conteudo:
            indice += 1
            trechos.append(
                Trecho(
                    id=f"{documento}#{indice}",
                    documento=documento,
                    secao=secao_atual,
                    texto=conteudo,
                    url=url,
                )
            )
        corpo = []

    for linha in markdown.strip().splitlines():
        if linha.startswith("## "):
            fechar()
            secao_atual = linha[3:].strip()
        else:
            corpo.append(linha)

    fechar()
    return trechos


# --------------------------------------------------------------------- BM25


class Indice:
    """Índice BM25.

    k1 controla a saturação: a décima ocorrência de um termo vale bem menos
    que a segunda. b controla o peso do tamanho do trecho — sem ele, trecho
    longo venceria só por ter mais palavras.
    """

    def __init__(self, trechos: list[Trecho], k1: float = 1.5, b: float = 0.75):
        self.trechos = trechos
        self.k1 = k1
        self.b = b

        self.n = len(trechos)
        self.tamanhos = [len(t.termos) for t in trechos]
        self.tamanho_medio = (sum(self.tamanhos) / self.n) if self.n else 0.0

        # termo -> em quantos trechos ele aparece
        self.frequencia_doc: dict[str, int] = {}
        # termo -> {indice do trecho: quantas vezes}
        self.postings: dict[str, dict[int, int]] = {}

        for i, trecho in enumerate(trechos):
            vistos: dict[str, int] = {}
            for termo in trecho.termos:
                vistos[termo] = vistos.get(termo, 0) + 1
            for termo, quantas in vistos.items():
                self.frequencia_doc[termo] = self.frequencia_doc.get(termo, 0) + 1
                self.postings.setdefault(termo, {})[i] = quantas

    def idf(self, termo: str) -> float:
        """Termo raro vale mais que termo comum.

        Esta é a ideia inteira da recuperação: "agendamento" distingue um
        trecho, "sistema" não distingue nada.
        """
        n_docs = self.frequencia_doc.get(termo, 0)
        if n_docs == 0:
            return 0.0
        return math.log(1 + (self.n - n_docs + 0.5) / (n_docs + 0.5))

    def buscar(self, consulta: str, limite: int = 4) -> list[dict]:
        termos = tokenizar(consulta)
        if not termos:
            return []

        pontos: dict[int, float] = {}
        # Guarda quanto cada termo contribuiu, para a página poder explicar
        # POR QUE aquele trecho venceu — e não só afirmar que venceu.
        detalhe: dict[int, dict[str, float]] = {}

        for termo in termos:
            posting = self.postings.get(termo)
            if not posting:
                continue

            peso_termo = self.idf(termo)

            for i, freq in posting.items():
                norma = 1 - self.b + self.b * (self.tamanhos[i] / self.tamanho_medio)
                contribuicao = peso_termo * (freq * (self.k1 + 1)) / (freq + self.k1 * norma)
                pontos[i] = pontos.get(i, 0.0) + contribuicao
                detalhe.setdefault(i, {})[termo] = round(contribuicao, 3)

        ordenados = sorted(pontos.items(), key=lambda p: p[1], reverse=True)[:limite]

        return [
            {
                "id": self.trechos[i].id,
                "documento": self.trechos[i].documento,
                "secao": self.trechos[i].secao,
                "texto": self.trechos[i].texto,
                "url": self.trechos[i].url,
                "pontos": round(pontos_i, 3),
                "porque": dict(
                    sorted(detalhe[i].items(), key=lambda p: p[1], reverse=True)
                ),
            }
            for i, pontos_i in ordenados
        ]

    def termos_sem_resultado(self, consulta: str) -> list[str]:
        """Termos da pergunta que não existem em trecho nenhum.

        É o diagnóstico mais útil que uma busca pode dar: quando a resposta vem
        ruim, quase sempre é porque a pessoa usou uma palavra que o texto não
        usa — e o BM25, sendo lexical, não sabe que são sinônimos.
        """
        return [t for t in tokenizar(consulta) if t not in self.frequencia_doc]
