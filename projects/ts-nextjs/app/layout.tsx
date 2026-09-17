import type { Metadata } from "next";
import "./estilo.css";

export const metadata: Metadata = {
  title: "Server Components e streaming — Laboratório Autark",
  description:
    "O mesmo painel servido de dois jeitos: esperando a consulta mais lenta, ou enviando cada pedaço assim que fica pronto.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/*
          Fontes e casco visual vêm do próprio laboratório, por URL absoluta.
          Os assets de lá respondem com Access-Control-Allow-Origin: *, então
          isto funciona de outro domínio — e evita manter uma cópia divergente
          do CSS só porque esta demo mora na Vercel.
        */}
        <link rel="stylesheet" href="https://autarktech.com.br/assets/fonts/fonts.css" />
        <link rel="stylesheet" href="https://autarktech.com.br/lab/demo.css" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body>{children}</body>
    </html>
  );
}
