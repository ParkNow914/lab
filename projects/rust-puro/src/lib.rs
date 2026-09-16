//! Uma linguagem de programacao completa: lexer, parser de descida recursiva e
//! interpretador de arvore. Sem `unsafe` fora da fronteira com o JavaScript e
//! sem nenhuma dependencia — nem `wasm-bindgen`.
//!
//! O ponto do projeto e o sistema de tipos trabalhando a favor: cada erro
//! possivel e um `enum`, cada operacao que pode falhar devolve `Result`, e o
//! `match` exaustivo faz o compilador recusar o codigo se eu esquecer um caso.
//! Um interpretador escrito assim nao tem como entrar em estado invalido.

use std::collections::HashMap;
use std::fmt;

// ============================================================ erros

#[derive(Debug)]
pub enum Erro {
    Lexico { linha: usize, msg: String },
    Sintaxe { linha: usize, msg: String },
    Execucao { linha: usize, msg: String },
}

impl fmt::Display for Erro {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let (tipo, linha, msg) = match self {
            Erro::Lexico { linha, msg } => ("erro léxico", linha, msg),
            Erro::Sintaxe { linha, msg } => ("erro de sintaxe", linha, msg),
            Erro::Execucao { linha, msg } => ("erro de execução", linha, msg),
        };
        write!(f, "linha {linha}: {tipo} — {msg}")
    }
}

type Res<T> = Result<T, Erro>;

// ============================================================ lexer

#[derive(Debug, Clone, PartialEq)]
enum Tk {
    Num(f64),
    Txt(String),
    Ident(String),
    // palavras-chave
    Seja, Se, Senao, Enquanto, Funcao, Devolva, Mostre, Verdadeiro, Falso,
    // simbolos
    Mais, Menos, Vezes, Dividido, Resto,
    Igual, IgualIgual, Diferente, Menor, MenorIgual, Maior, MaiorIgual,
    E, Ou, Nao,
    AbrePar, FechaPar, AbreChave, FechaChave, Virgula, PontoVirgula,
    Fim,
}

struct Lexer<'a> {
    fonte: std::iter::Peekable<std::str::Chars<'a>>,
    linha: usize,
}

impl<'a> Lexer<'a> {
    fn novo(fonte: &'a str) -> Self {
        Lexer { fonte: fonte.chars().peekable(), linha: 1 }
    }

    fn tokens(mut self) -> Res<Vec<(Tk, usize)>> {
        let mut saida = Vec::new();

        while let Some(&c) = self.fonte.peek() {
            match c {
                ' ' | '\t' | '\r' => { self.fonte.next(); }
                '\n' => { self.linha += 1; self.fonte.next(); }

                // Comentario ate o fim da linha.
                '#' => {
                    while let Some(&c) = self.fonte.peek() {
                        if c == '\n' { break; }
                        self.fonte.next();
                    }
                }

                '0'..='9' => saida.push((self.numero()?, self.linha)),
                '"' => saida.push((self.texto()?, self.linha)),
                c if c.is_alphabetic() || c == '_' => saida.push((self.palavra(), self.linha)),

                _ => {
                    let l = self.linha;
                    saida.push((self.simbolo()?, l));
                }
            }
        }

        saida.push((Tk::Fim, self.linha));
        Ok(saida)
    }

    fn numero(&mut self) -> Res<Tk> {
        let mut s = String::new();
        let mut ponto = false;
        while let Some(&c) = self.fonte.peek() {
            if c.is_ascii_digit() {
                s.push(c);
                self.fonte.next();
            } else if c == '.' && !ponto {
                ponto = true;
                s.push(c);
                self.fonte.next();
            } else {
                break;
            }
        }
        s.parse::<f64>()
            .map(Tk::Num)
            .map_err(|_| Erro::Lexico { linha: self.linha, msg: format!("número inválido: {s}") })
    }

