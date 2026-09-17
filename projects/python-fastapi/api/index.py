"""API de busca com citação da fonte — a metade do RAG que decide a qualidade.

Roda como função serverless na Vercel. O índice é construído na inicialização
e vive na memória do processo: são poucos trechos, e manter em memória evita
uma consulta de rede por pergunta, que é justamente onde a latência apareceria.
"""

from __future__ import annotations

import time
from pathlib import Path

from fastapi import FastAPI, Query
from fastapi.responses import HTMLResponse, JSONResponse

try:
    # Local, rodando como pacote (`uvicorn api.index:app`).
    from .base import DOCUMENTOS
    from .busca import Indice, fatiar
except ImportError:
    # Na Vercel o arquivo é carregado como módulo solto, não como pacote:
    # import relativo falha e o diretório da função é que está no path.
    from base import DOCUMENTOS
    from busca import Indice, fatiar

app = FastAPI(
    title="Busca com citação — Laboratório Autark",
    description="A parte do RAG que acontece antes do modelo de linguagem.",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# --------------------------------------------------------------------- índice

_inicio = time.perf_counter()
TRECHOS = [t for nome, texto, url in DOCUMENTOS for t in fatiar(nome, texto, url)]
INDICE = Indice(TRECHOS)
_ms_indexacao = round((time.perf_counter() - _inicio) * 1000, 2)


# ----------------------------------------------------------------- endpoints


@app.get("/api/saude")
def saude() -> dict:
    return {
        "ok": True,
        "documentos": len(DOCUMENTOS),
        "trechos": len(TRECHOS),
        "termos_no_indice": len(INDICE.frequencia_doc),
        "tamanho_medio_trecho": round(INDICE.tamanho_medio, 1),
        "ms_indexacao": _ms_indexacao,
    }


@app.get("/api/buscar")
def buscar(
    q: str = Query("", description="a pergunta"),
    limite: int = Query(4, ge=1, le=10),
) -> JSONResponse:
    t0 = time.perf_counter()
    resultados = INDICE.buscar(q, limite=limite)
    ms = round((time.perf_counter() - t0) * 1000, 3)

    return JSONResponse(
        {
            "consulta": q,
            "ms": ms,
            "encontrados": len(resultados),
            # Termo que não existe em trecho nenhum é o diagnóstico mais útil
            # que uma busca pode dar: quase toda resposta ruim vem daí.
            "termos_ausentes": INDICE.termos_sem_resultado(q),
            "resultados": resultados,
            "total_trechos": len(TRECHOS),
        }
    )


@app.get("/", response_class=HTMLResponse)
def pagina() -> HTMLResponse:
    # O HTML mora ao lado como arquivo, e não numa string gigante aqui dentro.
    caminho = Path(__file__).parent / "pagina.html"
    return HTMLResponse(caminho.read_text(encoding="utf-8"))
