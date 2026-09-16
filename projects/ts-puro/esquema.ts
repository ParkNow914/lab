// Validador de esquema cujo tipo estatico nasce do proprio esquema.
//
// A ideia: `objeto({ nome: texto(), idade: numero() })` nao devolve um
// validador generico — devolve um `Esquema<{ nome: string; idade: number }>`.
// O tipo e DERIVADO da estrutura, nunca escrito a mao duas vezes.
//
// Isto e a parte do TypeScript que quase ninguem usa: tipos condicionais,
// tipos mapeados e inferencia com `infer`. O sistema de tipos e uma linguagem
// propria, e aqui ela esta sendo programada.

type Resultado<T> =
  | { ok: true; valor: T }
  | { ok: false; erros: string[] };

interface Esquema<T> {
  // Marcador que existe so no tipo: nunca e lido em tempo de execucao. E o que
  // permite ao `Inferir` abaixo puxar T de volta.
  readonly _saida: T;
  validar(v: unknown, caminho: string): Resultado<T>;
}

// `infer` captura o T de dentro de Esquema<T>. E o mecanismo que faz tudo
// abaixo funcionar.
type Inferir<E> = E extends Esquema<infer T> ? T : never;

type Campos = { [chave: string]: Esquema<any> };

// Chave cujo tipo aceita undefined vira chave OPCIONAL no objeto resultante.
// Sem isto, `apelido?: string` sairia como `apelido: string | undefined`, e o
// TypeScript exigiria escrever a chave mesmo para omiti-la.
type ChavesOpcionais<F extends Campos> = {
  [K in keyof F]: undefined extends Inferir<F[K]> ? K : never;
}[keyof F];

type ChavesExigidas<F extends Campos> = Exclude<keyof F, ChavesOpcionais<F>>;

// Achata "A & B" num objeto so, para o editor mostrar as chaves em vez da
// intersecao crua.
//
// O `T extends infer O ?` parece inutil — e nao e. Sem ele o TypeScript mantem
// o apelido preguicoso e exibe `Achatar<{...} & {}>` em vez do objeto
// resolvido, principalmente em esquema aninhado. Passar por `infer` forca a
// avaliacao na hora.
type Achatar<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type SaidaObjeto<F extends Campos> = Achatar<
  { [K in ChavesExigidas<F>]: Inferir<F[K]> } &
  { [K in ChavesOpcionais<F>]?: Inferir<F[K]> }
>;

// ---------------------------------------------------------------- texto

interface EsqTexto extends Esquema<string> {
  min(n: number): EsqTexto;
  max(n: number): EsqTexto;
  email(): EsqTexto;
  regex(re: RegExp, descricao: string): EsqTexto;
}

function texto(): EsqTexto {
  var regras: Array<(s: string, caminho: string) => string | null> = [];

  var esq: EsqTexto = {
    _saida: null as any,

    validar: function (v: unknown, caminho: string): Resultado<string> {
      if (typeof v !== "string") {
        return { ok: false, erros: [caminho + ": esperava texto, recebeu " + descrever(v)] };
      }
      var erros: string[] = [];
      for (var i = 0; i < regras.length; i++) {
        var e = regras[i](v, caminho);
        if (e) erros.push(e);
      }
      return erros.length ? { ok: false, erros: erros } : { ok: true, valor: v };
    },

    min: function (n: number) {
      regras.push(function (s, c) {
        return s.length < n ? c + ": precisa de pelo menos " + n + " caracteres (tem " + s.length + ")" : null;
      });
      return esq;
    },

    max: function (n: number) {
      regras.push(function (s, c) {
        return s.length > n ? c + ": passou de " + n + " caracteres" : null;
      });
      return esq;
    },

    email: function () {
      regras.push(function (s, c) {
        return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) ? null : c + ": e-mail inválido";
      });
      return esq;
    },

    regex: function (re: RegExp, descricao: string) {
      regras.push(function (s, c) {
        return re.test(s) ? null : c + ": " + descricao;
      });
      return esq;
    },
  };

  return esq;
}

// --------------------------------------------------------------- numero

interface EsqNumero extends Esquema<number> {
  min(n: number): EsqNumero;
  max(n: number): EsqNumero;
  inteiro(): EsqNumero;
}