    fn texto(&mut self) -> Res<Tk> {
        self.fonte.next(); // abre aspas
        let mut s = String::new();
        loop {
            match self.fonte.next() {
                Some('"') => return Ok(Tk::Txt(s)),
                Some('\\') => match self.fonte.next() {
                    Some('n') => s.push('\n'),
                    Some('t') => s.push('\t'),
                    Some(c) => s.push(c),
                    None => break,
                },
                Some('\n') => {
                    return Err(Erro::Lexico { linha: self.linha, msg: "texto sem aspas de fechamento".into() })
                }
                Some(c) => s.push(c),
                None => break,
            }
        }
        Err(Erro::Lexico { linha: self.linha, msg: "texto sem aspas de fechamento".into() })
    }

    fn palavra(&mut self) -> Tk {
        let mut s = String::new();
        while let Some(&c) = self.fonte.peek() {
            if c.is_alphanumeric() || c == '_' {
                s.push(c);
                self.fonte.next();
            } else {
                break;
            }
        }
        match s.as_str() {
            "seja" => Tk::Seja,
            "se" => Tk::Se,
            "senao" | "senão" => Tk::Senao,
            "enquanto" => Tk::Enquanto,
            "funcao" | "função" => Tk::Funcao,
            "devolva" => Tk::Devolva,
            "mostre" => Tk::Mostre,
            "verdadeiro" => Tk::Verdadeiro,
            "falso" => Tk::Falso,
            "e" => Tk::E,
            "ou" => Tk::Ou,
            "nao" | "não" => Tk::Nao,
            _ => Tk::Ident(s),
        }
    }

    fn simbolo(&mut self) -> Res<Tk> {
        let c = self.fonte.next().unwrap();
        // `==`, `<=`, `>=` e `!=` precisam espiar o proximo caractere.
        let dois = |lex: &mut Self, esperado: char| -> bool {
            if lex.fonte.peek() == Some(&esperado) { lex.fonte.next(); true } else { false }
        };

        Ok(match c {
            '+' => Tk::Mais,
            '-' => Tk::Menos,
            '*' => Tk::Vezes,
            '/' => Tk::Dividido,
            '%' => Tk::Resto,
            '(' => Tk::AbrePar,
            ')' => Tk::FechaPar,
            '{' => Tk::AbreChave,
            '}' => Tk::FechaChave,
            ',' => Tk::Virgula,
            ';' => Tk::PontoVirgula,
            '=' => if dois(self, '=') { Tk::IgualIgual } else { Tk::Igual },
            '!' => if dois(self, '=') { Tk::Diferente } else {
                return Err(Erro::Lexico { linha: self.linha, msg: "use != para diferente".into() })
            },
            '<' => if dois(self, '=') { Tk::MenorIgual } else { Tk::Menor },
            '>' => if dois(self, '=') { Tk::MaiorIgual } else { Tk::Maior },
            _ => return Err(Erro::Lexico { linha: self.linha, msg: format!("caractere inesperado: {c}") }),
        })
    }
}

// ============================================================ arvore

#[derive(Debug, Clone)]
enum Exp {
    Num(f64),
    Txt(String),
    Bool(bool),
    Var(String, usize),
    Bin(Box<Exp>, Tk, Box<Exp>, usize),
    Neg(Box<Exp>, usize),
    Nao(Box<Exp>),
    Chamada(String, Vec<Exp>, usize),
}

#[derive(Debug, Clone)]
enum Cmd {
    Seja(String, Exp),
    Atribui(String, Exp, usize),
    Mostre(Exp),
    Se(Exp, Vec<Cmd>, Option<Vec<Cmd>>),
    Enquanto(Exp, Vec<Cmd>, usize),
    Funcao(String, Vec<String>, Vec<Cmd>),
    Devolva(Option<Exp>),
    Expressao(Exp),
}

// ============================================================ parser

struct Parser {
    tk: Vec<(Tk, usize)>,
    pos: usize,
}

impl Parser {
    fn atual(&self) -> &Tk { &self.tk[self.pos].0 }
    fn linha(&self) -> usize { self.tk[self.pos].1 }

