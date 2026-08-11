import type { Metadata } from "next";
import { Bell, ChefHat, Languages, ListChecks, QrCode, ReceiptText } from "lucide-react";
import RestaurantSolutionPage, { type SolutionPageContent } from "@/components/seo/RestaurantSolutionPage";

export const metadata: Metadata = {
  title: "QR Ordering para Restaurantes: Menu e Pedidos na Mesa",
  description: "QR Ordering para restaurantes com menu digital, pedidos na mesa, chamada de empregado e pedido de conta. Sem aplicação para o cliente.",
  alternates: { canonical: "https://mesalink.pt/qr-ordering-restaurantes" },
  openGraph: { url: "https://mesalink.pt/qr-ordering-restaurantes", title: "QR Ordering e Menu Digital para Restaurantes — MesaLink", description: "Clientes consultam o menu e fazem pedidos diretamente da mesa através de QR Code." },
};

const content: SolutionPageContent = {
  path: "/qr-ordering-restaurantes",
  eyebrow: "Menu digital e pedidos por QR Code",
  title: "QR Ordering para",
  accent: "serviço mais rápido.",
  schemaName: "MesaLink QR Ordering",
  intro: "Dê autonomia ao cliente sem perder controlo da sala. O menu abre no navegador e permite enviar pedidos, chamar o empregado e pedir a conta diretamente da mesa.",
  painTitle: "Nos momentos de maior procura, pequenos atrasos acumulam-se rapidamente.",
  pains: [
    "Clientes esperam para pedir ou voltar a chamar a equipa.",
    "Pedidos escritos e comunicados manualmente aumentam o risco de erro.",
    "A equipa percorre a sala para tarefas simples e repetitivas.",
    "Menus em PDF são difíceis de atualizar e compreender no telemóvel.",
  ],
  featuresTitle: "O cliente pede no telemóvel. A equipa mantém o controlo.",
  features: [
    { icon: QrCode, title: "QR por mesa", text: "Cada código identifica o contexto da mesa e abre o menu sem instalar uma aplicação." },
    { icon: ListChecks, title: "Pedidos estruturados", text: "Produtos, quantidades e notas chegam de forma legível ao fluxo operacional." },
    { icon: Bell, title: "Chamar empregado", text: "O cliente pede apoio quando precisa e a equipa recebe o alerta no painel." },
    { icon: ReceiptText, title: "Pedir a conta", text: "O pedido de conta fica sinalizado sem obrigar o cliente a procurar alguém na sala." },
    { icon: ChefHat, title: "Menu sempre atualizado", text: "Altere disponibilidade, descrições, preços e apresentação a partir do MesaLink." },
    { icon: Languages, title: "Experiência mobile", text: "A navegação foi desenhada para funcionar de forma simples no telefone do cliente." },
  ],
  outcomesTitle: "Menos atrito em cada mesa.",
  outcomes: [
    { title: "Pedido mais rápido", text: "O cliente não depende do momento exato em que o empregado pode regressar à mesa." },
    { title: "Menos erros", text: "O pedido entra estruturado com os produtos e quantidades selecionados." },
    { title: "Equipa mais disponível", text: "Tarefas repetitivas deixam de consumir tantas deslocações pela sala." },
    { title: "Mais contexto", text: "Menu, pedidos, mesa e operação fazem parte do mesmo sistema." },
  ],
  faq: [
    { question: "O cliente precisa de instalar uma aplicação?", answer: "Não. O menu e o QR Ordering abrem diretamente no navegador do telemóvel através do código da mesa." },
    { question: "O QR Code é diferente para cada mesa?", answer: "Sim. O restaurante pode gerar códigos associados às mesas para que o pedido chegue com o contexto correto." },
    { question: "É possível chamar o empregado e pedir a conta?", answer: "Sim. Estas opções podem ser ativadas no fluxo QR para criar alertas visíveis pela equipa." },
    { question: "Posso alterar o menu sem imprimir novos códigos?", answer: "Sim. O QR mantém-se e o conteúdo do menu pode ser atualizado no MesaLink." },
  ],
  related: [
    { href: "/software-para-restaurantes", label: "Software para restaurantes" },
    { href: "/sistema-reservas-restaurantes", label: "Sistema de reservas" },
    { href: "/website-para-restaurantes", label: "Website e SEO" },
    { href: "/marketing-para-restaurantes", label: "CRM e marketing" },
  ],
};

export default function Page() { return <RestaurantSolutionPage content={content} />; }
