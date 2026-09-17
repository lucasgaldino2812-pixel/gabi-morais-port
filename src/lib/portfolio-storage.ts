import dailyStreet from "@/assets/portfolio-daily-a.jpg";
import dailyDesk from "@/assets/portfolio-daily-b.jpg";
import projectStudio from "@/assets/portfolio-project-a.jpg";
import projectObjects from "@/assets/portfolio-project-b.jpg";
import { createClient } from "@supabase/supabase-js";

// Inicialização do Supabase usando as chaves injetadas no vite.config.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

export type GalleryItem = { id: string; title: string; src: string; alt: string; width: number; height: number };
export type ProjectItem = GalleryItem & { description: string; gallery: GalleryItem[] };

// Adicionado 'heroBackground' na tipagem do conteúdo
export type SiteContent = {
  name: string;
  headline: string;
  presentation: string;
  contactText: string;
  email: string;
  heroBackground?: string;
};

export type PortfolioData = { content: SiteContent; projects: ProjectItem[]; daily: GalleryItem[] };

export const PORTFOLIO_KEY = "gabriela-morais-portfolio-data-v2";
export const ADMIN_SESSION_KEY = "gabriela-morais-admin-session";
export const ADMIN_PASSWORD = "1234";

export const defaultPortfolio: PortfolioData = {
  content: {
    name: "Gabriela Morais",
    headline: "Olá, eu sou Gabriela Morais!",
    presentation:
      "Crio imagens, identidades e narrativas visuais com estética minimalista, atenção ao detalhe e presença silenciosa.",
    contactText: "Disponível para projetos de identidade visual, direção criativa e fotografia autoral.",
    email: "gabrielamorais96136@gmail.com",
    // Imagem de fundo padrão caso ainda não tenha sido alterada pelo Admin
    heroBackground: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop",
  },
  projects: [
    {
      id: "studio-identidade",
      title: "Identidade Studio Noir",
      src: projectStudio,
      alt: "Escritório escuro com luminária escultural e mesa de vidro",
      width: 1200,
      height: 912,
      description: "Direção visual para uma marca autoral, com foco em atmosfera, textura e presença silenciosa.",
      gallery: [
        {
          id: "studio-capa",
          title: "Capa do projeto",
          src: projectStudio,
          alt: "Escritório escuro com luminária escultural e mesa de vidro",
          width: 1200,
          height: 912,
        },
        {
          id: "studio-detalhe",
          title: "Estudo de matéria",
          src: projectObjects,
          alt: "Objetos pretos minimalistas sobre fundo grafite",
          width: 1200,
          height: 912,
        },
      ],
    },
    {
      id: "objetos-editoriais",
      title: "Sistema Editorial Objeto",
      src: projectObjects,
      alt: "Objetos pretos minimalistas sobre fundo grafite",
      width: 1200,
      height: 912,
      description: "Série de capas e peças digitais guiadas por contraste, ritmo e composição precisa.",
      gallery: [
        {
          id: "objetos-capa",
          title: "Capa do projeto",
          src: projectObjects,
          alt: "Objetos pretos minimalistas sobre fundo grafite",
          width: 1200,
          height: 912,
        },
        {
          id: "objetos-ambiente",
          title: "Ambiente visual",
          src: projectStudio,
          alt: "Escritório escuro com luminária escultural e mesa de vidro",
          width: 1200,
          height: 912,
        },
      ],
    },
  ],
  daily: [
    {
      id: "rua-ao-entardecer",
      title: "Rua ao Entardecer",
      src: dailyStreet,
      alt: "Rua estreita no fim de tarde com reflexo quente em uma janela",
      width: 912,
      height: 1200,
    },
    {
      id: "mesa-de-trabalho",
      title: "Mesa de Trabalho",
      src: dailyDesk,
      alt: "Café, caderno e lápis sobre uma mesa escura",
      width: 912,
      height: 1104,
    },
  ],
};

export function loadPortfolio(): PortfolioData {
  if (typeof window === "undefined") return defaultPortfolio;
  try {
    const saved = window.localStorage.getItem(PORTFOLIO_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Mescla com defaultPortfolio para garantir que heroBackground não fique undefined em dados salvos antigos
      return {
        ...defaultPortfolio,
        ...parsed,
        content: {
          ...defaultPortfolio.content,
          ...(parsed.content || {}),
        },
      };
    }
    return defaultPortfolio;
  } catch {
    return defaultPortfolio;
  }
}

export function savePortfolio(data: PortfolioData) {
  window.localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("portfolio-updated"));
}

// Faz o upload de imagem ou vídeo direto para o Supabase
export async function readFileAsDataUrl(file: File): Promise<string> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${Date.now()}-${cleanName}`;

  const { error } = await supabase.storage.from("portfolio-images").upload(fileName, file, {
    upsert: true,
  });

  if (error) {
    throw new Error(`Erro ao enviar arquivo: ${error.message}`);
  }

  const { data } = supabase.storage.from("portfolio-images").getPublicUrl(fileName);

  return data.publicUrl;
}

// Identifica se a URL é de um vídeo
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.includes("video");
}

// Calcula as dimensões corretamente tanto para imagem quanto para vídeo
export function readImageDimensions(src: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    if (isVideoUrl(src)) {
      const video = document.createElement("video");
      video.onloadedmetadata = () => {
        resolve({ width: video.videoWidth || 1200, height: video.videoHeight || 900 });
      };
      video.onerror = () => resolve({ width: 1200, height: 900 });
      video.src = src;
    } else {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth || 1200, height: image.naturalHeight || 900 });
      image.onerror = () => resolve({ width: 1200, height: 900 });
      image.src = src;
    }
  });
}

export function cleanFileName(name: string) {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}