    fn avanca(&mut self) -> Tk {
        let t = self.tk[self.pos].0.clone();
        if self.pos < self.tk.len() - 1 { self.pos += 1; }
        t
    }

    fn aceita(&mut self, t: &Tk) -> bool {
        if self.atual() == t { self.avanca(); true } else { false }
    }

    fn exige(&mut self, t: Tk, o_que: &str) -> Res<()> {
        if self.aceita(&t) {
            Ok(())
        } else {
            Err(Erro::Sintaxe {
                linha: self.linha(),
                msg: format!("esperava {o_que}, encontrei {:?}", self.atual()),
            })
        }
    }

    fn programa(&mut self) -> Res<Vec<Cmd>> {
        let mut cmds = Vec::new();
        while *self.atual() != Tk::Fim {
            cmds.push(self.comando()?);
        }
        Ok(cmds)
    }

    fn bloco(&mut self) -> Res<Vec<Cmd>> {
        self.exige(Tk::AbreChave, "{")?;
        let mut cmds = Vec::new();
        while *self.atual() != Tk::FechaChave {
            if *self.atual() == Tk::Fim {
                return Err(Erro::Sintaxe { linha: self.linha(), msg: "faltou fechar } ".into() });
            }
            cmds.push(self.comando()?);
        }
        self.exige(Tk::FechaChave, "}")?;
        Ok(cmds)
    }

    fn comando(&mut self) -> Res<Cmd> {
        let linha = self.linha();

        match self.atual().clone() {
            Tk::Seja => {
                self.avanca();
                let nome = match self.avanca() {
                    Tk::Ident(n) => n,
                    outro => return Err(Erro::Sintaxe { linha, msg: format!("esperava um nome depois de 'seja', encontrei {outro:?}") }),
                };
                self.exige(Tk::Igual, "=")?;
                let e = self.expressao()?;
                self.aceita(&Tk::PontoVirgula);
                Ok(Cmd::Seja(nome, e))
            }

            Tk::Mostre => {
                self.avanca();
                let e = self.expressao()?;
                self.aceita(&Tk::PontoVirgula);
                Ok(Cmd::Mostre(e))
            }

            Tk::Se => {
                self.avanca();
                let cond = self.expressao()?;
                let entao = self.bloco()?;
                let senao = if self.aceita(&Tk::Senao) {
                    // `senao se` encadeado vira um bloco com um unico Se dentro.
                    if *self.atual() == Tk::Se {
                        Some(vec![self.comando()?])
                    } else {
                        Some(self.bloco()?)
                    }
                } else {
                    None
                };
                Ok(Cmd::Se(cond, entao, senao))
            }

            Tk::Enquanto => {
                self.avanca();
                let cond = self.expressao()?;
                let corpo = self.bloco()?;
                Ok(Cmd::Enquanto(cond, corpo, linha))
            }

            Tk::Funcao => {
                self.avanca();
                let nome = match self.avanca() {
                    Tk::Ident(n) => n,
                    outro => return Err(Erro::Sintaxe { linha, msg: format!("esperava o nome da função, encontrei {outro:?}") }),
                };
                self.exige(Tk::AbrePar, "(")?;
                let mut params = Vec::new();
                while *self.atual() != Tk::FechaPar {
                    match self.avanca() {
                        Tk::Ident(p) => params.push(p),
                        outro => return Err(Erro::Sintaxe { linha, msg: format!("parâmetro inválido: {outro:?}") }),
                    }
                    if !self.aceita(&Tk::Virgula) { break; }
                }
                self.exige(Tk::FechaPar, ")")?;
                let corpo = self.bloco()?;
                Ok(Cmd::Funcao(nome, params, corpo))
            }

            Tk::Devolva => {
                self.avanca();
                let e = if *self.atual() == Tk::PontoVirgula || *self.atual() == Tk::FechaChave {
                    None
                } else {
                    Some(self.expressao()?)
                };
                self.aceita(&Tk::PontoVirgula);
                Ok(Cmd::Devolva(e))
            }

            // Atribuicao a variavel existente: `x = ...`. Distinguir de uma
            // expressao exige espiar o token seguinte ao identificador.
            Tk::Ident(nome) if self.tk.get(self.pos + 1).map(|t| &t.0) == Some(&Tk::Igual) => {
                self.avanca();
                self.avanca();
                let e = self.expressao()?;
                self.aceita(&Tk::PontoVirgula);
                Ok(Cmd::Atribui(nome, e, linha))
            }

            _ => {
                let e = self.expressao()?;
                self.aceita(&Tk::PontoVirgula);
                Ok(Cmd::Expressao(e))
            }
        }
    }

