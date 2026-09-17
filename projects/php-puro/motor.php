<?php

// Sem `declare(strict_types=1)` de propósito: o php-wasm envolve o script antes
// de executar, e a declaração precisa ser a PRIMEIRA instrução do arquivo — o
// que ali nunca acontece. Manter a linha aqui deixaria este arquivo diferente
// do que realmente roda na página, e o ponto do laboratório é não ter essa
// diferença. Os tipos declarados em parâmetro e retorno continuam valendo.

/**
 * Motor de template com herança de layout — o núcleo do Blade, explicado.
 *
 * A ideia que quase ninguém conhece: um motor de template não interpreta o
 * template a cada requisição. Ele COMPILA o template para PHP puro uma vez, e
 * daí em diante quem roda é o próprio PHP, na velocidade dele.
 *
 * `{{ $nome }}` não é procurado num texto em tempo de execução: ele vira
 * `<?= e($nome) ?>` antes de qualquer coisa rodar.
 *
 * PHP 8 com tipos declarados, propriedade promovida no construtor, enum e
 * match — bem longe do PHP que deu fama ruim à linguagem nos anos 2000.
 */

enum Escape
{
    case Automatico;   // {{ ... }}  — escapa
    case Cru;          // {!! ... !!} — confia
}

final class ErroDeTemplate extends RuntimeException {}

final class Motor
{
    /** @param array<string,string> $templates nome => fonte */
    public function __construct(
        private array $templates,
    ) {}

    /** Compila o template para código PHP, sem executar nada. */
    public function compilar(string $nome): string
    {
        $fonte = $this->templates[$nome]
            ?? throw new ErroDeTemplate("template '{$nome}' não existe");

        // Herança primeiro: se estende alguém, o corpo vira só a coleção de
        // seções, e quem manda no HTML final é o layout.
        if (preg_match('/@extends\(\s*[\'"]([^\'"]+)[\'"]\s*\)/', $fonte, $m)) {
            $paiNome = $m[1];
            $fonte = preg_replace('/@extends\(\s*[\'"].+?[\'"]\s*\)/', '', $fonte, 1);

            $secoes = $this->extrairSecoes($fonte);
            $pai = $this->templates[$paiNome]
                ?? throw new ErroDeTemplate("layout '{$paiNome}' não existe");

            // @yield('x') no pai é trocado pelo conteúdo da seção do filho.
            $fonte = preg_replace_callback(
                '/@yield\(\s*[\'"]([^\'"]+)[\'"]\s*(?:,\s*[\'"](.*?)[\'"]\s*)?\)/',
                fn(array $m): string => $secoes[$m[1]] ?? ($m[2] ?? ''),
                $pai,
            );
        }

        return $this->traduzir($fonte);
    }

    /** Compila e executa, devolvendo o HTML. */
    public function render(string $nome, array $dados = []): string
    {
        $codigo = $this->compilar($nome);

        // O template vira uma closure: assim ele enxerga só o que foi passado,
        // e não as variáveis internas do motor.
        $executar = static function (string $__codigo, array $__dados): string {
            extract($__dados, EXTR_SKIP);
            ob_start();
            try {
                eval('?>' . $__codigo);
            } catch (Throwable $e) {
                ob_end_clean();
                throw new ErroDeTemplate('erro ao renderizar: ' . $e->getMessage(), 0, $e);
            }
            return (string) ob_get_clean();
        };

        return $executar($codigo, $dados);
    }

    /** @return array<string,string> */
    private function extrairSecoes(string $fonte): array
    {
        $secoes = [];

        // Forma longa: @section('x') ... @endsection
        // O nome usa [^\'"]+ e nao .+? de proposito: com .+? o motor de
        // regex recuava e casava `titulo", "Pedido #...` como se fosse o
        // nome, e o (.*?)@endsection seguinte devorava a secao de verdade
        // que vinha depois — a pagina renderizava sem o conteudo.
        preg_match_all(
            '/@section\(\s*[\'"]([^\'"]+)[\'"]\s*\)(.*?)@endsection/s',
            $fonte,
            $achados,
            PREG_SET_ORDER,
        );
        foreach ($achados as $a) {
            $secoes[$a[1]] = trim($a[2]);
        }

        // Forma curta: @section('titulo', 'Meu título')
        preg_match_all(
            '/@section\(\s*[\'"]([^\'"]+)[\'"]\s*,\s*[\'"](.*?)[\'"]\s*\)/',
            $fonte,
            $curtos,
            PREG_SET_ORDER,
        );
        foreach ($curtos as $c) {
            $secoes[$c[1]] ??= $c[2];
        }

        return $secoes;
    }

    /** Traduz as diretivas para PHP. A ordem importa. */
    private function traduzir(string $fonte): string
    {
        // @include inline, antes de tudo: o conteúdo incluído também precisa
        // passar pelas outras diretivas.
        $fonte = preg_replace_callback(
            '/@include\(\s*[\'"]([^\'"]+)[\'"]\s*\)/',
            fn(array $m): string => $this->templates[$m[1]]
                ?? throw new ErroDeTemplate("include '{$m[1]}' não existe"),
            $fonte,
        );

        $regras = [
            // Comentário de template: some do HTML final.
            '/\{\{--(.*?)--\}\}/s' => '',

            // Saída escapada e crua.
            '/\{\{\s*(.+?)\s*\}\}/s'     => '<?= e($1) ?>',
            '/\{!!\s*(.+?)\s*!!\}/s'     => '<?= $1 ?>',

            // Controle de fluxo.
            '/@if\s*\((.+?)\)/'          => '<?php if ($1): ?>',
            '/@elseif\s*\((.+?)\)/'      => '<?php elseif ($1): ?>',
            '/@else\b/'                  => '<?php else: ?>',
            '/@endif\b/'                 => '<?php endif; ?>',

            '/@foreach\s*\((.+?)\)/'     => '<?php foreach ($1): ?>',
            '/@endforeach\b/'            => '<?php endforeach; ?>',

            '/@for\s*\((.+?)\)/'         => '<?php for ($1): ?>',
            '/@endfor\b/'                => '<?php endfor; ?>',

            // @empty roda quando a coleção não tem nada.
            '/@forelse\s*\((.+?)\)/'     => '<?php foreach ($1): ?>',
            '/@empty\s*\((.+?)\)/'       => '<?php if (empty($1)): ?>',
            '/@endempty\b/'              => '<?php endif; ?>',

            // Bloco de PHP solto, para o caso raro em que faz falta.
            '/@php\b/'                   => '<?php ',
            '/@endphp\b/'                => ' ?>',
        ];

        foreach ($regras as $de => $para) {
            $fonte = preg_replace($de, $para, $fonte);
        }

        return trim($fonte);
    }
}

/**
 * Escape automático.
 *
 * É a razão de `{{ }}` existir em vez de `<?= ?>`: esquecer de escapar é o
 * erro mais comum e mais caro em template, e aqui é impossível esquecer —
 * a versão sem escape exige a sintaxe feia de propósito.
 */
function e(mixed $valor): string
{
    return htmlspecialchars((string) $valor, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
