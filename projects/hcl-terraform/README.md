# Infraestrutura como código com plano visual

**HCL + Terraform** · Roda no navegador

Stack completa descrita em HCL, com o grafo de dependência e o `plan` mostrando exatamente o que seria criado, alterado ou destruído.

## Por que este projeto

É como eu provisiono infraestrutura de cliente. O `plan` antes do `apply` é a rede de segurança que evita derrubar produção.

## Como roda

- **Execução:** Página estática, sem servidor
- **Toolchain:** `Terraform + grafo D3`

## Build

Nenhum. Parser, grafo e plan sao JavaScript puro em `hcl.js`, sem dependencia.

## O que existe aqui

1. **Parser de HCL** — blocos com rotulos, atributos, strings com interpolacao,
   numeros, booleanos, listas, mapas e comentarios. Reporta linha no erro.
2. **Grafo de dependencia** — deduzido das REFERENCIAS, nao declarado. Escrever
   `${aws_vpc.principal.id}` ja e dizer "isto vem depois daquilo". E por isso
   que o grafo sai de graca.
3. **Ordenacao em camadas** — camada 0 nao depende de ninguem; tudo dentro de
   uma camada pode ser criado em paralelo. E assim que o Terraform paraleliza.
4. **Plan** — compara estado com configuracao e diz o que seria criado,
   alterado (campo a campo) ou destruido. Nao executa nada; esse e o ponto.

## Deteccao de ciclo

Quando nao sobra ordem possivel, nao basta listar quem ficou de fora: a maioria
so esta **bloqueada** por depender de quem esta preso. O `acharCiclo` faz busca
em profundidade e devolve o caminho que volta para si mesmo, separado dos
bloqueados.

No cenario 4 a saida e:

```
aws_vpc.principal -> aws_subnet.publica -> aws_vpc.principal
5 recurso(s) bloqueado(s): aws_subnet.privada, aws_security_group.web, ...
```

Dizer "ciclo entre <os 7>" mandaria a pessoa procurar o problema no lugar
errado.

## Verificado no navegador

| cenario | plano |
|---|---|
| do zero | 7 a criar, 5 camadas no grafo |
| mudanca pequena | 1 a alterar: `t4g.small -> t4g.medium`, `2 -> 4` |
| remocao perigosa | 1 a destruir + 1 alterado (quem dependia dele) |
| ciclo | ciclo de 2 nos identificado, 5 bloqueados separados |

## Publicado em

<https://autarktech.com.br/lab/hcl-terraform/>