    // Precedencia por escadinha de funcoes — cada nivel chama o mais apertado.
    fn expressao(&mut self) -> Res<Exp> { self.ou() }

    fn ou(&mut self) -> Res<Exp> {
        let mut e = self.e()?;
        while *self.atual() == Tk::Ou {
            let l = self.linha();
            self.avanca();
            e = Exp::Bin(Box::new(e), Tk::Ou, Box::new(self.e()?), l);
        }
        Ok(e)
    }

    fn e(&mut self) -> Res<Exp> {
        let mut e = self.comparacao()?;
        while *self.atual() == Tk::E {
            let l = self.linha();
            self.avanca();
            e = Exp::Bin(Box::new(e), Tk::E, Box::new(self.comparacao()?), l);
        }
        Ok(e)
    }

    fn comparacao(&mut self) -> Res<Exp> {
        let mut e = self.soma()?;
        loop {
            let op = self.atual().clone();
            match op {
                Tk::IgualIgual | Tk::Diferente | Tk::Menor | Tk::MenorIgual | Tk::Maior | Tk::MaiorIgual => {
                    let l = self.linha();
                    self.avanca();
                    e = Exp::Bin(Box::new(e), op, Box::new(self.soma()?), l);
                }
                _ => return Ok(e),
            }
        }
    }

    fn soma(&mut self) -> Res<Exp> {
        let mut e = self.produto()?;
        loop {
            let op = self.atual().clone();
            match op {
                Tk::Mais | Tk::Menos => {
                    let l = self.linha();
                    self.avanca();
                    e = Exp::Bin(Box::new(e), op, Box::new(self.produto()?), l);
                }
                _ => return Ok(e),
            }
        }
    }

    fn produto(&mut self) -> Res<Exp> {
        let mut e = self.unario()?;
        loop {
            let op = self.atual().clone();
            match op {
                Tk::Vezes | Tk::Dividido | Tk::Resto => {
                    let l = self.linha();
                    self.avanca();
                    e = Exp::Bin(Box::new(e), op, Box::new(self.unario()?), l);
                }
                _ => return Ok(e),
            }
        }
    }

    fn unario(&mut self) -> Res<Exp> {
        let l = self.linha();
        if self.aceita(&Tk::Menos) {
            return Ok(Exp::Neg(Box::new(self.unario()?), l));
        }
        if self.aceita(&Tk::Nao) {
            return Ok(Exp::Nao(Box::new(self.unario()?)));
        }
        self.primario()
    }

    fn primario(&mut self) -> Res<Exp> {
        let linha = self.linha();
        match self.avanca() {
            Tk::Num(n) => Ok(Exp::Num(n)),
            Tk::Txt(s) => Ok(Exp::Txt(s)),
            Tk::Verdadeiro => Ok(Exp::Bool(true)),
            Tk::Falso => Ok(Exp::Bool(false)),
            Tk::AbrePar => {
                let e = self.expressao()?;
                self.exige(Tk::FechaPar, ")")?;
                Ok(e)
            }
            Tk::Ident(nome) => {
                if self.aceita(&Tk::AbrePar) {
                    let mut args = Vec::new();
                    while *self.atual() != Tk::FechaPar {
                        args.push(self.expressao()?);
                        if !self.aceita(&Tk::Virgula) { break; }
                    }
                    self.exige(Tk::FechaPar, ")")?;
                    Ok(Exp::Chamada(nome, args, linha))
                } else {
                    Ok(Exp::Var(nome, linha))
                }
            }
            outro => Err(Erro::Sintaxe { linha, msg: format!("expressão inesperada: {outro:?}") }),
        }
    }
}

