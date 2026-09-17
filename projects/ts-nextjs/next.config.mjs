/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sem cache de rota: esta demo mede tempo de resposta, e uma resposta
  // servida do cache mediria zero — o que destruiria o ponto da pagina.
  experimental: {},
};

export default nextConfig;
