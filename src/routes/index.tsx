import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Mail, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  type GalleryItem,
  type ProjectItem,
  defaultPortfolio,
  isVideoUrl,
  loadPortfolio,
} from "@/lib/portfolio-storage";

type TabId = "work" | "daily" | "contact";
const tabs: Array<{ id: TabId; label: string }> = [
  { id: "work", label: "Meus Trabalhos" },
  { id: "daily", label: "Cotidiano" },
  { id: "contact", label: "Contato" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gabriela Morais — Portfólio" },
      {
        name: "description",
        content: "Portfólio minimalista de Gabriela Morais com trabalhos selecionados, cotidiano autoral e contato.",
      },
      { property: "og:title", content: "Gabriela Morais — Portfólio" },
      { property: "og:description", content: "Trabalhos selecionados, fotografia autoral do cotidiano e contato." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://gabrielamorais.lovable.app" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://gabrielamorais.lovable.app" }],
  }),
  component: Index,
});

function Index() {
  const [activeTab, setActiveTab] = useState<TabId>("work");
  const [portfolio, setPortfolio] = useState(defaultPortfolio);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [projectGalleryIndex, setProjectGalleryIndex] = useState(0);

  useEffect(() => {
    const refresh = () => setPortfolio(loadPortfolio());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("portfolio-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("portfolio-updated", refresh);
    };
  }, []);

  const photoIndex = useMemo(
    () => (selectedPhoto ? portfolio.daily.findIndex((item) => item.id === selectedPhoto.id) : -1),
    [portfolio.daily, selectedPhoto],
  );
  const activeProjectImage = selectedProject?.gallery[projectGalleryIndex] ?? selectedProject;
  const openProject = (project: ProjectItem) => {
    setSelectedProject(project);
    setProjectGalleryIndex(0);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col justify-center gap-3 px-4 py-3 sm:min-h-20 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <nav aria-label="Navegação principal" className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant="tab"
                size="sm"
                data-active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </nav>
          <p className="font-display text-sm uppercase text-foreground sm:text-right">{portfolio.content.name}</p>
        </div>
      </header>

      {/* Seção Hero com suporte a imagem de fundo dinâmica configurada no Admin */}
      <section className="relative mx-auto flex min-h-[72vh] w-full max-w-7xl items-center px-4 pb-16 pt-32 sm:px-6 sm:pt-28 lg:px-8 overflow-hidden rounded-b-2xl mb-8">
        {portfolio.content.heroBackground && (
          <div className="absolute inset-0 z-0">
            {isVideoUrl(portfolio.content.heroBackground) ? (
              <video
                src={portfolio.content.heroBackground}
                className="h-full w-full object-cover opacity-25"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={portfolio.content.heroBackground}
                alt="Capa do Portfólio"
                className="h-full w-full object-cover opacity-25"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        )}
        <div className="portfolio-fade-in relative z-10 max-w-4xl">
          <p className="mb-5 text-sm uppercase text-primary">Portfólio autoral</p>
          <h1 className="font-display text-5xl font-semibold leading-none text-foreground sm:text-7xl lg:text-8xl">
            {portfolio.content.headline}
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            {portfolio.content.presentation}
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-panel px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-8">
            <p className="text-sm uppercase text-primary">
              {activeTab === "work" ? "Seleção" : activeTab === "daily" ? "Mural" : "Conversa"}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-5xl">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
          </div>

          {/* GALERIA MEUS TRABALHOS */}
          {activeTab === "work" && (
            <div className="grid gap-7 md:grid-cols-2">
              {portfolio.projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => openProject(project)}
                  className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="block overflow-hidden rounded-lg border border-border bg-surface shadow-portfolio">
                    {isVideoUrl(project.src) ? (
                      <video
                        src={project.src}
                        className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={project.src}
                        alt={project.alt}
                        width={project.width}
                        height={project.height}
                        className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    )}
                  </span>
                  <span className="mt-3 block font-medium">{project.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* GALERIA COTIDIANO */}
          {activeTab === "daily" && (
            <div className="masonry-gallery">
              {portfolio.daily.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedPhoto(photo)}
                  className="masonry-item group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="block overflow-hidden rounded-lg border border-border bg-surface shadow-portfolio">
                    {isVideoUrl(photo.src) ? (
                      <video
                        src={photo.src}
                        className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        width={photo.width}
                        height={photo.height}
                        className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          {activeTab === "contact" && (
            <div className="grid gap-8 border-t border-border pt-8 md:grid-cols-[1fr_1.2fr]">
              <p className="max-w-md text-lg leading-8 text-muted-foreground">{portfolio.content.contactText}</p>
              <div className="rounded-lg border border-border bg-surface p-6 shadow-portfolio">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Mail aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a className="text-lg font-medium hover:text-primary" href={`mailto:${portfolio.content.email}`}>
                      {portfolio.content.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {portfolio.content.name}
          </span>
          <Link to="/admin" className="transition-colors hover:text-foreground">
            Admin
          </Link>
        </div>
      </footer>

      {/* LIGHTBOX COTIDIANO */}
      {selectedPhoto && (
        <Lightbox
          title={selectedPhoto.title}
          image={selectedPhoto}
          index={photoIndex}
          total={portfolio.daily.length}
          onClose={() => setSelectedPhoto(null)}
          onPrevious={() => setSelectedPhoto(portfolio.daily[photoIndex - 1] ?? selectedPhoto)}
          onNext={() => setSelectedPhoto(portfolio.daily[photoIndex + 1] ?? selectedPhoto)}
        />
      )}

      {/* MODAL TRABALHOS */}
      {selectedProject && activeProjectImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedProject.title}
          className="fixed inset-0 z-50 flex min-h-screen flex-col bg-ink/95 px-4 py-4 backdrop-blur-md sm:px-8"
          onClick={() => setSelectedProject(null)}
        >
          <div className="flex items-start justify-between gap-4" onClick={(event) => event.stopPropagation()}>
            <div>
              <p className="text-sm uppercase text-primary">Meus Trabalhos</p>
              <h3 className="mt-1 text-xl font-medium sm:text-3xl">{selectedProject.title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{selectedProject.description}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedProject(null)}>
              <X />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
          <div
            className="grid flex-1 grid-cols-[auto_1fr_auto] items-center gap-3 py-5"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="outline"
              size="icon"
              disabled={projectGalleryIndex <= 0}
              onClick={() => setProjectGalleryIndex((value) => value - 1)}
            >
              <ChevronLeft />
              <span className="sr-only">Anterior</span>
            </Button>

            {isVideoUrl(activeProjectImage.src) ? (
              <video
                src={activeProjectImage.src}
                controls
                autoPlay
                className="mx-auto max-h-[68vh] max-w-full rounded-lg object-contain shadow-portfolio"
              />
            ) : (
              <img
                src={activeProjectImage.src}
                alt={activeProjectImage.alt}
                className="mx-auto max-h-[68vh] max-w-full rounded-lg object-contain shadow-portfolio"
              />
            )}

            <Button
              variant="outline"
              size="icon"
              disabled={projectGalleryIndex >= selectedProject.gallery.length - 1}
              onClick={() => setProjectGalleryIndex((value) => value + 1)}
            >
              <ChevronRight />
              <span className="sr-only">Próxima</span>
            </Button>
          </div>
          <div
            className="mx-auto flex max-w-4xl gap-3 overflow-x-auto pb-2"
            onClick={(event) => event.stopPropagation()}
          >
            {selectedProject.gallery.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setProjectGalleryIndex(index)}
                className="shrink-0 rounded-md border border-border bg-surface p-1 data-[active=true]:border-primary"
                data-active={projectGalleryIndex === index}
              >
                {isVideoUrl(image.src) ? (
                  <video src={image.src} className="h-16 w-24 rounded object-cover sm:h-20 sm:w-32" muted />
                ) : (
                  <img src={image.src} alt={image.alt} className="h-16 w-24 rounded object-cover sm:h-20 sm:w-32" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function Lightbox({
  title,
  image,
  index,
  total,
  onClose,
  onPrevious,
  onNext,
}: {
  title: string;
  image: GalleryItem;
  index: number;
  total: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex min-h-screen flex-col bg-ink/95 px-4 py-4 backdrop-blur-md sm:px-8"
      onClick={onClose}
    >
      <div className="flex items-center justify-between" onClick={(event) => event.stopPropagation()}>
        <h3 className="text-lg font-medium">{title}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>
      <div
        className="grid flex-1 grid-cols-[auto_1fr_auto] items-center gap-3 py-5"
        onClick={(event) => event.stopPropagation()}
      >
        <Button variant="outline" size="icon" onClick={onPrevious} disabled={index <= 0}>
          <ChevronLeft />
          <span className="sr-only">Anterior</span>
        </Button>

        {isVideoUrl(image.src) ? (
          <video
            src={image.src}
            controls
            autoPlay
            className="mx-auto max-h-[82vh] max-w-full rounded-lg object-contain shadow-portfolio"
          />
        ) : (
          <img
            src={image.src}
            alt={image.alt}
            className="mx-auto max-h-[82vh] max-w-full rounded-lg object-contain shadow-portfolio"
          />
        )}

        <Button variant="outline" size="icon" onClick={onNext} disabled={index >= total - 1}>
          <ChevronRight />
          <span className="sr-only">Próxima</span>
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {index + 1} / {total}
      </p>
    </div>
  );
}