// ============================================================ valores

#[derive(Debug, Clone, PartialEq)]
enum Val {
    Num(f64),
    Txt(String),
    Bool(bool),
    Nada,
}

impl fmt::Display for Val {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            // Numero inteiro sai sem ".0": 3 e mais util que 3.0 na tela.
            Val::Num(n) if n.fract() == 0.0 && n.abs() < 1e15 => write!(f, "{}", *n as i64),
            Val::Num(n) => write!(f, "{n}"),
            Val::Txt(s) => write!(f, "{s}"),
            Val::Bool(true) => write!(f, "verdadeiro"),
            Val::Bool(false) => write!(f, "falso"),
            Val::Nada => write!(f, "nada"),
        }
    }
}

impl Val {
    fn tipo(&self) -> &'static str {
        match self {
            Val::Num(_) => "número", Val::Txt(_) => "texto",
            Val::Bool(_) => "booleano", Val::Nada => "nada",
        }
    }
    fn verdadeiro(&self) -> bool {
        match self {
            Val::Bool(b) => *b,
            Val::Num(n) => *n != 0.0,
            Val::Txt(s) => !s.is_empty(),
            Val::Nada => false,
        }
    }
}

// ============================================================ interpretador

struct Func { params: Vec<String>, corpo: Vec<Cmd> }

/// O "fluxo" e o que permite `devolva` sair de dentro de varios blocos
/// aninhados sem excecao e sem flag global.
enum Fluxo { Normal, Devolveu(Val) }

pub struct Interp {
    escopos: Vec<HashMap<String, Val>>,
    funcs: HashMap<String, Func>,
    saida: String,
    passos: u64,
    profundidade: usize,
}

const MAX_PASSOS: u64 = 3_000_000;
const MAX_PROFUNDIDADE: usize = 400;

impl Interp {
    fn novo() -> Self {
        Interp {
            escopos: vec![HashMap::new()],
            funcs: HashMap::new(),
            saida: String::new(),
            passos: 0,
            profundidade: 0,
        }
    }

    fn busca(&self, nome: &str) -> Option<&Val> {
        self.escopos.iter().rev().find_map(|e| e.get(nome))
    }

    fn atribui(&mut self, nome: &str, v: Val) -> bool {
        for e in self.escopos.iter_mut().rev() {
            if e.contains_key(nome) {
                e.insert(nome.to_string(), v);
                return true;
            }
        }
        false
    }

    fn tique(&mut self, linha: usize) -> Res<()> {
        self.passos += 1;
        // Sem teto, um `enquanto verdadeiro {}` digitado na pagina travaria a
        // aba do visitante para sempre.
        if self.passos > MAX_PASSOS {
            return Err(Erro::Execucao { linha, msg: "o programa passou do limite de passos (laço infinito?)".into() });
        }
        Ok(())
    }

    fn roda_bloco(&mut self, cmds: &[Cmd]) -> Res<Fluxo> {
        self.escopos.push(HashMap::new());
        let r = self.roda_lista(cmds);
        self.escopos.pop();
        r
    }

    fn roda_lista(&mut self, cmds: &[Cmd]) -> Res<Fluxo> {
        for c in cmds {
            match self.comando(c)? {
                Fluxo::Normal => {}
                f @ Fluxo::Devolveu(_) => return Ok(f),
            }
        }
        Ok(Fluxo::Normal)
    }