function numero(): EsqNumero {
  var regras: Array<(n: number, caminho: string) => string | null> = [];

  var esq: EsqNumero = {
    _saida: null as any,

    validar: function (v: unknown, caminho: string): Resultado<number> {
      if (typeof v !== "number" || isNaN(v)) {
        return { ok: false, erros: [caminho + ": esperava número, recebeu " + descrever(v)] };
      }
      var erros: string[] = [];
      for (var i = 0; i < regras.length; i++) {
        var e = regras[i](v, caminho);
        if (e) erros.push(e);
      }
      return erros.length ? { ok: false, erros: erros } : { ok: true, valor: v };
    },

    min: function (n: number) {
      regras.push(function (x, c) { return x < n ? c + ": precisa ser no mínimo " + n : null; });
      return esq;
    },
    max: function (n: number) {
      regras.push(function (x, c) { return x > n ? c + ": precisa ser no máximo " + n : null; });
      return esq;
    },
    inteiro: function () {
      regras.push(function (x, c) { return x % 1 !== 0 ? c + ": precisa ser inteiro" : null; });
      return esq;
    },
  };

  return esq;
}

// ------------------------------------------------------------- booleano

function booleano(): Esquema<boolean> {
  return {
    _saida: null as any,
    validar: function (v: unknown, caminho: string): Resultado<boolean> {
      return typeof v === "boolean"
        ? { ok: true, valor: v }
        : { ok: false, erros: [caminho + ": esperava booleano, recebeu " + descrever(v)] };
    },
  };
}

// --------------------------------------------------------------- objeto

function objeto<F extends Campos>(campos: F): Esquema<SaidaObjeto<F>> {
  return {
    _saida: null as any,

    validar: function (v: unknown, caminho: string): Resultado<SaidaObjeto<F>> {
      if (typeof v !== "object" || v === null || Array.isArray(v)) {
        return { ok: false, erros: [caminho + ": esperava objeto, recebeu " + descrever(v)] };
      }

      var fonte = v as { [k: string]: unknown };
      var saida: any = {};
      var erros: string[] = [];

      for (var chave in campos) {
        if (!Object.prototype.hasOwnProperty.call(campos, chave)) continue;

        var sub = campos[chave].validar(fonte[chave], caminho ? caminho + "." + chave : chave);
        if (sub.ok) {
          // Chave ausente e opcional nao entra no resultado: escrever
          // `{ apelido: undefined }` nao e a mesma coisa que omitir a chave.
          if (sub.valor !== undefined) saida[chave] = sub.valor;
        } else {
          erros = erros.concat(sub.erros);
        }
      }

      return erros.length ? { ok: false, erros: erros } : { ok: true, valor: saida };
    },
  };
}

// ---------------------------------------------------------------- lista

function lista<E extends Esquema<any>>(item: E): Esquema<Inferir<E>[]> {
  return {
    _saida: null as any,

    validar: function (v: unknown, caminho: string): Resultado<Inferir<E>[]> {
      if (!Array.isArray(v)) {
        return { ok: false, erros: [caminho + ": esperava lista, recebeu " + descrever(v)] };
      }

      var saida: any[] = [];
      var erros: string[] = [];

      for (var i = 0; i < v.length; i++) {
        var sub = item.validar(v[i], caminho + "[" + i + "]");
        if (sub.ok) saida.push(sub.valor);
        else erros = erros.concat(sub.erros);
      }

      return erros.length ? { ok: false, erros: erros } : { ok: true, valor: saida };
    },
  };
}

// -------------------------------------------------------------- opcional

function opcional<E extends Esquema<any>>(dentro: E): Esquema<Inferir<E> | undefined> {
  return {
    _saida: null as any,
    validar: function (v: unknown, caminho: string): Resultado<Inferir<E> | undefined> {
      if (v === undefined || v === null) return { ok: true, valor: undefined };
      return dentro.validar(v, caminho);
    },
  };
}

// ------------------------------------------------------------------ uma

// Uniao: o primeiro que aceitar vence. O tipo resultante e a uniao dos tipos.
function uma<A extends Esquema<any>, B extends Esquema<any>>(
  a: A,
  b: B,
): Esquema<Inferir<A> | Inferir<B>> {
  return {
    _saida: null as any,
    validar: function (v: unknown, caminho: string): Resultado<Inferir<A> | Inferir<B>> {
      var ra = a.validar(v, caminho);
      if (ra.ok) return ra;
      var rb = b.validar(v, caminho);
      if (rb.ok) return rb;
      return { ok: false, erros: [caminho + ": não bate com nenhuma das formas aceitas"] };
    },
  };
}

// --------------------------------------------------------------- apoio

function descrever(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "nada";
  if (Array.isArray(v)) return "lista";
  return typeof v;
}
