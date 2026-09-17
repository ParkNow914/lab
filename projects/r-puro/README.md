# As estatísticas concordam. Os dados não.

O quarteto de Anscombe e uma demonstração de alavanca, rodando em R de
verdade — `lm()`, `cor()` e o dispositivo gráfico — dentro do navegador de
quem visita, via WebR.

## O que a página mostra

**Anscombe I a IV.** Quatro conjuntos com a mesma média de x e de y, o mesmo
desvio, a mesma correlação (0,816), a mesma reta (`y = 3,00 + 0,50·x`) e o
mesmo p-valor (0,0022). O II é uma parábola. O III é uma reta exata com um
ponto errado. O IV não tem relação nenhuma: um só ponto produz toda a
correlação. Só o gráfico distingue um do outro.

**Alavanca.** Dez pontos sem tendência (r = 0,20, p = 0,56) mais um ponto
solitário em x = 20, cuja altura você controla. Leve-o a 30 e o resultado fica:

```
r  = 0,817        R² = 0,667
p  = 0,0022       IC 95% da inclinação = [0,46 ; 1,52]
```

Significativo, publicável, e produzido por **um** ponto. É o mesmo r do
quarteto, por coincidência — e a coincidência é o argumento.

## A decisão técnica que importa: o canal do WebR

O canal padrão do WebR usa `SharedArrayBuffer`, que só existe em página
**isolada de origem cruzada** — ou seja, servida com `COOP` e `COEP`. O GitHub
Pages não manda esses cabeçalhos e não dá para configurá-los.

Pior: o servidor de teste do laboratório *manda*. Com o canal padrão, esta
página passaria no teste e quebraria em produção, que é o pior lugar para
descobrir. Por isso o canal é fixado explicitamente:

```js
const webR = new WebR({ channelType: 3 });   // 3 = PostMessage
```

O PostMessage não suporta funções que bloqueiam esperando entrada
(`readline()`), o que aqui não faz falta: a página só avalia expressões e
captura gráficos.

## Outros detalhes

**O tema escuro vive no R, não no CSS.** O gráfico é um bitmap gerado pelo
dispositivo gráfico do R, então cor de fundo, de eixo e de texto são
argumentos de `par()` — CSS não alcança pixel de imagem.

**Um pedido pendente, não uma fila.** Arrastar o controle dispara dezenas de
avaliações e o R é sequencial. A página guarda no máximo *um* pedido pendente;
sem isso a fila cresce sem limite e o gráfico continua desenhando estado velho
depois que o dedo já saiu do controle.

**~30 MB na primeira visita.** É o interpretador inteiro. A página diz isso
enquanto baixa, em vez de mostrar um retângulo vazio.