    fn comando(&mut self, cmd: &Cmd) -> Res<Fluxo> {
        match cmd {
            Cmd::Seja(nome, e) => {
                let v = self.avalia(e)?;
                self.escopos.last_mut().unwrap().insert(nome.clone(), v);
                Ok(Fluxo::Normal)
            }

            Cmd::Atribui(nome, e, linha) => {
                let v = self.avalia(e)?;
                if self.atribui(nome, v) {
                    Ok(Fluxo::Normal)
                } else {
                    Err(Erro::Execucao { linha: *linha, msg: format!("'{nome}' não foi declarado (use: seja {nome} = ...)") })
                }
            }

            Cmd::Mostre(e) => {
                let v = self.avalia(e)?;
                self.saida.push_str(&v.to_string());
                self.saida.push('\n');
                Ok(Fluxo::Normal)
            }

            Cmd::Se(cond, entao, senao) => {
                if self.avalia(cond)?.verdadeiro() {
                    self.roda_bloco(entao)
                } else if let Some(s) = senao {
                    self.roda_bloco(s)
                } else {
                    Ok(Fluxo::Normal)
                }
            }

            Cmd::Enquanto(cond, corpo, linha) => {
                loop {
                    self.tique(*linha)?;
                    if !self.avalia(cond)?.verdadeiro() { break; }
                    if let Fluxo::Devolveu(v) = self.roda_bloco(corpo)? {
                        return Ok(Fluxo::Devolveu(v));
                    }
                }
                Ok(Fluxo::Normal)
            }

            Cmd::Funcao(nome, params, corpo) => {
                self.funcs.insert(nome.clone(), Func { params: params.clone(), corpo: corpo.clone() });
                Ok(Fluxo::Normal)
            }

            Cmd::Devolva(e) => {
                let v = match e {
                    Some(e) => self.avalia(e)?,
                    None => Val::Nada,
                };
                Ok(Fluxo::Devolveu(v))
            }

            Cmd::Expressao(e) => { self.avalia(e)?; Ok(Fluxo::Normal) }
        }
    }

    fn avalia(&mut self, e: &Exp) -> Res<Val> {
        match e {
            Exp::Num(n) => Ok(Val::Num(*n)),
            Exp::Txt(s) => Ok(Val::Txt(s.clone())),
            Exp::Bool(b) => Ok(Val::Bool(*b)),

            Exp::Var(nome, linha) => self.busca(nome).cloned().ok_or_else(|| Erro::Execucao {
                linha: *linha,
                msg: format!("'{nome}' não existe"),
            }),

            Exp::Neg(e, linha) => match self.avalia(e)? {
                Val::Num(n) => Ok(Val::Num(-n)),
                v => Err(Erro::Execucao { linha: *linha, msg: format!("não dá para negar um {}", v.tipo()) }),
            },

            Exp::Nao(e) => Ok(Val::Bool(!self.avalia(e)?.verdadeiro())),

            Exp::Bin(a, op, b, linha) => {
                // `e`/`ou` avaliam o lado direito so se precisarem — curto-circuito.
                if *op == Tk::E {
                    let va = self.avalia(a)?;
                    return if !va.verdadeiro() { Ok(Val::Bool(false)) } else { Ok(Val::Bool(self.avalia(b)?.verdadeiro())) };
                }
                if *op == Tk::Ou {
                    let va = self.avalia(a)?;
                    return if va.verdadeiro() { Ok(Val::Bool(true)) } else { Ok(Val::Bool(self.avalia(b)?.verdadeiro())) };
                }

                self.tique(*linha)?;
                let va = self.avalia(a)?;
                let vb = self.avalia(b)?;
                self.binaria(va, op, vb, *linha)
            }

            Exp::Chamada(nome, args, linha) => self.chamada(nome, args, *linha),
        }
    }

