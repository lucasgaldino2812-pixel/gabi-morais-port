import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ImagePlus, LogOut, Pencil, Plus, Save, Scissors, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ImageEditor } from "@/components/image-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ADMIN_PASSWORD,
  ADMIN_SESSION_KEY,
  type GalleryItem,
  type PortfolioData,
  type ProjectItem,
  cleanFileName,
  defaultPortfolio,
  isVideoUrl,
  loadPortfolio,
  readFileAsDataUrl,
  readImageDimensions,
  savePortfolio,
} from "@/lib/portfolio-storage";

type PendingImage = GalleryItem;
type EditTarget =
  | { kind: "project-cover"; projectId: string }
  | { kind: "project-gallery"; projectId: string; imageId: string }
  | { kind: "daily"; imageId: string }
  | { kind: "banner" }; // <--- Adicionado suporte ao banner

type CropQueue = {
  mode: "new-project" | "new-daily" | "add-gallery" | "banner"; // <--- Adicionado "banner"
  images: PendingImage[];
  completed: PendingImage[];
  index: number;
  projectId?: string;
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin — Gabriela Morais" },
      { name: "description", content: "Área de gerenciamento local do portfólio de Gabriela Morais." },
      { property: "og:title", content: "Painel Admin — Gabriela Morais" },
      { property: "og:description", content: "Área de gerenciamento local do portfólio." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://gabrielamorais.lovable.app/admin" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "https://gabrielamorais.lovable.app/admin" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [data, setData] = useState<PortfolioData>(defaultPortfolio);

  const projectInput = useRef<HTMLInputElement>(null);
  const dailyInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null); // <--- Ref para o input do banner

  const [galleryProjectId, setGalleryProjectId] = useState<string>();
  const [cropQueue, setCropQueue] = useState<CropQueue>();
  const [editTarget, setEditTarget] = useState<EditTarget>();
  const [draftImages, setDraftImages] = useState<GalleryItem[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  useEffect(() => {
    setAuthenticated(window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true");
    setData(loadPortfolio());
    setReady(true);
  }, []);

  const persist = (next: PortfolioData, message: string) => {
    try {
      setData(next);
      savePortfolio(next);
      toast.success(message);
      return true;
    } catch {
      toast.error("Não foi possível salvar. O armazenamento do navegador pode estar cheio.");
      return false;
    }
  };

  const login = (event: FormEvent) => {
    event.preventDefault();
    if (password === ADMIN_PASSWORD) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      setAuthenticated(true);
      setError(false);
    } else setError(true);
  };

  const logout = () => {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAuthenticated(false);
    setPassword("");
  };

  const prepareFiles = async (files: FileList | null, mode: CropQueue["mode"], projectId?: string) => {
    if (!files?.length) return;
    try {
      const validFiles = Array.from(files).filter(
        (file) => file.type.startsWith("image/") || file.type.startsWith("video/"),
      );
      if (!validFiles.length) {
        toast.error("Selecione arquivos válidos de imagem ou vídeo.");
        return;
      }
      const images = await Promise.all(
        validFiles.map(async (file, index) => {
          const src = await readFileAsDataUrl(file);
          const dimensions = await readImageDimensions(src);
          const title = cleanFileName(file.name) || "Nova mídia";
          return { id: `${mode}-${Date.now()}-${index}`, title, src, alt: title, ...dimensions } satisfies GalleryItem;
        }),
      );

      // Se for para o banner e for vídeo, já salva direto sem ir para a fila de crop
      if (mode === "banner") {
        const item = images[0];
        if (isVideoUrl(item.src)) {
          persist({ ...data, content: { ...data.content, bannerSrc: item.src } }, "Banner atualizado com sucesso!");
          return;
        }
      }

      // Pula a etapa do Crop caso a mídia enviada seja um Vídeo geral
      const nonVideoImages = images.filter((img) => !isVideoUrl(img.src));
      if (nonVideoImages.length < images.length && mode !== "banner") {
        finishQueue(
          projectId ? { mode, images, completed: [], index: 0, projectId } : { mode, images, completed: [], index: 0 },
          images,
        );
        return;
      }

      setCropQueue(
        projectId ? { mode, images, completed: [], index: 0, projectId } : { mode, images, completed: [], index: 0 },
      );
    } catch {
      toast.error("Não foi possível abrir uma das mídias.");
    }
  };

  const finishQueue = (queue: CropQueue, images: GalleryItem[]) => {
    if (queue.mode === "new-project") {
      setDraftImages(images);
      setDraftTitle(images[0]?.title ?? "Novo Projeto");
      setDraftDescription("");
    } else if (queue.mode === "new-daily") {
      persist(
        { ...data, daily: [...images, ...data.daily] },
        images.length === 1 ? "Mídia adicionada com sucesso!" : `${images.length} mídias adicionadas com sucesso!`,
      );
    } else if (queue.mode === "banner") {
      const bannerItem = images[0];
      if (bannerItem) {
        persist({ ...data, content: { ...data.content, bannerSrc: bannerItem.src } }, "Banner atualizado com sucesso!");
      }
    } else if (queue.projectId) {
      persist(
        {
          ...data,
          projects: data.projects.map((project) =>
            project.id === queue.projectId ? { ...project, gallery: [...project.gallery, ...images] } : project,
          ),
        },
        `${images.length} ${images.length === 1 ? "mídia adicionada" : "mídias adicionadas"} à galeria!`,
      );
    }
    setCropQueue(undefined);
  };

  const acceptQueuedCrop = (result: { src: string; width: number; height: number }) => {
    const queue = cropQueue;
    if (!queue) return;

    // Tratamento especial se o crop vier do banner
    if (queue.mode === "banner") {
      persist({ ...data, content: { ...data.content, bannerSrc: result.src } }, "Banner atualizado com sucesso!");
      setCropQueue(undefined);
      return;
    }

    const current = queue.images[queue.index];
    if (!current) return;
    const completed = [...queue.completed, { ...current, ...result }];
    if (queue.index < queue.images.length - 1) setCropQueue({ ...queue, completed, index: queue.index + 1 });
    else finishQueue(queue, completed);
  };

  const acceptExistingCrop = (result: { src: string; width: number; height: number }) => {
    const target = editTarget;
    if (!target) return;
    if (target.kind === "daily") {
      persist(
        { ...data, daily: data.daily.map((image) => (image.id === target.imageId ? { ...image, ...result } : image)) },
        "Foto atualizada com sucesso!",
      );
    } else if (target.kind === "banner") {
      persist({ ...data, content: { ...data.content, bannerSrc: result.src } }, "Banner atualizado com sucesso!");
    } else if (target.kind === "project-cover") {
      persist(
        {
          ...data,
          projects: data.projects.map((project) =>
            project.id === target.projectId ? { ...project, ...result } : project,
          ),
        },
        "Capa atualizada com sucesso!",
      );
    } else {
      persist(
        {
          ...data,
          projects: data.projects.map((project) =>
            project.id === target.projectId
              ? {
                  ...project,
                  gallery: project.gallery.map((image) =>
                    image.id === target.imageId ? { ...image, ...result } : image,
                  ),
                }
              : project,
          ),
        },
        "Imagem atualizada com sucesso!",
      );
    }
    setEditTarget(undefined);
  };

  const createProject = () => {
    const cover = draftImages[0];
    if (!cover || !draftTitle.trim()) {
      toast.error("Informe um título para o projeto.");
      return;
    }
    const project: ProjectItem = {
      ...cover,
      id: `project-${Date.now()}`,
      title: draftTitle.trim(),
      alt: draftTitle.trim(),
      description: draftDescription.trim() || "Projeto autoral.",
      gallery: draftImages,
    };
    if (persist({ ...data, projects: [project, ...data.projects] }, "Projeto salvo com sucesso!")) {
      setDraftImages([]);
      setDraftTitle("");
      setDraftDescription("");
    }
  };

  const currentQueuedImage = cropQueue?.images[cropQueue.index];

  // Tratamento para o editor de imagem existente quando for o banner
  const existingImage =
    editTarget?.kind === "daily"
      ? data.daily.find((image) => image.id === editTarget.imageId)
      : editTarget?.kind === "project-cover"
        ? data.projects.find((project) => project.id === editTarget.projectId)
        : editTarget?.kind === "project-gallery"
          ? data.projects
              .find((project) => project.id === editTarget.projectId)
              ?.gallery.find((image) => image.id === editTarget.imageId)
          : editTarget?.kind === "banner" && data.content.bannerSrc
            ? {
                id: "banner",
                title: "Banner principal",
                src: data.content.bannerSrc,
                alt: "Banner",
                width: 800,
                height: 600,
              }
            : undefined;

  if (!ready) return null;
  if (!authenticated)
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar ao portfólio
          </Link>
          <p className="text-sm uppercase text-primary">Acesso reservado</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">Painel Admin</h1>
          <form onSubmit={login} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
                autoComplete="current-password"
                aria-invalid={error}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                Senha incorreta. Tente novamente.
              </p>
            )}
            <Button className="w-full" type="submit">
              Entrar
            </Button>
          </form>
          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            Este acesso protege apenas os controles neste navegador.
          </p>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase text-primary">Modo Admin</p>
            <h1 className="font-display text-xl font-semibold">Gerenciar portfólio</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft />
                Ver site
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} title="Sair">
              <LogOut />
              <span className="sr-only">Sair</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-6 lg:px-8">
        {/* Seção de Textos e Banner Principal */}
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-sm uppercase text-primary">Conteúdo</p>
              <h2 className="mt-1 font-display text-3xl font-semibold">Textos e Banner do site</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Nome no header"
              value={data.content.name}
              onChange={(name) => setData({ ...data, content: { ...data.content, name } })}
            />
            <Field
              label="Chamada principal"
              value={data.content.headline}
              onChange={(headline) => setData({ ...data, content: { ...data.content, headline } })}
            />
            <Field
              label="E-mail"
              value={data.content.email}
              type="email"
              onChange={(email) => setData({ ...data, content: { ...data.content, email } })}
            />

            {/* Bloco de gerenciamento do Banner do Início */}
            <div className="space-y-2 md:col-span-2 rounded-lg border border-border bg-surface p-4">
              <Label>Banner / Mídia de Início (Hero)</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
                {data.content.bannerSrc ? (
                  isVideoUrl(data.content.bannerSrc) ? (
                    <video
                      src={data.content.bannerSrc}
                      className="h-24 w-36 rounded-md object-cover border border-border"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={data.content.bannerSrc}
                      alt="Banner Preview"
                      className="h-24 w-36 rounded-md object-cover border border-border"
                    />
                  )
                ) : (
                  <div className="flex h-24 w-36 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                    Sem banner
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => bannerInput.current?.click()}>
                    <ImagePlus className="mr-2 size-4" />
                    {data.content.bannerSrc ? "Alterar banner" : "Adicionar banner"}
                  </Button>
                  {data.content.bannerSrc && !isVideoUrl(data.content.bannerSrc) && (
                    <Button variant="outline" size="sm" onClick={() => setEditTarget({ kind: "banner" })}>
                      <Scissors className="mr-2 size-4" />
                      Editar/Recortar banner
                    </Button>
                  )}
                  {data.content.bannerSrc && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        persist(
                          { ...data, content: { ...data.content, bannerSrc: undefined } },
                          "Banner removido com sucesso!",
                        )
                      }
                    >
                      <Trash2 className="mr-2 size-4" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
              <input
                ref={bannerInput}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => {
                  void prepareFiles(event.target.files, "banner");
                  event.currentTarget.value = "";
                }}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="presentation">Apresentação</Label>
              <Textarea
                id="presentation"
                rows={4}
                value={data.content.presentation}
                onChange={(event) =>
                  setData({ ...data, content: { ...data.content, presentation: event.target.value } })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contact">Texto de contato</Label>
              <Textarea
                id="contact"
                rows={3}
                value={data.content.contactText}
                onChange={(event) =>
                  setData({ ...data, content: { ...data.content, contactText: event.target.value } })
                }
              />
            </div>
          </div>
          <Button className="mt-5" onClick={() => persist(data, "Alterações atualizadas!")}>
            <Save />
            Salvar textos e configurações
          </Button>
        </section>

        {/* Seção de Projetos */}
        <section>
          <SectionHeader
            eyebrow="Portfólio"
            title="Projetos"
            action="Adicionar Projeto"
            onAction={() => projectInput.current?.click()}
          />
          <input
            ref={projectInput}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(event) => {
              void prepareFiles(event.target.files, "new-project");
              event.currentTarget.value = "";
            }}
          />
          <input
            ref={galleryInput}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(event) => {
              void prepareFiles(event.target.files, "add-gallery", galleryProjectId);
              event.currentTarget.value = "";
            }}
          />
          <div className="space-y-5">
            {data.projects.map((project) => (
              <article key={project.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="grid gap-5 md:grid-cols-[180px_1fr_auto]">
                  <div>
                    {isVideoUrl(project.src) ? (
                      <video
                        src={project.src}
                        className="aspect-[4/3] w-full rounded-md object-cover"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <img
                        src={project.src}
                        alt={project.alt}
                        className="aspect-[4/3] w-full rounded-md object-cover"
                      />
                    )}
                    <Button
                      className="mt-2 w-full"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditTarget({ kind: "project-cover", projectId: project.id })}
                    >
                      <Scissors />
                      Editar capa
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <Input
                      aria-label="Título do projeto"
                      value={project.title}
                      onChange={(event) =>
                        setData({
                          ...data,
                          projects: data.projects.map((item) =>
                            item.id === project.id ? { ...item, title: event.target.value } : item,
                          ),
                        })
                      }
                    />
                    <Textarea
                      aria-label="Descrição do projeto"
                      value={project.description}
                      onChange={(event) =>
                        setData({
                          ...data,
                          projects: data.projects.map((item) =>
                            item.id === project.id ? { ...item, description: event.target.value } : item,
                          ),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {project.gallery.length} {project.gallery.length === 1 ? "mídia" : "mídias"} na galeria
                    </p>
                  </div>
                  <div className="flex gap-2 md:flex-col">
                    <Button size="sm" onClick={() => persist(data, "Projeto salvo com sucesso!")}>
                      <Pencil />
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setGalleryProjectId(project.id);
                        galleryInput.current?.click();
                      }}
                    >
                      <ImagePlus />
                      Adicionar mídias
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        persist(
                          { ...data, projects: data.projects.filter((item) => item.id !== project.id) },
                          "Projeto excluído com sucesso!",
                        )
                      }
                    >
                      <Trash2 />
                      Excluir
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex gap-3 overflow-x-auto border-t border-border pt-4">
                  {project.gallery.map((image) => (
                    <div key={image.id} className="relative shrink-0">
                      {isVideoUrl(image.src) ? (
                        <video
                          src={image.src}
                          className="h-24 w-32 rounded-md object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <img src={image.src} alt={image.alt} className="h-24 w-32 rounded-md object-cover" />
                      )}
                      <Button
                        className="absolute bottom-1 right-1"
                        size="icon"
                        variant="secondary"
                        title="Editar mídia"
                        onClick={() =>
                          setEditTarget({ kind: "project-gallery", projectId: project.id, imageId: image.id })
                        }
                      >
                        <Scissors />
                        <span className="sr-only">Editar mídia</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Seção de Cotidiano */}
        <section>
          <SectionHeader
            eyebrow="Mural"
            title="Fotos do cotidiano"
            action="Adicionar Foto/Vídeo"
            onAction={() => dailyInput.current?.click()}
          />
          <input
            ref={dailyInput}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(event) => {
              void prepareFiles(event.target.files, "new-daily");
              event.currentTarget.value = "";
            }}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.daily.map((photo) => (
              <article key={photo.id} className="rounded-lg border border-border bg-surface p-3">
                {isVideoUrl(photo.src) ? (
                  <video
                    src={photo.src}
                    className="aspect-[4/3] w-full rounded-md object-cover"
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                ) : (
                  <img src={photo.src} alt={photo.alt} className="aspect-[4/3] w-full rounded-md object-cover" />
                )}
                <Input
                  className="mt-3"
                  aria-label="Título da foto"
                  value={photo.title}
                  onChange={(event) =>
                    setData({
                      ...data,
                      daily: data.daily.map((item) =>
                        item.id === photo.id ? { ...item, title: event.target.value, alt: event.target.value } : item,
                      ),
                    })
                  }
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => persist(data, "Alterações atualizadas!")}>
                    <Save />
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditTarget({ kind: "daily", imageId: photo.id })}
                  >
                    <Scissors />
                    Editar mídia
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      persist(
                        { ...data, daily: data.daily.filter((item) => item.id !== photo.id) },
                        "Mídia excluída com sucesso!",
                      )
                    }
                  >
                    <Trash2 />
                    Excluir
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {currentQueuedImage && (
        <ImageEditor
          open
          source={currentQueuedImage.src}
          title={currentQueuedImage.title}
          stepLabel={`Mídia ${cropQueue.index + 1} de ${cropQueue.images.length}`}
          onCancel={() => setCropQueue(undefined)}
          onSave={acceptQueuedCrop}
        />
      )}
      {existingImage && (
        <ImageEditor
          open
          source={existingImage.src}
          title={existingImage.title}
          onCancel={() => setEditTarget(undefined)}
          onSave={acceptExistingCrop}
        />
      )}

      <Dialog
        open={draftImages.length > 0}
        onOpenChange={(open) => {
          if (!open) setDraftImages([]);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo projeto</DialogTitle>
            <DialogDescription>
              {draftImages.length} {draftImages.length === 1 ? "mídia será adicionada" : "mídias serão adicionadas"} à
              mesma galeria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto">
              {draftImages.map((image) =>
                isVideoUrl(image.src) ? (
                  <video
                    key={image.id}
                    src={image.src}
                    className="h-20 w-28 shrink-0 rounded-md object-cover"
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                ) : (
                  <img
                    key={image.id}
                    src={image.src}
                    alt={image.alt}
                    className="h-20 w-28 shrink-0 rounded-md object-cover"
                  />
                ),
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-title">Título</Label>
              <Input id="project-title" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Descrição</Label>
              <Textarea
                id="project-description"
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraftImages([])}>
              Cancelar
            </Button>
            <Button onClick={createProject}>
              <Save />
              Salvar projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm uppercase text-primary">{eyebrow}</p>
        <h2 className="mt-1 font-display text-3xl font-semibold">{title}</h2>
      </div>
      <Button onClick={onAction}>
        <Plus />
        {action}
      </Button>
    </div>
  );
}
