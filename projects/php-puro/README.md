# Motor de template do zero

**PHP (puro)** · Roda no navegador · 0 dependências

O núcleo do Blade construído do zero em PHP 8: herança de layout, seções, include
e escape automático.

## Por que este projeto

PHP carrega fama de bagunça por causa de código dos anos 2000, não da linguagem
atual. Um motor de template limpo em PHP 8 — com tipos declarados, propriedade
promovida no construtor, `enum` e `throw` como expressão — desfaz isso. E mostra
o mecanismo por trás do framework mais contratado do mercado brasileiro.

## A ideia

Um motor de template não interpreta o template a cada requisição: ele **compila**
o template para PHP puro uma vez, e daí em diante quem roda é o próprio PHP, na
velocidade dele. `{{ $nome }}` vira `<?= e($nome) ?>` antes de qualquer coisa
executar.

É por isso que `{{ }}` existe em vez de `<?= ?>`: esquecer de escapar é o erro
mais comum e mais caro em template, e assim é impossível esquecer. A versão sem
escape, `{!! !!}`, tem sintaxe feia de propósito.

## Diretivas

```
@extends('layout')          @section('nome') … @endsection
@section('nome', 'valor')   @yield('nome', 'padrão')
@include('parcial')

@if(…) @elseif(…) @else @endif
@foreach(… as …) @endforeach      @for(…) @endfor
@empty($lista) … @endempty        @php … @endphp

{{ escapado }}   {!! cru !!}   {{-- comentário --}}
```

## Build

Nenhum. O php-wasm (PHP 8.4 compilado para WebAssembly) vem por CDN, e
`motor.php` é carregado como arquivo em vez de embutido na página — assim o que
se lê é exatamente o que roda.

## Três armadilhas que só apareceram testando

- **Regex com `.+?` no nome da diretiva.** A forma longa
  `@section('x') … @endsection` recuava e casava `titulo", "Pedido #…` como se
  fosse o nome, e o `(.*?)@endsection` seguinte devorava a seção de verdade. A
  página renderizava o layout sem conteúdo nenhum. O nome agora é `[^'"]+`.
- **`declare(strict_types=1)` não funciona aqui:** o php-wasm envolve o script
  antes de executar, então a declaração nunca é a primeira instrução. Foi
  removida do próprio arquivo, e não só do script gerado, para que o que se lê
  seja o que roda.
- **O interpretador guarda estado entre chamadas.** Reenviar o motor a cada
  rodada dava `Cannot redeclare function e()`. O motor é carregado **uma vez** na
  inicialização; cada rodada só instancia e usa — como um autoload de verdade.

## Verificado no navegador

| exemplo | resultado |
|---|---|
| herança de layout | layout e filho num arquivo só, tabela com 3 itens, `R$ 349,90` |
| escape automático | `{{ }}` → `&lt;script&gt;…`, `{!! !!}` → tag crua |
| include e lista vazia | parcial costurado, `@empty` acionado, comentário removido |

O HTML renderizado vai para um `iframe` com `sandbox`: nem mesmo o exemplo do
escape cru consegue executar algo na página.

## Publicado em

<https://autarktech.com.br/lab/php-puro/>