    fn binaria(&self, a: Val, op: &Tk, b: Val, linha: usize) -> Res<Val> {
        use Tk::*;
        Ok(match (a, op, b) {
            // Texto com + concatena; texto com numero tambem, por conveniencia.
            (Val::Txt(x), Mais, y) => Val::Txt(format!("{x}{y}")),
            (x, Mais, Val::Txt(y)) => Val::Txt(format!("{x}{y}")),

            (Val::Num(x), Mais, Val::Num(y)) => Val::Num(x + y),
            (Val::Num(x), Menos, Val::Num(y)) => Val::Num(x - y),
            (Val::Num(x), Vezes, Val::Num(y)) => Val::Num(x * y),

            (Val::Num(_), Dividido, Val::Num(y)) if y == 0.0 => {
                return Err(Erro::Execucao { linha, msg: "divisão por zero".into() })
            }
            (Val::Num(x), Dividido, Val::Num(y)) => Val::Num(x / y),

            (Val::Num(_), Resto, Val::Num(y)) if y == 0.0 => {
                return Err(Erro::Execucao { linha, msg: "resto de divisão por zero".into() })
            }
            (Val::Num(x), Resto, Val::Num(y)) => Val::Num(x % y),

            (x, IgualIgual, y) => Val::Bool(x == y),
            (x, Diferente, y) => Val::Bool(x != y),

            (Val::Num(x), Menor, Val::Num(y)) => Val::Bool(x < y),
            (Val::Num(x), MenorIgual, Val::Num(y)) => Val::Bool(x <= y),
            (Val::Num(x), Maior, Val::Num(y)) => Val::Bool(x > y),
            (Val::Num(x), MaiorIgual, Val::Num(y)) => Val::Bool(x >= y),

            (x, op, y) => {
                return Err(Erro::Execucao {
                    linha,
                    msg: format!("não dá para usar {op:?} entre {} e {}", x.tipo(), y.tipo()),
                })
            }
        })
    }

    fn chamada(&mut self, nome: &str, args: &[Exp], linha: usize) -> Res<Val> {
        // Algumas funcoes embutidas, para o REPL ter o minimo util.
        if let Some(v) = self.embutida(nome, args, linha)? {
            return Ok(v);
        }

        let f = self.funcs.get(nome).ok_or_else(|| Erro::Execucao {
            linha,
            msg: format!("função '{nome}' não existe"),
        })?;

        if f.params.len() != args.len() {
            return Err(Erro::Execucao {
                linha,
                msg: format!("'{nome}' espera {} argumento(s), recebeu {}", f.params.len(), args.len()),
            });
        }

        let params = f.params.clone();
        let corpo = f.corpo.clone();

        let mut valores = Vec::with_capacity(args.len());
        for a in args {
            valores.push(self.avalia(a)?);
        }

        self.profundidade += 1;
        if self.profundidade > MAX_PROFUNDIDADE {
            self.profundidade -= 1;
            return Err(Erro::Execucao { linha, msg: "recursão profunda demais".into() });
        }

        // Escopo da funcao NAO enxerga o de quem chamou: escopo lexico raso, de
        // proposito, para recursao funcionar sem vazar variavel entre niveis.
        let mut local = HashMap::new();
        for (p, v) in params.iter().zip(valores) {
            local.insert(p.clone(), v);
        }

        let salvo = std::mem::replace(&mut self.escopos, vec![local]);
        let r = self.roda_lista(&corpo);
        self.escopos = salvo;
        self.profundidade -= 1;

        match r? {
            Fluxo::Devolveu(v) => Ok(v),
            Fluxo::Normal => Ok(Val::Nada),
        }
    }

    fn embutida(&mut self, nome: &str, args: &[Exp], linha: usize) -> Res<Option<Val>> {
        let n_args = |esperado: usize| -> Res<()> {
            if args.len() == esperado { Ok(()) } else {
                Err(Erro::Execucao { linha, msg: format!("'{nome}' espera {esperado} argumento(s)") })
            }
        };

        Ok(match nome {
            "raiz" => { n_args(1)?; match self.avalia(&args[0])? {
                Val::Num(n) => Some(Val::Num(n.sqrt())),
                v => return Err(Erro::Execucao { linha, msg: format!("raiz espera número, recebeu {}", v.tipo()) }),
            }}
            "piso" => { n_args(1)?; match self.avalia(&args[0])? {
                Val::Num(n) => Some(Val::Num(n.floor())),
                v => return Err(Erro::Execucao { linha, msg: format!("piso espera número, recebeu {}", v.tipo()) }),
            }}
            "abs" => { n_args(1)?; match self.avalia(&args[0])? {
                Val::Num(n) => Some(Val::Num(n.abs())),
                v => return Err(Erro::Execucao { linha, msg: format!("abs espera número, recebeu {}", v.tipo()) }),
            }}
            "tamanho" => { n_args(1)?; match self.avalia(&args[0])? {
                Val::Txt(s) => Some(Val::Num(s.chars().count() as f64)),
                v => return Err(Erro::Execucao { linha, msg: format!("tamanho espera texto, recebeu {}", v.tipo()) }),
            }}
            _ => None,
        })
    }
}

/// Roda o programa e devolve (saida, passos) ou o erro formatado.
pub fn executar(fonte: &str) -> (String, u64, bool) {
    let resultado = (|| -> Res<(String, u64)> {
        let tokens = Lexer::novo(fonte).tokens()?;
        let mut p = Parser { tk: tokens, pos: 0 };
        let programa = p.programa()?;

        let mut interp = Interp::novo();
        interp.roda_lista(&programa)?;
        Ok((interp.saida.clone(), interp.passos))
    })();

    match resultado {
        Ok((saida, passos)) => (saida, passos, true),
        Err(e) => (e.to_string(), 0, false),
    }
}

// ============================================================ ponte com o JS
//
// Sem wasm-bindgen: a pagina aloca um buffer, escreve o UTF-8 nele e chama
// `avaliar`. A resposta volta como [4 bytes de tamanho][UTF-8], porque o
// WebAssembly so sabe trocar numeros.

#[no_mangle]
pub extern "C" fn alocar(tamanho: usize) -> *mut u8 {
    let mut v = Vec::with_capacity(tamanho);
    let p = v.as_mut_ptr();
    std::mem::forget(v); // a posse passa para o JavaScript ate ele devolver
    p
}

#[no_mangle]
pub unsafe extern "C" fn liberar(ponteiro: *mut u8, tamanho: usize) {
    if !ponteiro.is_null() {
        drop(Vec::from_raw_parts(ponteiro, 0, tamanho));
    }
}

#[no_mangle]
pub unsafe extern "C" fn avaliar(ponteiro: *const u8, tamanho: usize) -> *mut u8 {
    let fonte = std::slice::from_raw_parts(ponteiro, tamanho);
    let fonte = std::str::from_utf8(fonte).unwrap_or("");

    let (saida, passos, ok) = executar(fonte);
    // Prefixo de uma linha com o estado, para o JS nao precisar de dois canais.
    let corpo = format!("{}\u{1}{}\u{1}{}", if ok { "ok" } else { "erro" }, passos, saida);

    let bytes = corpo.into_bytes();
    let mut saida_buf = Vec::with_capacity(4 + bytes.len());
    saida_buf.extend_from_slice(&(bytes.len() as u32).to_le_bytes());
    saida_buf.extend_from_slice(&bytes);

    let p = saida_buf.as_mut_ptr();
    std::mem::forget(saida_buf);
    p
}

// ============================================================ testes

#[cfg(test)]
mod testes {
    use super::*;

    fn roda(src: &str) -> String {
        let (s, _, ok) = executar(src);
        assert!(ok, "falhou: {s}");
        s.trim().to_string()
    }

    #[test]
    fn aritmetica_respeita_precedencia() {
        assert_eq!(roda("mostre 2 + 3 * 4"), "14");
        assert_eq!(roda("mostre (2 + 3) * 4"), "20");
    }

    #[test]
    fn recursao_funciona() {
        assert_eq!(
            roda("funcao fib(n) { se n < 2 { devolva n } devolva fib(n-1) + fib(n-2) } mostre fib(15)"),
            "610"
        );
    }

    #[test]
    fn laco_infinito_e_interrompido() {
        let (msg, _, ok) = executar("enquanto verdadeiro { seja x = 1 }");
        assert!(!ok);
        assert!(msg.contains("limite de passos"));
    }

    #[test]
    fn divisao_por_zero_vira_erro() {
        let (msg, _, ok) = executar("mostre 1 / 0");
        assert!(!ok);
        assert!(msg.contains("divisão por zero"));
    }
}
